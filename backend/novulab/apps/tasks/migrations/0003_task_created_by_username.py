# Generated manually for created_by_username

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tasks', '0002_task_priority'),
    ]

    operations = [
        migrations.AddField(
            model_name='task',
            name='created_by_username',
            field=models.CharField(blank=True, default='', max_length=150),
        ),
    ]
