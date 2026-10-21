from rest_framework import serializers
from parents.models import StudentParent
from .models import Notice


class NoticeSerializer(serializers.ModelSerializer):
    recipient_class_name = serializers.CharField(source='recipient_class.name', read_only=True)
    recipient_student_name = serializers.CharField(source='recipient_student.name', read_only=True)

    class Meta:
        model = Notice
        fields = [
            'id', 'title', 'content', 'author', 'date', 'audience', 'priority', 'pinned', 'views',
            'recipient_type', 'recipient_class', 'recipient_class_name', 'recipient_student',
            'recipient_student_name', 'created_by', 'status', 'approved_by', 'approved_at', 'review_note',
        ]
        read_only_fields = [
            'author', 'date', 'audience', 'views', 'created_by', 'status', 'approved_by', 'approved_at',
            'review_note', 'recipient_class_name', 'recipient_student_name',
        ]

    def validate(self, attrs):
        instance = self.instance
        recipient_type = attrs.get('recipient_type', getattr(instance, 'recipient_type', 'all_students'))
        recipient_class = attrs.get('recipient_class', getattr(instance, 'recipient_class', None))
        recipient_student = attrs.get('recipient_student', getattr(instance, 'recipient_student', None))

        if recipient_type == 'class' and not recipient_class:
            raise serializers.ValidationError({'recipient_class': 'Choose a class for this notification.'})
        if recipient_type == 'individual' and not recipient_student:
            raise serializers.ValidationError({'recipient_student': 'Choose a student for this notification.'})
        if recipient_type == 'individual' and recipient_student and not recipient_student.user_id:
            has_parent_portal = StudentParent.objects.filter(
                student=recipient_student,
                parent__user__isnull=False,
            ).exists()
            if not has_parent_portal:
                raise serializers.ValidationError({
                    'recipient_student': 'This student has no linked student or parent portal account yet.'
                })
        if recipient_type != 'class':
            attrs['recipient_class'] = None
        if recipient_type != 'individual':
            attrs['recipient_student'] = None

        if recipient_type == 'all_students':
            attrs['audience'] = 'All Students'
        elif recipient_type == 'all_parents':
            attrs['audience'] = 'All Parents'
        elif recipient_type == 'staff':
            attrs['audience'] = 'Staff Only'
        elif recipient_type == 'class' and recipient_class:
            attrs['audience'] = recipient_class.name
        elif recipient_type == 'individual' and recipient_student:
            attrs['audience'] = recipient_student.name
        return attrs
