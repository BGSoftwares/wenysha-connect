from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
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
]
