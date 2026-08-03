from django.core.mail import send_mail
from django.conf import settings


def send_credentials_email(user, password):
    """Emails a newly created employee their login username + password."""
    subject = "Welcome to Novu Lab — Your Account Credentials"
    message = (
        f"Hi {user.first_name or user.username},\n\n"
        f"Your Novu Lab employee account has been created.\n\n"
        f"Username: {user.username}\n"
        f"Email: {user.email}\n"
        f"Password: {password}\n\n"
        f"Please log in and change your password if you'd like.\n\n"
        f"— Novu Lab HR"
    )
    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        fail_silently=True,
    )
