from rest_framework import permissions


class IsFinanceOrHR(permissions.BasePermission):
    """Only Finance and HR (or a custom role granted payroll access) can create,
    edit, or delete payslips. Everyone else is read-only here — the queryset
    already scopes reads to the caller's own payslip."""
    def has_permission(self, request, view):
        u = request.user
        if view.action in ("create", "update", "partial_update", "destroy"):
            return bool(u.can_manage_payroll)
        return True
