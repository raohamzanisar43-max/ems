from django.db import migrations
from django.contrib.auth.hashers import make_password


def seed_admin_user(apps, schema_editor):
    User = apps.get_model("users", "User")
    Department = apps.get_model("users", "Department")
    admin_dept = Department.objects.filter(code="ADMIN").first()

    if not User.objects.filter(username="admin").exists():
        User.objects.create(
            username="admin",
            email="admin@novulab.com",
            password=make_password("admin12345"),
            role="ADMIN",
            department=admin_dept,
            is_staff=True,
            is_superuser=True,
            is_active=True,
        )


def unseed_admin_user(apps, schema_editor):
    User = apps.get_model("users", "User")
    User.objects.filter(username="admin").delete()


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0005_companyprofile_customrole_user_custom_role"),
    ]

    operations = [
        migrations.RunPython(seed_admin_user, unseed_admin_user),
    ]
