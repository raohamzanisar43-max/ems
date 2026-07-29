from django.db import models


class EmployeeProfile(models.Model):
    """Extended employee info beyond the core User (designation, skills, joining date)."""
    user_id = models.IntegerField(unique=True)
    username = models.CharField(max_length=150)
    department_id = models.IntegerField(null=True, blank=True)

    designation = models.CharField(max_length=100, blank=True)
    employee_code = models.CharField(max_length=30, unique=True, blank=True)
    joining_date = models.DateField(null=True, blank=True)
    skills = models.JSONField(default=list, blank=True)
    bio = models.TextField(blank=True)

    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.username} - {self.designation}"
