from django.db import migrations

DEPARTMENTS = [
    ("Sales", "SALES"),
    ("Marketing", "MARKETING"),
    ("Development", "DEV"),
    ("HR", "HR"),
    ("Admin", "ADMIN"),
    ("Finance", "FINANCE"),
]


def seed_departments(apps, schema_editor):
    Department = apps.get_model("users", "Department")
    for name, code in DEPARTMENTS:
        Department.objects.get_or_create(code=code, defaults={"name": name})


def unseed_departments(apps, schema_editor):
    Department = apps.get_model("users", "Department")
    Department.objects.filter(code__in=[code for _, code in DEPARTMENTS]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0003_user_cnic_user_date_of_birth_user_employee_type_and_more"),
    ]

    operations = [
        migrations.RunPython(seed_departments, unseed_departments),
    ]
