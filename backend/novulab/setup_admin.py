import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

new_username = os.environ.get("NEW_ADMIN_USERNAME", "superAdmin")
new_password = os.environ.get("NEW_ADMIN_PASSWORD", "supersecret@098")
new_email = os.environ.get("NEW_ADMIN_EMAIL", "admin@novulabs.net")

# Create or update superuser
user = User.objects.filter(username=new_username).first()
if not user:
    user = User.objects.create_superuser(
        username=new_username,
        email=new_email,
        password=new_password
    )
    print(f"Superuser '{new_username}' created successfully.")
else:
    user.set_password(new_password)
    user.email = new_email
    print(f"Superuser '{new_username}' password updated successfully.")

# Ensure the role is ADMIN for frontend permissions
user.role = "ADMIN"
user.is_staff = True
user.is_superuser = True
user.save()

# Delete old admin if it exists and is different from the new one
old_username = "admin"
if old_username != new_username:
    old_users = User.objects.filter(username=old_username)
    if old_users.exists():
        old_users.delete()
        print(f"Old user '{old_username}' deleted successfully.")
