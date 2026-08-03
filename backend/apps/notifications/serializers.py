from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ["id", "recipient_id", "message", "is_read", "created_at"]
        read_only_fields = ["recipient_id", "created_at"]
