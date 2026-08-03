from django.db import models


class Payslip(models.Model):
    employee_id = models.IntegerField()
    employee_username = models.CharField(max_length=150)
    department_id = models.IntegerField(null=True, blank=True)

    month = models.DateField(help_text="Use the 1st of the month, e.g. 2026-07-01")
    basic_salary = models.DecimalField(max_digits=12, decimal_places=2)
    allowances = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    deductions = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    net_pay = models.DecimalField(max_digits=12, decimal_places=2)

    generated_by_id = models.IntegerField(help_text="Finance/HR user who generated this")
    generated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-month"]
        unique_together = ["employee_id", "month"]

    def __str__(self):
        return f"{self.employee_username} - {self.month.strftime('%b %Y')}"
