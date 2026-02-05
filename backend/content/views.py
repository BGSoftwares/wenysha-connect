from rest_framework import viewsets, permissions
from .models import GalleryItem, Announcement, ContactMessage, StaffMember
from .serializers import (
    GalleryItemSerializer,
    AnnouncementSerializer,
    ContactMessageSerializer,
    StaffMemberSerializer,
)


class GalleryItemViewSet(viewsets.ModelViewSet):
    queryset = GalleryItem.objects.all()
    serializer_class = GalleryItemSerializer
    filterset_fields = ['category', 'item_type']


class AnnouncementViewSet(viewsets.ModelViewSet):
    queryset = Announcement.objects.all()
    serializer_class = AnnouncementSerializer
    filterset_fields = ['category', 'important']


class ContactMessageViewSet(viewsets.ModelViewSet):
    queryset = ContactMessage.objects.all()
    serializer_class = ContactMessageSerializer
    # Allow unauthenticated POST for contact form
    permission_classes = [permissions.AllowAny]

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]


class StaffMemberViewSet(viewsets.ModelViewSet):
    queryset = StaffMember.objects.all()
    serializer_class = StaffMemberSerializer
