import csv

from django.db.models import CharField, F, OuterRef, Subquery, Value
from django.db.models.functions import Coalesce, Concat, NullIf, Trim
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from .models import Attendance
from .permissions import CanManageAttendance
from .serializers import AttendanceSerializer


def get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        ip = request.META.get('REMOTE_ADDR', '').strip()
    return ip


def verify_office_wifi(request):
    from apps.users.models import CompanyProfile
    profile = CompanyProfile.objects.filter(pk=1).first()
    if not profile or not profile.wifi_restriction_enabled:
        return

    allowed_ips = [ip.strip() for ip in (profile.allowed_wifi_ips or "").split(",") if ip.strip()]
    if not allowed_ips:
        return

    client_ip = get_client_ip(request)
    is_allowed = False
    for allowed in allowed_ips:
        if client_ip == allowed:
            is_allowed = True
            break
        if allowed in ("127.0.0.1", "localhost", "::1") and client_ip in ("127.0.0.1", "localhost", "::1"):
            is_allowed = True
            break
        if allowed.endswith(".") and client_ip.startswith(allowed):
            is_allowed = True
            break

    if not is_allowed:
        from rest_framework.exceptions import PermissionDenied
        raise PermissionDenied(
            f"Check-in denied: You must be connected to the Office Wi-Fi network. (Your IP: {client_ip})"
        )


