from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import User
from .password_reset_serializers import PasswordResetRequestSerializer, PasswordResetConfirmSerializer

GENERIC_MESSAGE = "If that email is registered, a password reset link has been sent."


class PasswordResetRequestView(APIView):
    permission_classes = []
    authentication_classes = []

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]

        user = User.objects.filter(email__iexact=email).first()
        response_data = {"detail": GENERIC_MESSAGE}

        if user:
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)

            send_mail(
                subject="Novu Lab — Reset your password",
                message=(
                    f"Hi {user.first_name or user.username},\n\n"
                    f"Use this code to reset your Novu Lab password:\n\n"
                    f"uid: {uid}\n"
                    f"token: {token}\n\n"
                    f"If you didn't request this, you can ignore this email.\n\n"
                    f"— Novu Lab"
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=True,
            )

            if settings.DEBUG:
                response_data["uid"] = uid
                response_data["token"] = token

        return Response(response_data, status=status.HTTP_200_OK)


class PasswordResetConfirmView(APIView):
    permission_classes = []
    authentication_classes = []

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        uid = serializer.validated_data["uid"]
        token = serializer.validated_data["token"]
        new_password = serializer.validated_data["new_password"]

        try:
            user_id = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=user_id)
        except (User.DoesNotExist, ValueError, TypeError, OverflowError):
            return Response({"detail": "Invalid or expired reset link."}, status=status.HTTP_400_BAD_REQUEST)

        if not default_token_generator.check_token(user, token):
            return Response({"detail": "Invalid or expired reset link."}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()
        return Response({"detail": "Password has been reset. You can now log in."}, status=status.HTTP_200_OK)
