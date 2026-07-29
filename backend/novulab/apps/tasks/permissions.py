from rest_framework import permissions


class CanManageTask(permissions.BasePermission):
    """
    - CEO/CTO/HR/Team Lead can create+assign tasks (within their scope).
    - Employee can only update status/progress on tasks assigned to them.
    """
    def has_object_permission(self, request, view, obj):
        user = request.user
        if user.can_manage_tasks_all:
            return True
        return obj.assigned_to_id == user.id
