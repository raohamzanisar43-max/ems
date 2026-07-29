from django.contrib.auth.models import AbstractUser
from django.db import models


class Department(models.Model):
    """Sales, Marketing, Development, HR, Finance, etc."""
    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=20, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class CustomRole(models.Model):
    """
    HR/Admin-defined roles beyond the 7 built-in system roles (User.Role).
    Purely additive: the built-in role field and its checks are untouched.
    A user's custom_role flags are OR'd into the relevant User permission
    properties, so a custom role can actually grant extra access rather than
    being a cosmetic label only.
    """
    name = models.CharField(max_length=100, unique=True)
    code = models.SlugField(max_length=50, unique=True)
    description = models.CharField(max_length=255, blank=True)

    can_see_all_departments = models.BooleanField(default=False)
    can_manage_employees = models.BooleanField(default=False)
    can_manage_payroll = models.BooleanField(default=False)
    can_review_leaves_reports = models.BooleanField(default=False)
    can_manage_tasks_all = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class CompanyProfile(models.Model):
    """Singleton-ish org profile shown on the Settings page. HR/Admin only."""
    name = models.CharField(max_length=150, default="NovuLabs")
    address = models.CharField(max_length=255, blank=True)
    phone = models.CharField(max_length=30, blank=True)
    email = models.EmailField(blank=True)
    website = models.URLField(blank=True)
    logo_url = models.URLField(blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = "ADMIN", "Admin"
        CEO = "CEO", "CEO"
        CTO = "CTO", "CTO"
        HR = "HR", "HR"
        FINANCE = "FINANCE", "Finance"
        TEAM_LEAD = "TEAM_LEAD", "Team Lead"
        EMPLOYEE = "EMPLOYEE", "Employee"

    class EmployeeType(models.TextChoices):
        FULL_TIME = "FULL_TIME", "Full Time"
        PART_TIME = "PART_TIME", "Part Time"
        CONTRACTUAL = "CONTRACTUAL", "Contractual"
        INTERN = "INTERN", "Intern"

    role = models.CharField(max_length=20, choices=Role.choices, default=Role.EMPLOYEE)
    department = models.ForeignKey(
        Department, on_delete=models.SET_NULL, null=True, blank=True, related_name="users"
    )
    phone = models.CharField(max_length=20, blank=True)
    date_joined_company = models.DateField(null=True, blank=True)
    is_active_employee = models.BooleanField(default=True)

    employee_type = models.CharField(
        max_length=20, choices=EmployeeType.choices, default=EmployeeType.FULL_TIME
    )
    personal_email = models.EmailField(blank=True)
    cnic = models.CharField("CNIC number", max_length=20, blank=True)
    residential_address = models.TextField(blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    reporting_manager = models.ForeignKey(
        "self", on_delete=models.SET_NULL, null=True, blank=True, related_name="direct_reports"
    )
    custom_role = models.ForeignKey(
        CustomRole, on_delete=models.SET_NULL, null=True, blank=True, related_name="users"
    )

    @property
    def is_admin(self):
        return self.role == self.Role.ADMIN

    @property
    def is_ceo(self):
        return self.role == self.Role.CEO

    @property
    def is_cto(self):
        return self.role == self.Role.CTO

    @property
    def is_hr(self):
        return self.role == self.Role.HR

    @property
    def is_finance(self):
        return self.role == self.Role.FINANCE

    @property
    def is_team_lead(self):
        return self.role == self.Role.TEAM_LEAD

    @property
    def can_see_all_departments(self):
        return self.role in (self.Role.ADMIN, self.Role.CEO, self.Role.CTO, self.Role.HR) or (
            self.custom_role_id and self.custom_role.can_see_all_departments
        )

    @property
    def can_manage_employees(self):
        return self.can_see_all_departments or self.is_team_lead or (
            self.custom_role_id and self.custom_role.can_manage_employees
        )

    @property
    def can_manage_payroll(self):
        return self.is_finance or self.is_hr or self.is_admin or (
            self.custom_role_id and self.custom_role.can_manage_payroll
        )

    @property
    def can_review_leaves_reports(self):
        return self.can_see_all_departments or self.is_team_lead or (
            self.custom_role_id and self.custom_role.can_review_leaves_reports
        )

    @property
    def can_manage_tasks_all(self):
        return self.can_see_all_departments or self.is_team_lead or (
            self.custom_role_id and self.custom_role.can_manage_tasks_all
        )

    def __str__(self):
        return f"{self.username} ({self.role})"
