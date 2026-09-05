from django.db import migrations, models


def add_office_times_if_missing(apps, schema_editor):
    with schema_editor.connection.cursor() as cursor:
        cursor.execute("PRAGMA table_info(employees_employeeprofile)")
        existing = {row[1] for row in cursor.fetchall()}

    if "office_end_time" not in existing:
        schema_editor.execute(
            'ALTER TABLE "employees_employeeprofile" ADD COLUMN "office_end_time" TIME'
        )

    if "office_start_time" not in existing:
        schema_editor.execute(
            'ALTER TABLE "employees_employeeprofile" ADD COLUMN "office_start_time" TIME'
        )


class Migration(migrations.Migration):

    dependencies = [
        ("employees", "0002_profile_settings"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunPython(
                    add_office_times_if_missing,
                    migrations.RunPython.noop,
                )
            ],
            state_operations=[
                migrations.AddField(
                    model_name="employeeprofile",
                    name="office_end_time",
                    field=models.TimeField(blank=True, null=True),
                ),
                migrations.AddField(
                    model_name="employeeprofile",
                    name="office_start_time",
                    field=models.TimeField(blank=True, null=True),
                ),
            ],
        )
    ]
