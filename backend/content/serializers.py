from pathlib import Path

from rest_framework import serializers
from .models import GalleryItem, Announcement, ContactMessage, StaffMember, LearningMaterial

MAX_MATERIAL_BYTES = 20 * 1024 * 1024
FILE_TYPE_BY_EXT = {
    '.pdf': 'PDF',
    '.doc': 'DOC',
    '.docx': 'DOC',
    '.ppt': 'PPT',
    '.pptx': 'PPT',
    '.xls': 'XLS',
    '.xlsx': 'XLS',
    '.mp4': 'VIDEO',
    '.mov': 'VIDEO',
    '.webm': 'VIDEO',
    '.png': 'IMAGE',
    '.jpg': 'IMAGE',
    '.jpeg': 'IMAGE',
    '.webp': 'IMAGE',
    '.txt': 'TEXT',
    '.zip': 'ZIP',
}


def file_type_from_name(name: str) -> str:
    return FILE_TYPE_BY_EXT.get(Path(name).suffix.lower(), 'FILE')


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
    file = serializers.FileField(write_only=True, required=False)
    file_url = serializers.SerializerMethodField()
    file_name = serializers.SerializerMethodField()

    class Meta:
        model = LearningMaterial
        fields = [
            'id', 'title', 'subject_name', 'class_name', 'file', 'file_url',
            'file_name', 'file_type', 'uploaded_by', 'created_at',
        ]
        read_only_fields = ['created_at', 'file_url', 'file_name']

    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file:
            url = obj.file.url
            return request.build_absolute_uri(url) if request else url
        return obj.file_url or ''

    def get_file_name(self, obj):
        if obj.file:
            return Path(obj.file.name).name
        return Path(obj.file_url).name if obj.file_url else ''

    def validate_file(self, value):
        if value and value.size > MAX_MATERIAL_BYTES:
            raise serializers.ValidationError('File must be 20MB or smaller.')
        return value

    def validate(self, attrs):
        uploaded = attrs.get('file')
        existing_file = getattr(self.instance, 'file', None)
        existing_url = getattr(self.instance, 'file_url', '')
        if not uploaded and not existing_file and not existing_url:
            raise serializers.ValidationError({'file': 'Select a file from your computer.'})
        return attrs

    def create(self, validated_data):
        uploaded = validated_data.get('file')
        if uploaded and not validated_data.get('file_type'):
            validated_data['file_type'] = file_type_from_name(uploaded.name)
        elif uploaded:
            validated_data['file_type'] = file_type_from_name(uploaded.name)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        uploaded = validated_data.get('file')
        if uploaded:
            validated_data['file_type'] = file_type_from_name(uploaded.name)
        return super().update(instance, validated_data)
