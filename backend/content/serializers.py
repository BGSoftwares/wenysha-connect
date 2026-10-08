from rest_framework import serializers
from .models import GalleryItem, Announcement, ContactMessage, StaffMember, LearningMaterial


class GalleryItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = GalleryItem
        fields = ['id', 'title', 'category', 'item_type', 'image_url', 'date']


class AnnouncementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Announcement
        fields = ['id', 'category', 'title', 'content', 'date', 'important']


class ContactMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = ['id', 'name', 'email', 'phone', 'subject', 'message', 'created_at']


class StaffMemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = StaffMember
        fields = ['id', 'name', 'role', 'department', 'bio', 'image_url', 'email']


class LearningMaterialSerializer(serializers.ModelSerializer):
    class Meta:
        model = LearningMaterial
        fields = ['id', 'title', 'subject_name', 'class_name', 'file_url', 'file_type', 'uploaded_by', 'created_at']
        read_only_fields = ['created_at']
