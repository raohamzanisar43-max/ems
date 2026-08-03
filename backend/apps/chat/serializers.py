from rest_framework import serializers
from .models import Conversation, Message


class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ["id", "conversation", "sender_id", "sender_username", "text", "sent_at", "is_read"]
        read_only_fields = ["sender_id", "sender_username", "sent_at"]


class ConversationSerializer(serializers.ModelSerializer):
    last_message = serializers.SerializerMethodField()
    participant_details = serializers.SerializerMethodField()
    task_title = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = ["id", "task_id", "task_title", "participant_ids", "participant_details", "department_id", "created_at", "last_message"]

    def get_last_message(self, obj):
        msg = obj.messages.last()
        return MessageSerializer(msg).data if msg else None

    def get_participant_details(self, obj):
        from apps.users.models import User
        users = User.objects.filter(id__in=obj.participant_ids or [])
        return [{"id": u.id, "username": u.username, "name": f"{u.first_name} {u.last_name}".strip() or u.username} for u in users]

    def get_task_title(self, obj):
        if not obj.task_id:
            return None
        from apps.tasks.models import Task
        t = Task.objects.filter(id=obj.task_id).first()
        return t.title if t else None
