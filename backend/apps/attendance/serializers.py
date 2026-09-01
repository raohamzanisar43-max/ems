from rest_framework import serializers
from .models import Attendance


class AttendanceSerializer(serializers.ModelSerializer):
    department_name = serializers.SerializerMethodField()
    employee_display_name = serializers.SerializerMethodField()
    hours_worked = serializers.SerializerMethodField()
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    location_display = serializers.CharField(source="get_location_display", read_only=True)

    class Meta:
        model = Attendance
        fields = [
            "id", "employee_id", "employee_username", "employee_display_name",
            "department_id", "department_name",
            "date", "check_in", "check_out", "hours_worked",
            "status", "status_display", "location", "location_display",
        ]
        read_only_fields = ["employee_username", "department_id"]

    def get_department_name(self, obj):
        # Populated for free when the queryset was annotated (AttendanceViewSet
        # list/export); falls back to a direct lookup otherwise (e.g. the
        # single-instance response from check_in/check_out).
        name = getattr(obj, "department_name", None)
        if name:
            return name
        if not obj.department_id:
            return None
        from apps.users.models import Department
        dept = Department.objects.filter(pk=obj.department_id).first()
        return dept.name if dept else None

    def get_employee_display_name(self, obj):
        name = getattr(obj, "employee_display_name", None)
        if name:
            return name
        from apps.users.models import User
        user = User.objects.filter(pk=obj.employee_id).first()
        if user:
            full = f"{user.first_name} {user.last_name}".strip()
            if full:
                return full
        return obj.employee_username

    def get_hours_worked(self, obj):
        if not obj.check_in or not obj.check_out:
            return None
        total_minutes = int((obj.check_out - obj.check_in).total_seconds() // 60)
        if total_minutes < 0:
            return None
        hours, minutes = divmod(total_minutes, 60)
        return f"{hours}h {minutes:02d}m"
