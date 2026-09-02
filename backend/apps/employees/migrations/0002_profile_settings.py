from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        (
            "employees",
            "0001_initial",
        ),
    ]

    operations = [
        migrations.AddField(
            model_name="employeeprofile",
            name="work_location",
            field=models.CharField(
                blank=True,
                max_length=150,
            ),
        ),
        migrations.AddField(
            model_name="employeeprofile",
            name="grade",
            field=models.CharField(
                blank=True,
                max_length=50,
            ),
        ),
        migrations.AddField(
            model_name="employeeprofile",
            name="cost_center",
            field=models.CharField(
                blank=True,
                max_length=100,
            ),
        ),
        migrations.AddField(
            model_name="employeeprofile",
            name="emergency_contact_name",
            field=models.CharField(
                blank=True,
                max_length=150,
            ),
        ),
        migrations.AddField(
            model_name="employeeprofile",
            name="emergency_contact_relationship",
            field=models.CharField(
                blank=True,
                max_length=100,
            ),
        ),
        migrations.AddField(
            model_name="employeeprofile",
            name="emergency_contact_phone",
            field=models.CharField(
                blank=True,
                max_length=30,
            ),
        ),
    ]