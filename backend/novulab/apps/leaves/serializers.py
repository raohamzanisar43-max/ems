from rest_framework import serializers
from .models import LeaveRequest


class LeaveRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeaveRequest
        fields = [
            "id", "employee_id", "employee_username", "department_id",
            "leave_type", "start_date", "end_date", "reason",
            "status", "reviewed_by_id", "review_comment", "reviewed_at", "created_at",
        ]
        read_only_fields = [
            "employee_id", "employee_username", "department_id",
            "status", "reviewed_by_id", "review_comment", "reviewed_at", "created_at",
        ]

    def validate(self, data):
        start = data.get("start_date", getattr(self.instance, "start_date", None))
        end = data.get("end_date", getattr(self.instance, "end_date", None))
        if start and end and end < start:
            raise serializers.ValidationError("end_date cannot be before start_date")
        return data


class ReviewLeaveRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeaveRequest
        fields = ["status", "review_comment"]

    def validate_status(self, value):
        if value not in (LeaveRequest.Status.APPROVED, LeaveRequest.Status.REJECTED):
            raise serializers.ValidationError("status must be APPROVED or REJECTED")
        return value
