from django.conf import settings
from django.db import transaction
from rest_framework import viewsets, permissions, status, generics
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import User, Department, CustomRole, CompanyProfile
from .serializers import (
    UserListSerializer, UserCreateSerializer, DepartmentSerializer,
    CustomRoleSerializer, CompanyProfileSerializer,
)
from .signals import send_credentials_email
from apps.attendance.models import Attendance
from apps.tasks.models import Task
from apps.leaves.models import LeaveRequest
from apps.payroll.models import Payslip
from apps.notifications.models import Notification
from apps.reports.models import DailyReport
from apps.chat.models import Conversation, Message
from apps.employees.models import EmployeeProfile


class IsHRorCEO(permissions.BasePermission):
    def has_permission(self, request, view):
        u = request.user
        return u.is_authenticated and (u.is_admin or u.is_hr or u.is_ceo or u.is_cto)


class IsHRorAdmin(permissions.BasePermission):
    """Strictly HR/Admin — unlike IsHRorCEO, CEO/CTO are deliberately excluded.
    Used for Roles/Permissions/Settings, which are HR+Admin-only by design."""
    def has_permission(self, request, view):
        u = request.user
        return u.is_authenticated and (u.is_admin or u.is_hr)


class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [IsHRorCEO]


class CustomRoleViewSet(viewsets.ModelViewSet):
    """HR/Admin can create custom roles with their own permission flags."""
    queryset = CustomRole.objects.all().order_by("name")
    serializer_class = CustomRoleSerializer
    permission_classes = [IsHRorAdmin]


class CompanyProfileView(generics.RetrieveUpdateAPIView):
    """Singleton company profile shown on the Settings page. HR/Admin only."""
    serializer_class = CompanyProfileSerializer
    permission_classes = [IsHRorAdmin]

    def get_object(self):
        obj, _ = CompanyProfile.objects.get_or_create(pk=1)
        return obj


class UserViewSet(viewsets.ModelViewSet):
    """
    - HR/CEO/CTO: see, manage, and delete all employees.
    - Team Lead: see + create only within own department (Employee role only).
    - Employee: see only own profile.
    """
    serializer_class = UserListSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.can_see_all_departments:
            return User.objects.all()
        if user.is_team_lead:
            return User.objects.filter(department=user.department)
        return User.objects.filter(id=user.id)

    def get_serializer_class(self):
        if self.action == "create":
            return UserCreateSerializer
        return UserListSerializer

    def get_permissions(self):
        if self.action == "create":
            return [permissions.IsAuthenticated(), IsHRorAdmin()]
        if self.action == "destroy":
            return [permissions.IsAuthenticated(), IsHRorCEO()]
        return super().get_permissions()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        send_credentials_email(user, user._generated_password)
        data = UserListSerializer(user).data
        # No real mailbox is wired up yet (see EMAIL_BACKEND in settings.py), so the
        # credentials email only ever reaches the console/log. Surface the password
        # directly in dev so HR can actually hand it to the employee.
        if settings.DEBUG:
            data["generated_password"] = user._generated_password
        return Response(data, status=status.HTTP_201_CREATED)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.id == request.user.id:
            return Response({"detail": "You can't delete your own account."}, status=status.HTTP_400_BAD_REQUEST)

        employee_id = instance.id

        with transaction.atomic():
            Attendance.objects.filter(employee_id=employee_id).delete()
            Task.objects.filter(assigned_to_id=employee_id).delete()
            LeaveRequest.objects.filter(employee_id=employee_id).delete()
            Payslip.objects.filter(employee_id=employee_id).delete()
            Notification.objects.filter(recipient_id=employee_id).delete()
            DailyReport.objects.filter(employee_id=employee_id).delete()
            Message.objects.filter(sender_id=employee_id).delete()
            conversation_ids = [
                c.id for c in Conversation.objects.only("id", "participant_ids")
                if employee_id in (c.participant_ids or [])
            ]
            Conversation.objects.filter(id__in=conversation_ids).delete()
            EmployeeProfile.objects.filter(user_id=employee_id).delete()
            instance.delete()

        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=["get"])
    def me(self, request):
        return Response(UserListSerializer(request.user).data)
