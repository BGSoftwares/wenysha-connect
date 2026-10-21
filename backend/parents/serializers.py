from rest_framework import serializers
from school.serializers import StudentSerializer
from .models import Parent, StudentParent


class ParentSerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()

    class Meta:
        model = Parent
        fields = ['id', 'user', 'name', 'phone', 'email', 'address', 'status', 'children']

    def validate_email(self, value):
        if not value:
            return value
        from django.contrib.auth.models import User
        existing = User.objects.filter(email__iexact=value)
        parent_user_id = getattr(self.instance, 'user_id', None)
        if parent_user_id:
            existing = existing.exclude(pk=parent_user_id)
        if existing.exists():
            raise serializers.ValidationError('This email address is already in use by another account.')
        return value

    def get_children(self, obj):
        links = StudentParent.objects.filter(parent=obj).select_related('student', 'student__school_class')
        return [
            f"{link.student.name} ({link.student.school_class.name})"
            for link in links
        ]

    def create(self, validated_data):
        parent = super().create(validated_data)
        self._sync_linked_user(parent)
        return parent

    def update(self, instance, validated_data):
        parent = super().update(instance, validated_data)
        self._sync_linked_user(parent)
        return parent

    @staticmethod
    def _sync_linked_user(parent):
        if not parent.user_id:
            return
        from core.sync import sync_linked_portal_records
        if parent.email:
            parent.user.email = parent.email
            parent.user.save(update_fields=['email'])
        sync_linked_portal_records(parent.user, parent.name, parent.email or None)


class StudentParentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.name', read_only=True)
    parent_name = serializers.CharField(source='parent.name', read_only=True)

    class Meta:
        model = StudentParent
        fields = ['id', 'student', 'student_name', 'parent', 'parent_name']
