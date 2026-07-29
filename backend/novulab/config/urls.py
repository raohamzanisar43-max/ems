from django.contrib import admin
from django.http import JsonResponse
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),
    path("health/", lambda request: JsonResponse({"status": "ok", "service": "novulab"})),
    path("api/auth/", include("apps.users.urls")),
    path("api/employees/", include("apps.employees.urls")),
    path("api/attendance/", include("apps.attendance.urls")),
    path("api/leaves/", include("apps.leaves.urls")),
    path("api/payroll/", include("apps.payroll.urls")),
    path("api/notifications/", include("apps.notifications.urls")),
    path("api/tasks/", include("apps.tasks.urls")),
    path("api/reports/", include("apps.reports.urls")),
    path("api/chat/", include("apps.chat.urls")),
]
