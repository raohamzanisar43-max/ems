"""
Shared permission/queryset scoping used across domain apps.
Rule of thumb across the whole system:
  - CEO / CTO / HR -> see everything, all departments
  - Team Lead      -> see only their own department's data
  - Employee       -> see only their own records
"""
from rest_framework import permissions


class IsCEOorHR(permissions.BasePermission):
    def has_permission(self, request, view):
        u = request.user
        return bool(u and u.is_authenticated and u.can_see_all_departments)


class DepartmentScopedQuerysetMixin:
    """
    Mixin for ViewSets. Filters queryset by department unless the user is CEO/CTO/HR.
    Assumes the model has a `department_id` field.
    """
    department_field = "department_id"

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if user.can_see_all_departments:
            return qs
        if user.is_team_lead:
            return qs.filter(**{self.department_field: user.department_id})
        owner_field = getattr(self, "owner_field", "assigned_to_id")
        return qs.filter(**{owner_field: user.id})
