from django.contrib import admin
from django.http import JsonResponse
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView


def health_check(request):
    return JsonResponse({'status': 'ok'})


urlpatterns = [
    path('', health_check, name='health_check'),
    path('admin/', admin.site.urls),
    path('api/health/', health_check, name='health_check'),
    path('admin/', admin.site.urls),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    # Legacy top-level endpoints (kept for frontend compatibility)
    path('api/', include('school.legacy_urls')),
    path('api/auth/', include('core.urls')),
    path('api/school/', include('school.urls')),
    path('api/finance/', include('finance.urls')),
    path('api/library/', include('library.urls')),
    path('api/hostel/', include('hostel.urls')),
    path('api/transport/', include('transport.urls')),
    path('api/exams/', include('exams.urls')),
    path('api/attendance/', include('attendance.urls')),
    path('api/notices/', include('notices.urls')),
    path('api/parents/', include('parents.urls')),
    path('api/content/', include('content.urls')),
    path('api/admissions/', include('admissions.urls')),
]
