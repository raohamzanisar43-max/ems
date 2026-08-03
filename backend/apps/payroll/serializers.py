from rest_framework import serializers
from .models import Payslip


class PayslipSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payslip
        fields = [
            "id", "employee_id", "employee_username", "department_id", "month",
            "basic_salary", "allowances", "deductions", "net_pay",
            "generated_by_id", "generated_at",
        ]
        read_only_fields = ["generated_by_id", "generated_at", "net_pay"]

    def _compute_net_pay(self, basic_salary, allowances, deductions):
        return basic_salary + allowances - deductions

    def create(self, validated_data):
        validated_data["net_pay"] = self._compute_net_pay(
            validated_data["basic_salary"], validated_data.get("allowances", 0), validated_data.get("deductions", 0)
        )
        return super().create(validated_data)

    def update(self, instance, validated_data):
        basic_salary = validated_data.get("basic_salary", instance.basic_salary)
        allowances = validated_data.get("allowances", instance.allowances)
        deductions = validated_data.get("deductions", instance.deductions)
        validated_data["net_pay"] = self._compute_net_pay(basic_salary, allowances, deductions)
        return super().update(instance, validated_data)

    def validate_employee_id(self, value):
        from apps.users.models import User
        if not User.objects.filter(id=value).exists():
            raise serializers.ValidationError("No employee exists with this employee_id.")
        return value
