from rest_framework import viewsets, permissions
from rest_framework.exceptions import PermissionDenied, ValidationError
from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer


class ConversationViewSet(viewsets.ModelViewSet):
    serializer_class = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Conversation.objects.all()
        user = self.request.user
        if user.can_see_all_departments:
            return qs
        # Must stay a real QuerySet (not a Python list) so DRF's get_object()
        # can still .get() a single conversation for retrieve/update/destroy.
        visible_ids = [c.id for c in qs if user.id in (c.participant_ids or [])]
        return qs.filter(id__in=visible_ids)

    def perform_create(self, serializer):
        from apps.users.models import User
        user = self.request.user
        participant_ids = list(serializer.validated_data.get("participant_ids") or [])
        if user.id not in participant_ids:
            participant_ids.append(user.id)
        if User.objects.filter(id__in=participant_ids).count() != len(set(participant_ids)):
            raise ValidationError({"participant_ids": "One or more participant IDs don't exist."})
        serializer.save(participant_ids=participant_ids)


class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Message.objects.select_related("conversation")
        conversation_id = self.request.query_params.get("conversation")
        if conversation_id:
            qs = qs.filter(conversation_id=conversation_id)
        user = self.request.user
        if user.can_see_all_departments:
            return qs
        visible_ids = [m.id for m in qs if user.id in (m.conversation.participant_ids or [])]
        return qs.filter(id__in=visible_ids)

    def perform_create(self, serializer):
        user = self.request.user
        conversation = serializer.validated_data["conversation"]
        if not user.can_see_all_departments and user.id not in (conversation.participant_ids or []):
            raise PermissionDenied("You're not a participant in this conversation.")
        serializer.save(sender_id=user.id, sender_username=user.username)
