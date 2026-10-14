from datetime import datetime, timedelta, timezone as dt_timezone

from django.db import migrations

# Manual ("Authorized") attendance saved before the server timezone was
# corrected from Asia/Riyadh (UTC+3) to Asia/Karachi (UTC+5) stored the typed
# arrival time two hours late (e.g. 10:00 -> 12:00 PM). Shift those rows back.
TZ_FIX_DEPLOYED_AT = datetime(2026, 10, 13, 12, 7, 59, tzinfo=dt_timezone.utc)
SHIFT = timedelta(hours=2)


def shift(apps, delta):
    Attendance = apps.get_model("attendance", "Attendance")
    for row in Attendance.objects.filter(
        is_manual=True, marked_at__lt=TZ_FIX_DEPLOYED_AT, check_in__isnull=False
    ):
        row.check_in = row.check_in + delta
        row.save(update_fields=["check_in"])


def forwards(apps, schema_editor):
    shift(apps, -SHIFT)


def backwards(apps, schema_editor):
    shift(apps, SHIFT)


class Migration(migrations.Migration):
    dependencies = [("attendance", "0003_attendance_is_manual_attendance_mark_reason_and_more")]
    operations = [migrations.RunPython(forwards, backwards)]
