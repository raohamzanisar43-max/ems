from rest_framework import viewsets, permissions
from .models import Notification
from .serializers import NotificationSerializer


class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(recipient_id=self.request.user.id)

    def perform_create(self, serializer):
        serializer.save(recipient_id=self.request.user.id)
