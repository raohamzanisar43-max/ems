from django.db import models


class Attendance(models.Model):
    class Status(models.TextChoices):
        PRESENT = "PRESENT", "Present"
        ABSENT = "ABSENT", "Absent"
        LATE = "LATE", "Late"
        HALF_DAY = "HALF_DAY", "Half Day"

    class Location(models.TextChoices):
        OFFICE = "OFFICE", "Office (HQ)"
        REMOTE = "REMOTE", "Remote"

    employee_id = models.IntegerField()
    employee_username = models.CharField(max_length=150)
    department_id = models.IntegerField(null=True, blank=True)

    date = models.DateField()
    check_in = models.DateTimeField(null=True, blank=True)
    check_out = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PRESENT)
    # Defaults to OFFICE since check-in already requires office Wi-Fi (see
    # verify_office_wifi) when that restriction is on — this field just makes
    # that fact visible in the table/CSV rather than changing check-in behavior.
    location = models.CharField(max_length=20, choices=Location.choices, default=Location.OFFICE)

    # Audit trail for attendance authorized manually by a super admin (employee
    # arrived on time but forgot to check in).
    is_manual = models.BooleanField(default=False)
    marked_by_id = models.IntegerField(null=True, blank=True)
    marked_by_username = models.CharField(max_length=150, blank=True, default="")
    mark_reason = models.CharField(max_length=500, blank=True, default="")
    marked_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ["employee_id", "date"]
        ordering = ["-date"]

    def __str__(self):
        return f"{self.employee_username} - {self.date} ({self.status})"
