from django.db import models


class DailyReport(models.Model):
    class ReviewStatus(models.TextChoices):
        PENDING_REVIEW = "PENDING_REVIEW", "Pending Review"
        REVIEWED = "REVIEWED", "Reviewed"

    employee_id = models.IntegerField()
    employee_username = models.CharField(max_length=150)
    department_id = models.IntegerField(null=True, blank=True)

    report_date = models.DateField()
    summary = models.TextField(help_text="What the employee worked on today")
    task_id = models.IntegerField(null=True, blank=True)
    hours_worked = models.DecimalField(max_digits=4, decimal_places=1, default=0)

    review_status = models.CharField(max_length=20, choices=ReviewStatus.choices, default=ReviewStatus.PENDING_REVIEW)
    reviewed_by_id = models.IntegerField(null=True, blank=True)
    review_comment = models.TextField(blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-report_date"]
        unique_together = ["employee_id", "report_date"]

    def __str__(self):
        return f"{self.employee_username} - {self.report_date}"
