from rest_framework import serializers
from .models import EmployeeProfile


class EmployeeProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmployeeProfile
        fields = [
            "id", "user_id", "username", "department_id",
            "designation", "employee_code", "joining_date", "skills", "bio", "updated_at",
        ]
