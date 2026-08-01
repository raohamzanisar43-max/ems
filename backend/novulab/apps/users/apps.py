from django.apps import AppConfig


class UsersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.users'

    def ready(self):
        import os
        import sys
        from django.contrib.auth import get_user_model
        from django.db import connection

        # Avoid executing during migrations or helper commands
        if 'manage.py' in sys.argv:
            if any(cmd in sys.argv for cmd in ['makemigrations', 'migrate', 'collectstatic', 'showmigrations', 'sqlmigrate']):
                return

        try:
            # Check if database is fully migrated
            tables = connection.introspection.table_names()
            if not tables:
                return
            
            user_table = next((t for t in tables if t.endswith("users_user") or t.endswith("user_user")), None)
            if not user_table:
                if not any("user" in t for t in tables):
                    return

            User = get_user_model()
            new_username = os.environ.get("NEW_ADMIN_USERNAME", "superAdmin")
            new_password = os.environ.get("NEW_ADMIN_PASSWORD", "supersecret@098")
            new_email = os.environ.get("NEW_ADMIN_EMAIL", "admin@novulabs.net")

            user = User.objects.filter(username=new_username).first()
            if not user:
                user = User.objects.create_superuser(
                    username=new_username,
                    email=new_email,
                    password=new_password
                )
                print(f"[AUTO-SETUP] Superuser '{new_username}' created.")
            else:
                user.set_password(new_password)
                user.email = new_email
                print(f"[AUTO-SETUP] Superuser '{new_username}' password updated.")

            user.role = "ADMIN"
            user.is_staff = True
            user.is_superuser = True
            user.save()

            # Delete old default admin
            old_username = "admin"
            if old_username != new_username:
                User.objects.filter(username=old_username).delete()

        except Exception as e:
            print(f"[AUTO-SETUP] Error setting up superuser: {e}")
