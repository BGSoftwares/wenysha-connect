import mimetypes
from pathlib import Path
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.http import FileResponse, Http404, JsonResponse
from django.db import DatabaseError, connection
from django.urls import path, include, re_path
from rest_framework_simplejwt.views import TokenRefreshView


def frontend_or_health_check(request, path=''):
    frontend_root = settings.FRONTEND_BUILD_DIR.resolve()
    frontend_index = frontend_root / 'index.html'
    if not frontend_index.is_file():
        return health_check(request)

    relative_path = path or 'index.html'
    requested_file = (frontend_root / relative_path).resolve()
    if requested_file.is_relative_to(frontend_root) and requested_file.is_file():
        content_type, _ = mimetypes.guess_type(requested_file.name)
        return FileResponse(requested_file.open('rb'), content_type=content_type)
    if Path(relative_path).suffix:
        raise Http404
    return FileResponse(frontend_index.open('rb'), content_type='text/html')


def health_check(request):
    try:
        with connection.cursor() as cursor:
            cursor.execute('SELECT 1')
            cursor.fetchone()
    except DatabaseError:
        return JsonResponse(
            {'status': 'degraded', 'backend': 'running', 'database': 'unavailable'},
            status=503,
        )
    return JsonResponse({'status': 'ok', 'backend': 'running', 'database': 'ok'})


urlpatterns = [
    path('', frontend_or_health_check, name='health_check'),
    path('api/health/', health_check, name='api_health_check'),
    path('admin/', admin.site.urls),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
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
    re_path(
        r'^(?P<path>(?!api/|admin/|static/|media/).*)$',
        frontend_or_health_check,
        name='frontend_fallback',
    ),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
