from datetime import datetime
from unittest import mock

from django.utils import timezone
from rest_framework.test import APITestCase

from apps.users.models import User
from .models import Attendance

URL = "/api/attendance/attendance/"


def at(hour, minute):
    return timezone.make_aware(datetime(2026, 1, 12, hour, minute))


class CheckInStatusTests(APITestCase):
    def setUp(self):
        self.emp = User.objects.create_user(username="emp", password="pw", role="EMPLOYEE")
        self.client.force_authenticate(self.emp)

    def check_in_at(self, when):
        with mock.patch("apps.attendance.views.timezone.now", return_value=when):
            return self.client.post(URL + "check_in/")

    def test_ten_am_is_on_time(self):
        self.assertEqual(self.check_in_at(at(10, 0)).data["status"], "PRESENT")

    def test_ten_thirty_is_still_on_time(self):
        self.assertEqual(self.check_in_at(at(10, 30)).data["status"], "PRESENT")

    def test_after_ten_thirty_is_late(self):
        self.assertEqual(self.check_in_at(at(10, 31)).data["status"], "LATE")


class MarkPresentTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(username="superAdmin", password="pw", email="a@b.c")
        self.admin.role = "ADMIN"
        self.admin.save()
        self.emp = User.objects.create_user(username="emp", password="pw", role="EMPLOYEE")
        self.payload = {"employee_id": self.emp.id, "reason": "Forgot to check in"}

    def test_admin_can_mark_present_with_audit_trail(self):
        self.client.force_authenticate(self.admin)
        res = self.client.post(URL + "mark_present/", self.payload, format="json")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["status"], "PRESENT")
        self.assertTrue(res.data["is_manual"])
        self.assertEqual(res.data["marked_by_username"], "superAdmin")

    def test_corrects_existing_late_record(self):
        today = timezone.localtime(timezone.now()).date()
        Attendance.objects.create(employee_id=self.emp.id, employee_username="emp", date=today, status="LATE")
        self.client.force_authenticate(self.admin)
        self.client.post(URL + "mark_present/", self.payload, format="json")
        self.assertEqual(Attendance.objects.get(employee_id=self.emp.id).status, "PRESENT")

    def test_reason_required(self):
        self.client.force_authenticate(self.admin)
        res = self.client.post(URL + "mark_present/", {"employee_id": self.emp.id}, format="json")
        self.assertEqual(res.status_code, 400)

    def test_non_admin_forbidden(self):
        self.client.force_authenticate(self.emp)
        res = self.client.post(URL + "mark_present/", self.payload, format="json")
        self.assertEqual(res.status_code, 403)

    def test_other_superadmin_forbidden(self):
        other = User.objects.create_superuser(username="otheradmin", password="pw", email="x@y.z")
        other.role = "ADMIN"
        other.save()
        self.client.force_authenticate(other)
        res = self.client.post(URL + "mark_present/", self.payload, format="json")
        self.assertEqual(res.status_code, 403)
