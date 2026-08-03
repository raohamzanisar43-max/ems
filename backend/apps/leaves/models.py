from django.db import models


class LeaveRequest(models.Model):
    class LeaveType(models.TextChoices):
        SICK = "SICK", "Sick"
        CASUAL = "CASUAL", "Casual"
        ANNUAL = "ANNUAL", "Annual"
        UNPAID = "UNPAID", "Unpaid"
        OTHER = "OTHER", "Other"

    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        APPROVED = "APPROVED", "Approved"
        REJECTED = "REJECTED", "Rejected"

    employee_id = models.IntegerField()
    employee_username = models.CharField(max_length=150)
    department_id = models.IntegerField(null=True, blank=True)

    leave_type = models.CharField(max_length=20, choices=LeaveType.choices, default=LeaveType.CASUAL)
    start_date = models.DateField()
    end_date = models.DateField()
    reason = models.TextField(blank=True)

    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    reviewed_by_id = models.IntegerField(null=True, blank=True)
    review_comment = models.TextField(blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.employee_username} - {self.start_date} to {self.end_date} ({self.status})"
