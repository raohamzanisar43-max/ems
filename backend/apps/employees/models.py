
from django.db import models


class EmployeeProfile(models.Model):
    """
    Extended employee information beyond the core User model.
    """

    # ---------------------------------------------------------
    # User reference
    # ---------------------------------------------------------

    user_id = models.IntegerField(
        unique=True,
    )

    username = models.CharField(
        max_length=150,
    )

    department_id = models.IntegerField(
        null=True,
        blank=True,
    )

    # ---------------------------------------------------------
    # Professional information
    # ---------------------------------------------------------

    designation = models.CharField(
        max_length=100,
        blank=True,
    )

    employee_code = models.CharField(
        max_length=30,
        unique=True,
        blank=True,
    )

    joining_date = models.DateField(
        null=True,
        blank=True,
    )

    work_location = models.CharField(
        max_length=150,
        blank=True,
    )

    office_start_time = models.TimeField(
        null=True,
        blank=True,
    )

    office_end_time = models.TimeField(
        null=True,
        blank=True,
    )

    is_dual_shift = models.BooleanField(
        default=False,
    )

    second_shift_start_time = models.TimeField(
        null=True,
        blank=True,
    )

    second_shift_end_time = models.TimeField(
        null=True,
        blank=True,
    )

    grade = models.CharField(
        max_length=50,
        blank=True,
    )

    cost_center = models.CharField(
        max_length=100,
        blank=True,
    )

    # ---------------------------------------------------------
    # Skills & profile
    # ---------------------------------------------------------

    skills = models.JSONField(
        default=list,
        blank=True,
    )

    bio = models.TextField(
        blank=True,
    )

    # ---------------------------------------------------------
    # Emergency contact
    # ---------------------------------------------------------

    emergency_contact_name = models.CharField(
        max_length=150,
        blank=True,
    )

    emergency_contact_relationship = models.CharField(
        max_length=100,
        blank=True,
    )

    emergency_contact_phone = models.CharField(
        max_length=30,
        blank=True,
    )

    # ---------------------------------------------------------
    # Metadata
    # ---------------------------------------------------------

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    def __str__(self):
        return f"{self.username} - {self.designation}"

