from django.contrib.auth.password_validation import validate_password
from django.db import transaction

from rest_framework import serializers, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import User
from apps.employees.models import EmployeeProfile


def _build_employee_code_for_user(user):
    base_code = f"EMP-{user.id}"

    if not EmployeeProfile.objects.filter(employee_code=base_code).exists():
        return base_code

    suffix = 1
    while EmployeeProfile.objects.filter(employee_code=f"{base_code}-{suffix}").exists():
        suffix += 1

    return f"{base_code}-{suffix}"


def _ensure_employee_profile_for_user(user):
    profile = EmployeeProfile.objects.filter(user_id=user.id).first()

    if profile is None:
        profile = EmployeeProfile.objects.create(
            user_id=user.id,
            username=user.username,
            department_id=user.department_id,
            employee_code=_build_employee_code_for_user(user),
        )
        return profile

    changed = False

    if not profile.employee_code:
        profile.employee_code = _build_employee_code_for_user(user)
        changed = True

    if profile.username != user.username:
        profile.username = user.username
        changed = True

    if profile.department_id != user.department_id:
        profile.department_id = user.department_id
        changed = True

    if changed:
        profile.save(update_fields=["username", "department_id", "employee_code"])

    return profile


class MyProfileSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(
        source="department.name",
        read_only=True,
    )

    reporting_manager_name = serializers.SerializerMethodField()

    role_label = serializers.CharField(
        source="get_role_display",
        read_only=True,
    )

    employee_type_label = serializers.CharField(
        source="get_employee_type_display",
        read_only=True,
    )

    profile_picture_url = serializers.SerializerMethodField()

    class Meta:
        model = User

        fields = [
            "id",
            "username",
            "first_name",
            "last_name",
            "email",
            "phone",
            "personal_email",
            "residential_address",
            "date_of_birth",
            "role",
            "role_label",
            "employee_type",
            "employee_type_label",
            "department",
            "department_name",
            "date_joined_company",
            "is_active_employee",
            "reporting_manager",
            "reporting_manager_name",
            "profile_picture",
            "profile_picture_url",
        ]

        read_only_fields = [
            "id",
            "username",
            "role",
            "role_label",
            "employee_type",
            "employee_type_label",
            "department",
            "department_name",
            "date_joined_company",
            "is_active_employee",
            "reporting_manager",
            "reporting_manager_name",
            "profile_picture_url",
        ]

    def get_reporting_manager_name(self, obj):
        if not obj.reporting_manager_id:
            return None

        manager = obj.reporting_manager

        name = f"{manager.first_name} {manager.last_name}".strip()

        return name or manager.username

    def get_profile_picture_url(self, obj):
        request = self.context.get("request")

        if not obj.profile_picture:
            return None

        url = obj.profile_picture.url

        if request:
            return request.build_absolute_uri(url)

        return url


class MyEmployeeProfileSerializer(serializers.ModelSerializer):
    department_name = serializers.SerializerMethodField()

    class Meta:
        model = EmployeeProfile

        fields = [
            "id",
            "designation",
            "employee_code",
            "joining_date",
            "skills",
            "bio",
            "work_location",
            "grade",
            "cost_center",
            "office_start_time",
            "office_end_time",
            "is_dual_shift",
            "second_shift_start_time",
            "second_shift_end_time",
            "emergency_contact_name",
            "emergency_contact_relationship",
            "emergency_contact_phone",
            "department_name",
        ]

        read_only_fields = [
            "id",
            "employee_code",
            "joining_date",
            "department_name",
            "office_start_time",
            "office_end_time",
            "is_dual_shift",
            "second_shift_start_time",
            "second_shift_end_time",
        ]

    def get_department_name(self, obj):
        from apps.users.models import Department

        if not obj.department_id:
            return None

        return (
            Department.objects
            .filter(id=obj.department_id)
            .values_list("name", flat=True)
            .first()
        )


