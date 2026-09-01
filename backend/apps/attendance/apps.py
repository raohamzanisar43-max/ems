from datetime import datetime, time as dt_time, timedelta

from django.apps import AppConfig

DEMO_MARKER_EMAIL = "demo.seed@novulabs.local"
DEMO_PASSWORD = "Demo@12345"

# (department name, department code, [(username, first, last, role), ...])
DEMO_ROSTER = [
    ("Sales", "SALES", [
        ("sales.lead", "Amina", "Rahman", "TEAM_LEAD"),
        ("sales.hamid", "Hamid", "Iqbal", "EMPLOYEE"),
        ("sales.laila", "Laila", "Chaudhry", "EMPLOYEE"),
    ]),
    ("Marketing", "MKT", [
        ("marketing.lead", "Zara", "Farooq", "TEAM_LEAD"),
        ("marketing.usman", "Usman", "Sheikh", "EMPLOYEE"),
        ("marketing.noor", "Noor", "Baig", "EMPLOYEE"),
    ]),
    ("Development", "DEV", [
        ("dev.lead", "Bilal", "Ahmed", "TEAM_LEAD"),
        ("dev.sana", "Sana", "Malik", "EMPLOYEE"),
        ("dev.ali", "Ali", "Raza", "EMPLOYEE"),
    ]),
    ("HR", "HR", [
        ("hr.lead", "Mahnoor", "Yousaf", "TEAM_LEAD"),
        ("hr.imran", "Imran", "Qureshi", "EMPLOYEE"),
    ]),
    ("Finance", "FIN", [
        ("finance.lead", "Talha", "Nadeem", "TEAM_LEAD"),
        ("finance.hina", "Hina", "Aslam", "EMPLOYEE"),
    ]),
    ("Admin", "ADMIN", [
        ("admin.lead", "Faizan", "Butt", "TEAM_LEAD"),
        ("admin.aisha", "Aisha", "Tariq", "EMPLOYEE"),
    ]),
]


class AttendanceConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.attendance'

    def ready(self):
        import sys
        from django.db import connection

        if 'manage.py' in sys.argv:
            skip_cmds = ['makemigrations', 'migrate', 'collectstatic', 'showmigrations', 'sqlmigrate', 'test']
            if any(cmd in sys.argv for cmd in skip_cmds):
                return

        try:
            tables = connection.introspection.table_names()
            if not tables:
                return
            if not any(t.endswith("attendance_attendance") for t in tables):
                return
            if not any(t.endswith("users_department") for t in tables):
                return

            self._seed_demo_data()
        except Exception as e:
            print(f"[AUTO-SETUP] Error seeding demo attendance data: {e}")

    def _seed_demo_data(self):
        import random
        from django.utils import timezone
        from apps.users.models import Department, User
        from .models import Attendance

        today_local = timezone.localtime(timezone.now()).date()
        # Seed the full previous month plus this month-to-date, so there's
        # always at least one complete month of history to test the CSV
        # export/grouping against, even right after the 1st of a new month.
        this_month_start = today_local.replace(day=1)
        range_start = (this_month_start - timedelta(days=1)).replace(day=1)

        created_users = 0
        created_records = 0

        for dept_name, dept_code, roster in DEMO_ROSTER:
            department, _ = Department.objects.get_or_create(
                name=dept_name, defaults={"code": dept_code}
            )

            for username, first_name, last_name, role in roster:
                user = User.objects.filter(username=username).first()
                if user is None:
                    user = User.objects.create_user(
                        username=username,
                        password=DEMO_PASSWORD,
                        first_name=first_name,
                        last_name=last_name,
                        role=role,
                        department=department,
                        personal_email=DEMO_MARKER_EMAIL,
                        is_active_employee=True,
                    )
                    created_users += 1
                elif user.personal_email != DEMO_MARKER_EMAIL:
                    # A real user already owns this username — don't touch it.
                    continue

                rng = random.Random(username)
                day = range_start
                while day <= today_local:
                    if day.weekday() < 5:  # weekdays only
                        _obj, was_created = Attendance.objects.get_or_create(
                            employee_id=user.id,
                            date=day,
                            defaults=self._random_day(rng, user, department, day),
                        )
                        if was_created:
                            created_records += 1
                    day += timedelta(days=1)

        if created_users or created_records:
            print(
                f"[AUTO-SETUP] Demo attendance data seeded: "
                f"{created_users} demo employees, {created_records} attendance records "
                f"(login as e.g. 'sales.lead' / '{DEMO_PASSWORD}')."
            )

    def _random_day(self, rng, user, department, day):
        from django.utils import timezone
        from .models import Attendance

        roll = rng.random()
        if roll < 0.06:
            status = Attendance.Status.ABSENT
        elif roll < 0.16:
            status = Attendance.Status.LATE
        elif roll < 0.20:
            status = Attendance.Status.HALF_DAY
        else:
            status = Attendance.Status.PRESENT

        location = Attendance.Location.REMOTE if rng.random() < 0.15 else Attendance.Location.OFFICE

        check_in = None
        check_out = None
        if status != Attendance.Status.ABSENT:
            in_hour = 9
            in_minute = rng.randint(0, 29) if status != Attendance.Status.LATE else rng.randint(31, 59)
            check_in = timezone.make_aware(
                datetime.combine(day, dt_time(in_hour, in_minute, rng.randint(0, 59)))
            )
            if status == Attendance.Status.HALF_DAY:
                out_hour, out_minute = 13, rng.randint(0, 30)
            else:
                out_hour, out_minute = 18, rng.randint(0, 45)
            check_out = timezone.make_aware(
                datetime.combine(day, dt_time(out_hour, out_minute, rng.randint(0, 59)))
            )

        return {
            "employee_username": user.username,
            "department_id": department.id,
            "status": status,
            "location": location,
            "check_in": check_in,
            "check_out": check_out,
        }
