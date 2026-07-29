from django.db import models


class Attendance(models.Model):
    class Status(models.TextChoices):
        PRESENT = "PRESENT", "Present"
        ABSENT = "ABSENT", "Absent"
        LATE = "LATE", "Late"
        HALF_DAY = "HALF_DAY", "Half Day"

    employee_id = models.IntegerField()
    employee_username = models.CharField(max_length=150)
    department_id = models.IntegerField(null=True, blank=True)

    date = models.DateField()
    check_in = models.DateTimeField(null=True, blank=True)
    check_out = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PRESENT)

    class Meta:
        unique_together = ["employee_id", "date"]
        ordering = ["-date"]

    def __str__(self):
        return f"{self.employee_username} - {self.date} ({self.status})"
