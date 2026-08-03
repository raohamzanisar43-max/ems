from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EmployeeProfileViewSet

router = DefaultRouter()
router.register(r"profiles", EmployeeProfileViewSet, basename="profile")

urlpatterns = [path("", include(router.urls))]
