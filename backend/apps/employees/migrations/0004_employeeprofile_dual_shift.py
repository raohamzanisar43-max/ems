from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("employees", "0003_employeeprofile_office_start_time_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="employeeprofile",
            name="is_dual_shift",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="employeeprofile",
            name="second_shift_end_time",
            field=models.TimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="employeeprofile",
            name="second_shift_start_time",
            field=models.TimeField(blank=True, null=True),
        ),
    ]