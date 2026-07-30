from rest_framework import serializers
from .models import Task


class TaskSerializer(serializers.ModelSerializer):
    created_by_username = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = [
            "id", "title", "description",
            "assigned_to_id", "assigned_to_username", "department_id",
            "created_by_id", "created_by_username",
            "status", "priority", "progress_percent", "due_date",
            "started_at", "completed_at", "created_at", "updated_at",
        ]
        read_only_fields = ["created_by_id", "created_by_username", "started_at", "completed_at", "created_at", "updated_at"]

    def get_created_by_username(self, obj):
        if getattr(obj, "created_by_username", None):
            return obj.created_by_username
        from apps.users.models import User
        creator = User.objects.filter(id=obj.created_by_id).first()
        return creator.username if creator else (obj.assigned_to_username or "Unknown")
