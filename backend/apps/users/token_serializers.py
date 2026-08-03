from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["role"] = user.role
        token["department_id"] = user.department_id
        token["username"] = user.username
        token["email"] = user.email
        token["custom_role_name"] = user.custom_role.name if user.custom_role_id else None
        token["can_see_all_departments"] = user.can_see_all_departments
        token["can_manage_employees"] = user.can_manage_employees
        token["can_manage_payroll"] = user.can_manage_payroll
        token["can_review_leaves_reports"] = user.can_review_leaves_reports
        token["can_manage_tasks_all"] = user.can_manage_tasks_all
        return token
