from django.utils import timezone
from rest_framework import viewsets, permissions
from rest_framework.exceptions import ValidationError
from .models import Task
from .serializers import TaskSerializer
from .permissions import CanManageTask
from apps.common.permissions import DepartmentScopedQuerysetMixin


class TaskViewSet(DepartmentScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated, CanManageTask]
    department_field = "department_id"
    owner_field = "assigned_to_id"

    def _assert_assignee_in_own_department(self, user, assigned_to_id):
        from apps.users.models import User
        if assigned_to_id is None:
            return
        assignee = User.objects.filter(id=assigned_to_id).first()
        if assignee is None or assignee.department_id != user.department_id:
            raise ValidationError({"assigned_to_id": "You can only assign tasks within your own department."})

    def perform_create(self, serializer):
        user = self.request.user
        if user.can_see_all_departments:
            serializer.save(created_by_id=user.id)
        elif user.is_team_lead:
            # A team lead can assign within their own department only —
            # force the department regardless of what was submitted.
            self._assert_assignee_in_own_department(user, serializer.validated_data.get("assigned_to_id"))
            serializer.save(created_by_id=user.id, department_id=user.department_id)
        else:
            # Employees without task-management rights can only ever create a
            # task assigned to themselves — override whatever was submitted.
            serializer.save(
                created_by_id=user.id,
                assigned_to_id=user.id,
                assigned_to_username=user.username,
                department_id=user.department_id,
            )

    def perform_update(self, serializer):
        user = self.request.user
        instance = serializer.instance
        new_status = serializer.validated_data.get("status", instance.status)
        extra = {}
        if new_status == Task.Status.IN_PROGRESS and instance.status != Task.Status.IN_PROGRESS:
            extra["started_at"] = timezone.now()
        if new_status == Task.Status.COMPLETED and instance.status != Task.Status.COMPLETED:
            extra["completed_at"] = timezone.now()
        if user.can_see_all_departments:
            pass  # unrestricted
        elif user.is_team_lead:
            # Same own-department-only rule applies on update/reassignment.
            new_assigned_to_id = serializer.validated_data.get("assigned_to_id", instance.assigned_to_id)
            self._assert_assignee_in_own_department(user, new_assigned_to_id)
            extra["department_id"] = instance.department_id
        else:
            # An employee can change status/progress on their own task, but
            # can't reassign it to someone else.
            extra["assigned_to_id"] = instance.assigned_to_id
            extra["assigned_to_username"] = instance.assigned_to_username
            extra["department_id"] = instance.department_id
        serializer.save(**extra)
