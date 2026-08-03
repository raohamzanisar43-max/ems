from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from .models import User, Department, CustomRole, CompanyProfile


class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ["id", "name", "code"]


class CustomRoleSerializer(serializers.ModelSerializer):
    user_count = serializers.SerializerMethodField()

    class Meta:
        model = CustomRole
        fields = [
            "id", "name", "code", "description",
            "can_see_all_departments", "can_manage_employees", "can_manage_payroll",
            "can_review_leaves_reports", "can_manage_tasks_all",
            "created_at", "user_count",
        ]
        read_only_fields = ["code", "created_at"]

    def get_user_count(self, obj):
        return obj.users.count()

    def create(self, validated_data):
        from django.utils.text import slugify
        validated_data["code"] = slugify(validated_data["name"]).upper().replace("-", "_")
        return super().create(validated_data)


class CompanyProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = CompanyProfile
        fields = [
            "id", "name", "address", "phone", "email", "website", "logo_url",
            "wifi_restriction_enabled", "allowed_wifi_ips", "updated_at",
        ]
        read_only_fields = ["updated_at"]


class UserListSerializer(serializers.ModelSerializer):
    """Used when listing and updating employees."""
    department_name = serializers.CharField(source="department.name", read_only=True)
    reporting_manager_name = serializers.SerializerMethodField()
    custom_role_name = serializers.CharField(source="custom_role.name", read_only=True)

    class Meta:
        model = User
        fields = [
            "id", "username", "email", "first_name", "last_name",
            "role", "department", "department_name", "phone",
            "date_joined_company", "is_active_employee",
            "employee_type", "personal_email", "cnic", "residential_address",
            "date_of_birth", "reporting_manager", "reporting_manager_name",
            "custom_role", "custom_role_name",
        ]
        read_only_fields = []

    def get_reporting_manager_name(self, obj):
        if not obj.reporting_manager_id:
            return None
        mgr = obj.reporting_manager
        return f"{mgr.first_name} {mgr.last_name}".strip() or mgr.username

    def validate_role(self, value):
        request = self.context.get("request")
        if request and not (request.user.is_admin or request.user.is_hr):
            raise serializers.ValidationError("Only HR/Admin can change employee roles.")
        return value

    def validate_custom_role(self, value):
        request = self.context.get("request")
        if request and value is not None and not (request.user.is_admin or request.user.is_hr):
            raise serializers.ValidationError("Only HR/Admin can assign a custom role.")
        return value

    def validate_department(self, value):
        request = self.context.get("request")
        if request and not request.user.can_manage_employees:
            raise serializers.ValidationError("You are not allowed to change department.")
        return value


class UserCreateSerializer(serializers.ModelSerializer):
    """
    Used by HR/Team Lead to create a new employee account.
    """
    password = serializers.CharField(write_only=True)
    department = serializers.PrimaryKeyRelatedField(queryset=Department.objects.all(), required=False, allow_null=True)
    reporting_manager = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), required=False, allow_null=True)

    class Meta:
        model = User
        fields = [
            "id", "username", "email", "first_name", "last_name",
            "role", "department", "phone", "date_joined_company", "password",
            "employee_type", "personal_email", "cnic", "residential_address",
            "date_of_birth", "reporting_manager", "custom_role",
        ]

    def validate_password(self, value):
        validate_password(value)
        return value

    def validate_custom_role(self, value):
        request = self.context.get("request")
        if value is not None and not (request.user.is_admin or request.user.is_hr):
            raise serializers.ValidationError("Only HR/Admin can assign a custom role.")
        return value

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        user._generated_password = password
        return user
