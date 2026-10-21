from pathlib import Path

from rest_framework import serializers
from .models import (
    GalleryItem, Announcement, ContactMessage, StaffMember, LearningMaterial,
    LearningAssignment, LearningSubmission,
)

MAX_MATERIAL_BYTES = 20 * 1024 * 1024
FILE_TYPE_BY_EXT = {
    '.pdf': 'PDF',
    '.doc': 'DOC',
    '.docx': 'DOC',
    '.ppt': 'PPT',
    '.pptx': 'PPT',
    '.xls': 'XLS',
    '.xlsx': 'XLS',
    '.csv': 'CSV',
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
    uploaded_by_user = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = LearningMaterial
        fields = [
            'id', 'title', 'subject_name', 'class_name', 'file', 'file_url',
            'file_name', 'file_type', 'uploaded_by', 'uploaded_by_user', 'visibility', 'created_at',
        ]
        read_only_fields = ['created_at', 'file_url', 'file_name', 'uploaded_by', 'uploaded_by_user']

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


class LearningAssignmentSerializer(serializers.ModelSerializer):
    class_name = serializers.CharField(source='school_class.name', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    teacher_name = serializers.CharField(source='teacher.name', read_only=True)
    attachment = serializers.FileField(required=False, allow_null=True, write_only=True)
    attachment_url = serializers.SerializerMethodField()
    attachment_name = serializers.SerializerMethodField()
    submission_count = serializers.SerializerMethodField()

    class Meta:
        model = LearningAssignment
        fields = [
            'id', 'title', 'instructions', 'school_class', 'class_name', 'subject',
            'subject_name', 'teacher', 'teacher_name', 'due_at', 'attachment',
            'attachment_url', 'attachment_name', 'is_published', 'submission_count',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['teacher', 'created_at', 'updated_at', 'submission_count']

    def get_attachment_url(self, obj):
        if not obj.attachment:
            return ''
        return f'/content/assignments/{obj.pk}/attachment/'

    def get_attachment_name(self, obj):
        return Path(obj.attachment.name).name if obj.attachment else ''

    def get_submission_count(self, obj):
        return obj.submissions.count()

    def validate_attachment(self, value):
        if value and value.size > MAX_MATERIAL_BYTES:
            raise serializers.ValidationError('File must be 20MB or smaller.')
        return value


class LearningSubmissionSerializer(serializers.ModelSerializer):
    assignment_title = serializers.CharField(source='assignment.title', read_only=True)
    class_name = serializers.CharField(source='assignment.school_class.name', read_only=True)
    subject_name = serializers.CharField(source='assignment.subject.name', read_only=True)
    student_name = serializers.CharField(source='student.name', read_only=True)
    attachment = serializers.FileField(required=False, allow_null=True, write_only=True)
    attachment_url = serializers.SerializerMethodField()
    attachment_name = serializers.SerializerMethodField()

    class Meta:
        model = LearningSubmission
        fields = [
            'id', 'assignment', 'assignment_title', 'class_name', 'subject_name',
            'student', 'student_name', 'answer', 'attachment', 'attachment_url',
            'attachment_name', 'submitted_at', 'teacher_feedback', 'score', 'reviewed_at',
        ]
        read_only_fields = [
            'student', 'submitted_at', 'teacher_feedback', 'score', 'reviewed_at',
        ]

    def get_attachment_url(self, obj):
        if not obj.attachment:
            return ''
        return f'/content/submissions/{obj.pk}/attachment/'

    def get_attachment_name(self, obj):
        return Path(obj.attachment.name).name if obj.attachment else ''

    def validate_attachment(self, value):
        if value and value.size > MAX_MATERIAL_BYTES:
            raise serializers.ValidationError('File must be 20MB or smaller.')
        return value

    def validate(self, attrs):
        answer = attrs.get('answer', getattr(self.instance, 'answer', '')).strip()
        attachment = attrs.get('attachment', getattr(self.instance, 'attachment', None))
        if not answer and not attachment:
            raise serializers.ValidationError('Add a written answer or attach a file before submitting.')
        return attrs
