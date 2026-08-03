from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import UserViewSet, DepartmentViewSet, CustomRoleViewSet, CompanyProfileView
from .token_views import CustomTokenObtainPairView
from .password_reset_views import PasswordResetRequestView, PasswordResetConfirmView

router = DefaultRouter()
router.register(r"employees", UserViewSet, basename="employee")
router.register(r"departments", DepartmentViewSet, basename="department")
router.register(r"roles", CustomRoleViewSet, basename="custom-role")

urlpatterns = [
    path("token/", CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("password-reset/", PasswordResetRequestView.as_view(), name="password_reset"),
    path("password-reset-confirm/", PasswordResetConfirmView.as_view(), name="password_reset_confirm"),
    path("company-profile/", CompanyProfileView.as_view(), name="company_profile"),
    path("health/", lambda request: __import__("django.http").http.JsonResponse({"status": "ok", "service": "users"})),
    path("", include(router.urls)),
]
