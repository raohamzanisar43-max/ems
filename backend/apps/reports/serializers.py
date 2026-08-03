from rest_framework import serializers
from .models import DailyReport


class DailyReportSerializer(serializers.ModelSerializer):
    task_title = serializers.SerializerMethodField()

    class Meta:
        model = DailyReport
        fields = [
            "id", "employee_id", "employee_username", "department_id",
            "report_date", "summary", "task_id", "task_title", "hours_worked",
            "review_status", "reviewed_by_id", "review_comment", "reviewed_at", "created_at",
        ]
        read_only_fields = [
            "employee_id", "employee_username", "department_id",
            "review_status", "reviewed_by_id", "review_comment", "reviewed_at", "created_at",
        ]

    def get_task_title(self, obj):
        if not obj.task_id:
            return None
        from apps.tasks.models import Task
        t = Task.objects.filter(id=obj.task_id).first()
        return t.title if t else None


class ReviewReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailyReport
        fields = ["review_status", "review_comment"]
