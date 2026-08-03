from rest_framework import permissions


class CanManageAttendance(permissions.BasePermission):
    """check_in/check_out/export_csv/list/retrieve stay open to any authenticated
    user (further scoped by the queryset). Direct create/update/destroy — i.e.
    manually backfilling or editing someone's attendance record — is HR/Admin/
    CEO/CTO/Team-Lead(own department) only, so an employee can't falsify or
    erase their own attendance."""
    def has_permission(self, request, view):
        u = request.user
        if view.action in ("create", "update", "partial_update", "destroy"):
            return bool(u.can_manage_employees)
        return True
