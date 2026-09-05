from rest_framework import serializers
from .models import EmployeeProfile


class EmployeeProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmployeeProfile

        fields = [
            "id",
            "user_id",
            "username",
            "department_id",
            "designation",
            "employee_code",
            "joining_date",
            "skills",
            "bio",
            "work_location",
            "office_start_time",
            "office_end_time",
            "is_dual_shift",
            "second_shift_start_time",
            "second_shift_end_time",
            "grade",
            "cost_center",
            "emergency_contact_name",
            "emergency_contact_relationship",
            "emergency_contact_phone",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "username",
            "department_id",
            "updated_at",
        ]