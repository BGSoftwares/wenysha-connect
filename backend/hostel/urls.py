from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import HostelViewSet, RoomViewSet, RoomStudentViewSet, HostelRequestViewSet

router = DefaultRouter()
router.register(r'hostels', HostelViewSet)
router.register(r'rooms', RoomViewSet)
router.register(r'room-students', RoomStudentViewSet)
router.register(r'hostel-requests', HostelRequestViewSet)

urlpatterns = [path('', include(router.urls))]
