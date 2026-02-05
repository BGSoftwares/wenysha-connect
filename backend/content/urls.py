from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import GalleryItemViewSet, AnnouncementViewSet, ContactMessageViewSet, StaffMemberViewSet

router = DefaultRouter()
router.register(r'gallery', GalleryItemViewSet)
router.register(r'announcements', AnnouncementViewSet)
router.register(r'contact-messages', ContactMessageViewSet)
router.register(r'staff', StaffMemberViewSet)

urlpatterns = [path('', include(router.urls))]
