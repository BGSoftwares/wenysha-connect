from pathlib import Path
import mimetypes
import re
from urllib.parse import urlparse

from core.roles import is_admin, portal_role
from core.upload_validation import (
    ATTACHMENT_EXTENSIONS, IMAGE_EXTENSIONS, MATERIAL_EXTENSIONS, VIDEO_EXTENSIONS, validate_upload,
)
from rest_framework import serializers
from rest_framework.reverse import reverse
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
    image_url = serializers.CharField(max_length=512, required=False, allow_blank=True)
    media_file = serializers.FileField(required=False, allow_null=True, write_only=True)

    class Meta:
        model = GalleryItem
        fields = [
            'id', 'title', 'category', 'item_type', 'image_url', 'media_file',
            'description', 'show_on_homepage', 'display_order', 'display_mode', 'date',
        ]

    def validate_image_url(self, value):
        if not value:
            return value
        parsed = urlparse(value)
        if parsed.scheme and parsed.scheme not in {'http', 'https'}:
            raise serializers.ValidationError('Use an http(s) URL or a local asset path.')
        if not parsed.scheme and not value.startswith('/'):
            raise serializers.ValidationError('Use an absolute URL or a local asset path starting with /.')
        return value

    def validate_media_file(self, value):
        if value and value.size > 50 * 1024 * 1024:
            raise serializers.ValidationError('Media files must be 50MB or smaller.')
        # Images and videos only; extension AND file contents are checked (SVG is not allowed).
        return validate_upload(value, IMAGE_EXTENSIONS | VIDEO_EXTENSIONS, 'gallery file')

    def validate(self, attrs):
        uploaded_file = attrs.get('media_file')
        existing_file = getattr(self.instance, 'media_file', None)
        url = attrs.get('image_url', getattr(self.instance, 'image_url', ''))
        if not uploaded_file and not existing_file and not url:
            raise serializers.ValidationError({'image_url': 'Upload a file or provide an image URL.'})

        item_type = attrs.get('item_type', getattr(self.instance, 'item_type', 'image'))
        content_type = (mimetypes.guess_type(uploaded_file.name)[0] or uploaded_file.content_type or '') if uploaded_file else ''
        if uploaded_file and item_type == 'image' and content_type.startswith('video/'):
            raise serializers.ValidationError({'item_type': 'Select video for a video upload.'})
        if uploaded_file and item_type == 'video' and content_type.startswith('image/'):
            raise serializers.ValidationError({'item_type': 'Select image for an image upload.'})
        return attrs

    def _media_url(self, instance):
        return reverse(
            'galleryitem-media',
            kwargs={'pk': instance.pk},
            request=self.context.get('request'),
        )

    def create(self, validated_data):
        instance = super().create(validated_data)
        if instance.media_file:
            instance.image_url = self._media_url(instance)
            instance.save(update_fields=['image_url'])
        return instance

    def update(self, instance, validated_data):
        incoming_url = validated_data.get('image_url', '')
        current_media_route = f'/content/gallery/{instance.pk}/media/'
        is_same_media_url = bool(instance.media_file and current_media_route in incoming_url)
        replacing_with_url = (
            'image_url' in validated_data
            and 'media_file' not in validated_data
            and incoming_url != instance.image_url
            and not is_same_media_url
        )
        if replacing_with_url and instance.media_file:
            instance.media_file.delete(save=False)
            instance.media_file = None

        instance = super().update(instance, validated_data)
        if instance.media_file and 'media_file' in validated_data:
            instance.image_url = self._media_url(instance)
            instance.save(update_fields=['image_url'])
        return instance

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.media_file:
            data['image_url'] = self._media_url(instance)
        elif instance.image_url:
            # Gallery uploads made before this endpoint used the protected
            # learning-material download route. Repoint only those legacy
            # gallery references to its safe public image/video route.
            match = re.search(r'/materials/(\d+)/file/?(?:\?.*)?$', instance.image_url)
            if match:
                data['image_url'] = reverse(
                    'learningmaterial-public-file',
                    kwargs={'pk': match.group(1)},
                    request=self.context.get('request'),
                )
        return data


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
            url = f'/api/content/materials/{obj.pk}/file/'
            return request.build_absolute_uri(url) if request else url
        return obj.file_url or ''

    def get_file_name(self, obj):
        if obj.file:
            return Path(obj.file.name).name
        return Path(obj.file_url).name if obj.file_url else ''

    def validate_file(self, value):
        if value and value.size > MAX_MATERIAL_BYTES:
            raise serializers.ValidationError('File must be 20MB or smaller.')
        return validate_upload(value, MATERIAL_EXTENSIONS, 'file')

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
        request = self.context.get('request')
        if request and (is_admin(request.user) or portal_role(request.user) == 'teacher'):
            return obj.submissions.count()
        return 0

    def validate_attachment(self, value):
        if value and value.size > MAX_MATERIAL_BYTES:
            raise serializers.ValidationError('File must be 20MB or smaller.')
        return validate_upload(value, ATTACHMENT_EXTENSIONS, 'attachment')


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
        return validate_upload(value, ATTACHMENT_EXTENSIONS, 'attachment')

    def validate(self, attrs):
        answer = attrs.get('answer', getattr(self.instance, 'answer', '')).strip()
        attachment = attrs.get('attachment', getattr(self.instance, 'attachment', None))
        if not answer and not attachment:
            raise serializers.ValidationError('Add a written answer or attach a file before submitting.')
        return attrs


class LearningSubmissionReviewSerializer(serializers.Serializer):
    teacher_feedback = serializers.CharField(required=False, allow_blank=True, max_length=5000)
    score = serializers.DecimalField(
        required=False, allow_null=True, max_digits=5, decimal_places=2,
        min_value=0, max_value=100,
    )