class AttendanceViewSet(viewsets.ModelViewSet):
    """
    - CEO/HR/CTO: see attendance across all departments.
    - Team Lead: see attendance for own department only.
    - Employee: see + mark only their own attendance (via check_in/check_out —
      direct create/update/destroy of an attendance record is manager-only).
    """
    serializer_class = AttendanceSerializer
    permission_classes = [permissions.IsAuthenticated, CanManageAttendance]

    def _annotate_and_order(self, qs):
        """Attach a display-ready department name + employee name (both derived
        via subquery since Attendance only stores raw employee_id/department_id,
        not FKs) and order consistently everywhere: date, then employee name,
        then team/department name — so same-date rows never come back "mixed"."""
        from apps.users.models import Department, User

        department_name_sq = Department.objects.filter(
            pk=OuterRef("department_id")
        ).values("name")[:1]
        full_name_sq = User.objects.filter(pk=OuterRef("employee_id")).annotate(
            full_name=Trim(Concat("first_name", Value(" "), "last_name"))
        ).values("full_name")[:1]

        qs = qs.annotate(
            department_name=Coalesce(
                Subquery(department_name_sq, output_field=CharField()), Value("")
            ),
            employee_full_name=Coalesce(
                Subquery(full_name_sq, output_field=CharField()), Value("")
            ),
        ).annotate(
            employee_display_name=Coalesce(
                NullIf(F("employee_full_name"), Value("")), F("employee_username")
            )
        )
        return qs.order_by("-date", "employee_display_name", "department_name")

    def get_queryset(self):
        user = self.request.user
        qs = Attendance.objects.all()
        if user.can_see_all_departments:
            pass
        elif user.is_team_lead:
            qs = qs.filter(department_id=user.department_id)
        else:
            qs = qs.filter(employee_id=user.id)
        return self._annotate_and_order(qs)

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
        verify_office_wifi(request)
        user = request.user
        now = timezone.now()
        local_time = timezone.localtime(now)
        cutoff_time = timezone.datetime.strptime("09:30:00", "%H:%M:%S").time()
        status_value = Attendance.Status.LATE if local_time.time() > cutoff_time else Attendance.Status.PRESENT

        obj, created = Attendance.objects.get_or_create(
            employee_id=user.id,
            date=local_time.date(),
            defaults={
                "employee_username": user.username,
                "department_id": user.department_id,
                "status": status_value,
                "check_in": now,
            },
        )

        if not created:
            # The dashboard toggle is reversible: if the employee checked out
            # earlier today and switches the toggle back ON, reopen the same
            # attendance record instead of creating a second row (the model
            # intentionally has one row per employee/date). Preserve the
            # original check-in timestamp and simply clear check_out.
            if obj.check_out is not None:
                obj.check_out = None
                obj.save(update_fields=["check_out"])
                return Response(AttendanceSerializer(obj).data)

            return Response(
                {
                    "detail": "You have already checked in today.",
                    "data": AttendanceSerializer(obj).data,
                },
                status=400,
            )

        return Response(AttendanceSerializer(obj).data)

    @action(detail=False, methods=["post"])
    def check_out(self, request):
        verify_office_wifi(request)
        user = request.user
        try:
            obj = Attendance.objects.get(employee_id=user.id, date=timezone.now().date())
        except Attendance.DoesNotExist:
            return Response({"detail": "No check-in found for today."}, status=400)

        if obj.check_out is not None:
            return Response(
                {
                    "detail": "You have already checked out today.",
                    "data": AttendanceSerializer(obj).data,
                },
                status=400,
            )

        obj.check_out = timezone.now()
        obj.save()
        return Response(AttendanceSerializer(obj).data)

    @action(detail=False, methods=["get"])
    def export_csv(self, request):
        """A month's attendance as a CSV download, grouped for readability
        rather than just date-sorted:
          - Team Lead (and anyone else scoped to a single department, or an
            employee downloading only their own rows): one employee's full
            month, in date order, then the next employee — alphabetically.
          - Anyone who can see all departments (CEO/HR/Admin/CTO): one
            department's employees (each employee's full month together),
            then the next department — alphabetically, department by
            department.
        Defaults to the current calendar month; pass ?year=YYYY&month=M to
        export a different one, and ?employee_id=ID to scope the export to
        a single employee (still subject to the normal department/self
        scoping above — a Team Lead can't pass another department's id).
        Check-in/out are local time, split into a clear date + time,
        department is shown by name, and a blank row separates each group
        for readability in Excel/Sheets."""
        user = request.user
        queryset = self.filter_queryset(self.get_queryset())

        today_local = timezone.localtime(timezone.now()).date()
        year = today_local.year
        month = today_local.month
        raw_year = request.query_params.get("year")
        raw_month = request.query_params.get("month")
        if raw_year and raw_year.isdigit():
            year = int(raw_year)
        if raw_month and raw_month.isdigit() and 1 <= int(raw_month) <= 12:
            month = int(raw_month)

        queryset = queryset.filter(date__year=year, date__month=month)

        raw_employee_id = request.query_params.get("employee_id")
        filename_suffix = ""
        if raw_employee_id and raw_employee_id.isdigit():
            queryset = queryset.filter(employee_id=int(raw_employee_id))
            username = queryset.values_list("employee_username", flat=True).first()
            if username:
                filename_suffix = f"_{username}"

        if user.can_see_all_departments:
            queryset = queryset.order_by("department_name", "employee_display_name", "date")

            def group_key(record):
                return (record.department_id, record.employee_id)
        else:
            queryset = queryset.order_by("employee_display_name", "date")

            def group_key(record):
                return record.employee_id

        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = (
            f'attachment; filename="attendance_{year:04d}-{month:02d}{filename_suffix}.csv"'
        )
        writer = csv.writer(response)
        writer.writerow(
            ["Employee", "Username", "Department", "Date", "Check In", "Check Out", "Hours", "Location", "Status"]
        )

        sentinel = object()
        previous_key = sentinel
        for record in queryset:
            key = group_key(record)
            if previous_key is not sentinel and key != previous_key:
                writer.writerow([])
            previous_key = key

            check_in_local = timezone.localtime(record.check_in) if record.check_in else None
            check_out_local = timezone.localtime(record.check_out) if record.check_out else None
            hours = ""
            if check_in_local and check_out_local:
                total_minutes = int((check_out_local - check_in_local).total_seconds() // 60)
                if total_minutes >= 0:
                    h, m = divmod(total_minutes, 60)
                    hours = f"{h}h {m:02d}m"

            writer.writerow([
                record.employee_display_name,
                record.employee_username,
                record.department_name or "—",
                record.date.strftime("%Y-%m-%d"),
                check_in_local.strftime("%I:%M:%S %p") if check_in_local else "—",
                check_out_local.strftime("%I:%M:%S %p") if check_out_local else "—",
                hours or "—",
                record.get_location_display(),
                record.get_status_display(),
            ])
        return response