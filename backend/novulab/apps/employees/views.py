from rest_framework import viewsets, permissions
from rest_framework.exceptions import ValidationError
from .models import EmployeeProfile
from .serializers import EmployeeProfileSerializer


class CanManageEmployeeProfile(permissions.BasePermission):
    """Only HR/Admin/CEO/CTO (any department) or a Team Lead (their own
    department only) may create/edit/delete an employee profile. Everyone
    else is read-only here — the queryset already scopes reads."""
    def has_permission(self, request, view):
        u = request.user
        if view.action in ("create", "update", "partial_update", "destroy"):
            return bool(u.can_manage_employees)
        return True


class EmployeeProfileViewSet(viewsets.ModelViewSet):
    serializer_class = EmployeeProfileSerializer
    permission_classes = [permissions.IsAuthenticated, CanManageEmployeeProfile]

    def get_queryset(self):
        user = self.request.user
        qs = EmployeeProfile.objects.all()
        if user.can_see_all_departments:
            return qs
        if user.is_team_lead:
            return qs.filter(department_id=user.department_id)
        return qs.filter(user_id=user.id)

    def _target_user(self, user_id):
        from apps.users.models import User
        return User.objects.filter(id=user_id).first()

    def perform_create(self, serializer):
        requester = self.request.user
        target = self._target_user(serializer.validated_data.get("user_id"))
        if target is None:
            raise ValidationError({"user_id": "No employee exists with this user_id."})
        if requester.is_team_lead and not requester.can_see_all_departments:
            if target.department_id != requester.department_id:
                raise ValidationError({"user_id": "You can only create profiles within your own department."})
        # department_id/username always mirror the real user record, never the client's input.
        serializer.save(department_id=target.department_id, username=target.username)

    def perform_update(self, serializer):
        requester = self.request.user
        instance = serializer.instance
        if requester.is_team_lead and not requester.can_see_all_departments:
            if instance.department_id != requester.department_id:
                raise ValidationError({"detail": "You can only edit profiles within your own department."})
        serializer.save(department_id=instance.department_id, username=instance.username, user_id=instance.user_id)
