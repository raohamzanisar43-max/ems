from pathlib import Path

from django.contrib import admin
from django.conf import settings
from django.conf.urls.static import static
from django.http import HttpResponse, JsonResponse
from django.urls import path, include, re_path


def spa_index(request):
    possible_paths = [
        settings.BASE_DIR / "staticfiles" / "index.html",
        settings.BASE_DIR.parent / "frontend" / "dist" / "index.html",
    ]

    for p in possible_paths:
        if p.exists():
            with open(
                p,
                "r",
                encoding="utf-8",
            ) as f:
                return HttpResponse(
                    f.read(),
                    content_type="text/html",
                )

    return JsonResponse({
        "message": "Novu Lab API Backend is running",
        "admin": "/admin/",
        "health": "/health/",
    })


urlpatterns = [
    path(
        "admin/",
        admin.site.urls,
    ),

    path(
        "health/",
        lambda request: JsonResponse({
            "status": "ok",
            "service": "novulab",
        }),
    ),

    path(
        "api/auth/",
        include("apps.users.urls"),
    ),

    path(
        "api/employees/",
        include("apps.employees.urls"),
    ),

    path(
        "api/attendance/",
        include("apps.attendance.urls"),
    ),

    path(
        "api/leaves/",
        include("apps.leaves.urls"),
    ),

    path(
        "api/payroll/",
        include("apps.payroll.urls"),
    ),

    path(
        "api/notifications/",
        include("apps.notifications.urls"),
    ),

    path(
        "api/tasks/",
        include("apps.tasks.urls"),
    ),

    path(
        "api/reports/",
        include("apps.reports.urls"),
    ),

    path(
        "api/chat/",
        include("apps.chat.urls"),
    ),

    re_path(
        r"^.*$",
        spa_index,
    ),
]


# Development only.
# Django serves uploaded profile pictures from MEDIA_ROOT.
if settings.DEBUG:
    urlpatterns += static(
        settings.MEDIA_URL,
        document_root=settings.MEDIA_ROOT,
    )