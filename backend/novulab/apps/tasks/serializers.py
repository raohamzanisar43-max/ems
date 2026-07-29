from rest_framework import serializers
from .models import Task


class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = [
            "id", "title", "description",
            "assigned_to_id", "assigned_to_username", "department_id", "created_by_id",
            "status", "priority", "progress_percent", "due_date",
            "started_at", "completed_at", "created_at", "updated_at",
        ]
        read_only_fields = ["created_by_id", "started_at", "completed_at", "created_at", "updated_at"]
