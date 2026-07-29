from rest_framework import serializers
from .models import DailyReport


class DailyReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailyReport
        fields = [
            "id", "employee_id", "employee_username", "department_id",
            "report_date", "summary", "task_id", "hours_worked",
            "review_status", "reviewed_by_id", "review_comment", "reviewed_at", "created_at",
        ]
        read_only_fields = [
            "employee_id", "employee_username", "department_id",
            "review_status", "reviewed_by_id", "review_comment", "reviewed_at", "created_at",
        ]


class ReviewReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailyReport
        fields = ["review_status", "review_comment"]
