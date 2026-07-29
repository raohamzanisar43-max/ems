import csv

from django.http import HttpResponse
from django.utils import timezone
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from .models import Attendance
from .permissions import CanManageAttendance
from .serializers import AttendanceSerializer


class AttendanceViewSet(viewsets.ModelViewSet):
    """
    - CEO/HR/CTO: see attendance across all departments.
    - Team Lead: see attendance for own department only.
    - Employee: see + mark only their own attendance (via check_in/check_out —
      direct create/update/destroy of an attendance record is manager-only).
    """
    serializer_class = AttendanceSerializer
    permission_classes = [permissions.IsAuthenticated, CanManageAttendance]

    def get_queryset(self):
        user = self.request.user
        qs = Attendance.objects.all()
        if user.can_see_all_departments:
            return qs
        if user.is_team_lead:
            return qs.filter(department_id=user.department_id)
        return qs.filter(employee_id=user.id)

    def _resolve_target(self, requester, employee_id):
        from apps.users.models import User
        if employee_id is None:
            raise ValidationError({"employee_id": "employee_id is required."})
        target = User.objects.filter(id=employee_id).first()
        if target is None:
            raise ValidationError({"employee_id": "No employee exists with this employee_id."})
        if requester.is_team_lead and not requester.can_see_all_departments and target.department_id != requester.department_id:
            raise ValidationError({"employee_id": "You can only manage attendance within your own department."})
        return target

    def perform_create(self, serializer):
        target = self._resolve_target(self.request.user, serializer.validated_data.get("employee_id"))
        serializer.save(employee_id=target.id, employee_username=target.username, department_id=target.department_id)

    def perform_update(self, serializer):
        instance = serializer.instance
        new_employee_id = serializer.validated_data.get("employee_id", instance.employee_id)
        if new_employee_id != instance.employee_id:
            target = self._resolve_target(self.request.user, new_employee_id)
            serializer.save(employee_id=target.id, employee_username=target.username, department_id=target.department_id)
        else:
            serializer.save()

    @action(detail=False, methods=["post"])
    def check_in(self, request):
        user = request.user
        obj, _ = Attendance.objects.get_or_create(
            employee_id=user.id,
            date=timezone.now().date(),
            defaults={
                "employee_username": user.username,
                "department_id": user.department_id,
            },
        )
        obj.check_in = timezone.now()
        obj.save()
        return Response(AttendanceSerializer(obj).data)

    @action(detail=False, methods=["post"])
    def check_out(self, request):
        user = request.user
        try:
            obj = Attendance.objects.get(employee_id=user.id, date=timezone.now().date())
        except Attendance.DoesNotExist:
            return Response({"detail": "No check-in found for today."}, status=400)
        obj.check_out = timezone.now()
        obj.save()
        return Response(AttendanceSerializer(obj).data)

    @action(detail=False, methods=["get"])
    def export_csv(self, request):
        """Same department-scoped queryset as the list view, as a CSV download."""
        queryset = self.filter_queryset(self.get_queryset())

        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = (
            f'attachment; filename="attendance_{timezone.now().date()}.csv"'
        )
        writer = csv.writer(response)
        writer.writerow(["Employee", "Department ID", "Date", "Check In", "Check Out", "Status"])
        for record in queryset.order_by("-date", "employee_username"):
            writer.writerow([
                record.employee_username,
                record.department_id or "",
                record.date,
                record.check_in.isoformat() if record.check_in else "",
                record.check_out.isoformat() if record.check_out else "",
                record.status,
            ])
        return response
