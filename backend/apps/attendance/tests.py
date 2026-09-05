from django.test import TestCase
from rest_framework.exceptions import PermissionDenied
from rest_framework.test import APIRequestFactory, force_authenticate

from apps.attendance.views import verify_office_wifi
from apps.users.models import CompanyProfile, User


class OfficeNetworkAttendanceTests(TestCase):
	def setUp(self):
		self.factory = APIRequestFactory()
		self.employee = User.objects.create_user(
			username="office-test-user",
			password="pass123",
		)

	def request_from_ip(self, ip_address):
		request = self.factory.post("/api/attendance/check_in/")
		request.META["REMOTE_ADDR"] = ip_address
		force_authenticate(request, user=self.employee)
		return request

	def test_allowed_office_ip_is_accepted(self):
		CompanyProfile.objects.create(
			pk=1,
			wifi_restriction_enabled=True,
			allowed_wifi_ips="203.0.113.10, 203.0.113.11",
		)

		verify_office_wifi(self.request_from_ip("203.0.113.10"))

	def test_outside_ip_is_rejected(self):
		CompanyProfile.objects.create(
			pk=1,
			wifi_restriction_enabled=True,
			allowed_wifi_ips="203.0.113.10",
		)

		with self.assertRaises(PermissionDenied):
			verify_office_wifi(self.request_from_ip("198.51.100.20"))

	def test_restriction_disabled_allows_any_ip(self):
		CompanyProfile.objects.create(
			pk=1,
			wifi_restriction_enabled=False,
			allowed_wifi_ips="203.0.113.10",
		)

		verify_office_wifi(self.request_from_ip("198.51.100.20"))