class MyProfileView(APIView):
    """
    GET:
        Returns the current user's account and employee profile.

    PATCH:
        Updates safe self-service fields and optionally uploads
        a profile picture.
    """

    permission_classes = [
        IsAuthenticated
    ]

    @transaction.atomic
    def get(self, request):
        user = request.user

        employee_profile = _ensure_employee_profile_for_user(user)

        return Response({
            "user": MyProfileSerializer(
                user,
                context={"request": request},
            ).data,

            "employee_profile": MyEmployeeProfileSerializer(
                employee_profile,
                context={"request": request},
            ).data,
        })

    @transaction.atomic
    def patch(self, request):
        user = request.user

        employee_profile = _ensure_employee_profile_for_user(user)

        user_allowed_fields = [
            "first_name",
            "last_name",
            "phone",
            "personal_email",
            "residential_address",
            "date_of_birth",
        ]

        employee_allowed_fields = [
            "designation",
            "skills",
            "bio",
            "work_location",
            "emergency_contact_name",
            "emergency_contact_relationship",
            "emergency_contact_phone",
        ]

        user_data = {}
        employee_data = {}

        for field in user_allowed_fields:
            if field in request.data:
                user_data[field] = request.data[field]

        for field in employee_allowed_fields:
            if field in request.data:
                employee_data[field] = request.data[field]

        user_serializer = MyProfileSerializer(
            user,
            data=user_data,
            partial=True,
            context={"request": request},
        )

        user_serializer.is_valid(
            raise_exception=True
        )

        employee_serializer = MyEmployeeProfileSerializer(
            employee_profile,
            data=employee_data,
            partial=True,
            context={"request": request},
        )

        employee_serializer.is_valid(
            raise_exception=True
        )

        user_serializer.save()

        if not employee_profile.employee_code:
            employee_profile.employee_code = _build_employee_code_for_user(user)

        employee_serializer.save(
            user_id=user.id,
            username=user.username,
            department_id=user.department_id,
        )

        return Response({
            "user": MyProfileSerializer(
                user,
                context={"request": request},
            ).data,

            "employee_profile": MyEmployeeProfileSerializer(
                employee_profile,
                context={"request": request},
            ).data,
        })

    @transaction.atomic
    def post(self, request):
        """
        Used specifically for multipart/form-data profile-picture uploads.
        """

        user = request.user

        picture = request.FILES.get(
            "profile_picture"
        )

        if not picture:
            return Response(
                {
                    "detail": (
                        "No profile picture was provided."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Basic server-side file checks.
        allowed_types = {
            "image/jpeg",
            "image/png",
            "image/webp",
        }

        if picture.content_type not in allowed_types:
            return Response(
                {
                    "detail": (
                        "Only JPG, PNG, and WebP images are allowed."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 5 MB maximum.
        if picture.size > 5 * 1024 * 1024:
            return Response(
                {
                    "detail": (
                        "Profile picture must be smaller than 5 MB."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.profile_picture = picture
        user.save(
            update_fields=["profile_picture"]
        )

        return Response(
            MyProfileSerializer(
                user,
                context={"request": request},
            ).data
        )


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(
        write_only=True
    )

    new_password = serializers.CharField(
        write_only=True
    )

    confirm_password = serializers.CharField(
        write_only=True
    )

    def validate(self, attrs):
        user = self.context["request"].user

        if not user.check_password(
            attrs["current_password"]
        ):
            raise serializers.ValidationError({
                "current_password": (
                    "Current password is incorrect."
                )
            })

        if attrs["new_password"] != attrs["confirm_password"]:
            raise serializers.ValidationError({
                "confirm_password": (
                    "New passwords do not match."
                )
            })

        validate_password(
            attrs["new_password"],
            user,
        )

        return attrs


class ChangePasswordView(APIView):
    permission_classes = [
        IsAuthenticated
    ]

    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data,
            context={"request": request},
        )

        serializer.is_valid(
            raise_exception=True
        )

        user = request.user

        user.set_password(
            serializer.validated_data["new_password"]
        )

        user.save(
            update_fields=["password"]
        )

        return Response({
            "detail": "Password changed successfully."
        })