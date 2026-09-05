from datetime import time

from django.test import TestCase
from rest_framework.test import APIRequestFactory, force_authenticate

from apps.attendance.views import get_employee_checkin_cutoff_time
from apps.employees.models import EmployeeProfile
from apps.employees.serializers import EmployeeProfileSerializer
from apps.users.models import User
from apps.users.profile_settings import MyEmployeeProfileSerializer, MyProfileView


class EmployeeProfileTimingTests(TestCase):
    def test_employee_profile_has_office_hours_fields(self):
        field_names = {field.name for field in EmployeeProfile._meta.get_fields()}

        self.assertIn("office_start_time", field_names)
        self.assertIn("office_end_time", field_names)

    def test_serializer_includes_office_hours_fields(self):
        serializer = EmployeeProfileSerializer()

        self.assertIn("office_start_time", serializer.fields)
        self.assertIn("office_end_time", serializer.fields)
        self.assertIn("is_dual_shift", serializer.fields)
        self.assertIn("second_shift_start_time", serializer.fields)
        self.assertIn("second_shift_end_time", serializer.fields)

    def test_dual_shift_profile_serializes_both_shifts(self):
        user = User.objects.create_user(username="dual-shift-user", password="pass123")
        profile = EmployeeProfile.objects.create(
            user_id=user.id,
            username=user.username,
            office_start_time=time(8, 0),
            office_end_time=time(13, 0),
            is_dual_shift=True,
            second_shift_start_time=time(17, 0),
            second_shift_end_time=time(21, 0),
        )

        data = EmployeeProfileSerializer(profile).data

        self.assertTrue(data["is_dual_shift"])
        self.assertEqual(data["second_shift_start_time"], "17:00:00")
        self.assertEqual(data["second_shift_end_time"], "21:00:00")

    def test_checkin_cutoff_uses_employee_profile_time(self):
        user = User.objects.create_user(username="timing-user", password="pass123")
        EmployeeProfile.objects.create(
            user_id=user.id,
            username=user.username,
            office_start_time=time(14, 30),
            office_end_time=time(22, 0),
        )

        self.assertEqual(
            get_employee_checkin_cutoff_time(user),
            time(14, 30),
        )

    def test_employee_cannot_edit_office_hours_via_self_profile(self):
        serializer = MyEmployeeProfileSerializer()

        self.assertIn("office_start_time", serializer.fields)
        self.assertIn("office_end_time", serializer.fields)
        self.assertIn("office_start_time", serializer.Meta.read_only_fields)
        self.assertIn("office_end_time", serializer.Meta.read_only_fields)
        self.assertIn("is_dual_shift", serializer.fields)
        self.assertIn("second_shift_start_time", serializer.fields)
        self.assertIn("second_shift_end_time", serializer.fields)
        self.assertIn("is_dual_shift", serializer.Meta.read_only_fields)

    def test_my_profile_creates_unique_employee_code_for_new_users(self):
        user = User.objects.create_user(
            username="profile-user",
            password="pass123",
            email="profile-user@example.com",
        )

        EmployeeProfile.objects.filter(user_id=user.id).delete()

        factory = APIRequestFactory()
        request = factory.get("/api/auth/my-profile/")
        force_authenticate(request, user=user)

        response = MyProfileView.as_view()(request)

        self.assertEqual(response.status_code, 200)

        profile = EmployeeProfile.objects.get(user_id=user.id)
        self.assertTrue(profile.employee_code)
        self.assertNotEqual(profile.employee_code, "")
