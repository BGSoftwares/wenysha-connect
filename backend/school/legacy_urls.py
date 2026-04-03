from django.urls import path

from .views import (
    StudentViewSet, SchoolClassViewSet, AttendanceViewSet
)
from rest_framework.routers import DefaultRouter

urlpatterns = []

# Map legacy endpoints to existing viewsets in the school app
students_list = StudentViewSet.as_view({'get': 'list', 'post': 'create'})
students_detail = StudentViewSet.as_view({'get': 'retrieve', 'patch': 'partial_update', 'delete': 'destroy'})

classes_list = SchoolClassViewSet.as_view({'get': 'list', 'post': 'create'})
classes_detail = SchoolClassViewSet.as_view({'get': 'retrieve', 'patch': 'partial_update', 'delete': 'destroy'})

attendance_list = AttendanceViewSet.as_view({'get': 'list', 'post': 'create'})
attendance_detail = AttendanceViewSet.as_view({'get': 'retrieve', 'patch': 'partial_update', 'delete': 'destroy'})


urlpatterns += [
    path('students/', students_list, name='legacy-students-list'),
    path('students/<int:pk>/', students_detail, name='legacy-students-detail'),
    path('classrooms/', classes_list, name='legacy-classes-list'),
    path('classrooms/<int:pk>/', classes_detail, name='legacy-classes-detail'),
    path('attendance/', attendance_list, name='legacy-attendance-list'),
    path('attendance/<int:pk>/', attendance_detail, name='legacy-attendance-detail'),
    # bulk attendance endpoint (map to list view which can accept bulk payloads)
    path('attendance/bulk/', AttendanceViewSet.as_view({'post': 'create'}), name='legacy-attendance-bulk'),
]
