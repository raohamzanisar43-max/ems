from django.db import models


class Task(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        IN_PROGRESS = "IN_PROGRESS", "Started"
        COMPLETED = "COMPLETED", "Completed"

    class Priority(models.TextChoices):
        HIGH = "HIGH", "High"
        MEDIUM = "MEDIUM", "Medium"
        LOW = "LOW", "Low"

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    assigned_to_id = models.IntegerField()
    assigned_to_username = models.CharField(max_length=150)
    department_id = models.IntegerField(null=True, blank=True)
    created_by_id = models.IntegerField()

    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    priority = models.CharField(max_length=10, choices=Priority.choices, default=Priority.MEDIUM)
    progress_percent = models.PositiveSmallIntegerField(default=0)

    due_date = models.DateField(null=True, blank=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} ({self.status})"
