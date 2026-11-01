from rest_framework import serializers
from .models import (
    AttendanceAuditLog,
    AttendanceExcuse,
    AttendanceNotification,
    AttendanceRecord,
    AttendanceTermSummary,
    AttendanceSettings,
    AttendanceReportSnapshot,
    SchoolCalendarDay,
)
from .school_calendar import attendance_date_error


class AttendanceRecordSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.name', read_only=True)
    class_name = serializers.SerializerMethodField()
    reason = serializers.CharField(write_only=True, required=False, allow_blank=True, max_length=500)

    class Meta:
        model = AttendanceRecord
        fields = [
            'id', 'student', 'student_name', 'school_class', 'class_name', 'term', 'date', 'session', 'status',
            'late_minutes', 'excuse_reason', 'excuse_note', 'marked_by', 'marked_at', 'last_edited_by',
            'last_edited_at', 'reason',
        ]
        read_only_fields = ['school_class', 'class_name', 'term', 'marked_by', 'marked_at', 'last_edited_by', 'last_edited_at']

    def get_class_name(self, record):
        if record.school_class_id:
            return record.school_class.name
        return record.student.school_class.name if record.student.school_class_id else ''

    def validate_date(self, value):
        error = attendance_date_error(value)
        if error:
            raise serializers.ValidationError(error)
        return value

    def validate(self, attrs):
        status_value = attrs.get('status', getattr(self.instance, 'status', 'present'))
        reason = attrs.get('excuse_reason', getattr(self.instance, 'excuse_reason', ''))
        late_minutes = attrs.get('late_minutes', getattr(self.instance, 'late_minutes', 0))
        if status_value == 'excused' and not reason:
            raise serializers.ValidationError({'excuse_reason': 'Choose a reason for an excused absence.'})
        if status_value != 'late' and late_minutes:
            if self.instance and self.instance.status == 'late' and 'late_minutes' not in attrs:
                attrs['late_minutes'] = 0
            else:
                raise serializers.ValidationError({'late_minutes': 'Late minutes can only be set for a late arrival.'})
        if status_value != 'excused' and 'excuse_reason' in attrs and reason:
            raise serializers.ValidationError({'excuse_reason': 'An excuse reason is only valid for an excused absence.'})
        if status_value != 'excused' and self.instance and self.instance.excuse_reason and 'excuse_reason' not in attrs:
            attrs['excuse_reason'] = ''
            attrs['excuse_note'] = ''
        return attrs


class SchoolCalendarDaySerializer(serializers.ModelSerializer):
    class Meta:
        model = SchoolCalendarDay
        fields = ['id', 'date', 'day_type', 'note', 'term', 'updated_by', 'updated_at']
        read_only_fields = ['updated_by', 'updated_at']


class AttendanceSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = AttendanceSettings
        fields = [
            'id', 'edit_cutoff_hours', 'at_risk_percentage', 'consecutive_absence_threshold',
            'sessions_enabled', 'lesson_attendance_enabled', 'updated_by', 'updated_at',
        ]
        read_only_fields = ['updated_by', 'updated_at']


class AttendanceExcuseSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.name', read_only=True)

    class Meta:
        model = AttendanceExcuse
        fields = [
            'id', 'student', 'student_name', 'date', 'reason', 'note', 'attachment', 'status',
            'submitted_by', 'submitted_at', 'reviewed_by', 'reviewed_at', 'review_note',
        ]
        read_only_fields = ['status', 'submitted_by', 'submitted_at', 'reviewed_by', 'reviewed_at', 'review_note']

    def validate(self, attrs):
        request = self.context.get('request')
        student = attrs.get('student', getattr(self.instance, 'student', None))
        if request and student and request.user != student.user:
            from parents.models import StudentParent
            if not StudentParent.objects.filter(student=student, parent__user=request.user).exists():
                raise serializers.ValidationError({'student': 'You can submit an excuse only for your own child.'})
        uploaded_file = attrs.get('attachment')
        if uploaded_file:
            if uploaded_file.size > 8 * 1024 * 1024:
                raise serializers.ValidationError({'attachment': 'Attachments must be 8 MB or smaller.'})
            if uploaded_file.content_type not in {'image/jpeg', 'image/png', 'application/pdf'}:
                raise serializers.ValidationError({'attachment': 'Upload a JPEG, PNG, or PDF file.'})
        return attrs


class AttendanceTermSummarySerializer(serializers.ModelSerializer):
    term_name = serializers.CharField(source='term.name', read_only=True)
    academic_year = serializers.CharField(source='term.academic_year.name', read_only=True)

    class Meta:
        model = AttendanceTermSummary
        fields = [
            'id', 'student', 'term', 'term_name', 'academic_year', 'total_school_days', 'days_present',
            'days_absent', 'days_late', 'days_excused', 'days_sick_bay', 'days_suspended',
            'attendance_percentage', 'is_finalized', 'is_out_of_date', 'calculated_at',
        ]
        read_only_fields = fields


class AttendanceAuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AttendanceAuditLog
        fields = ['id', 'attendance_record', 'student', 'actor', 'action', 'old_value', 'new_value', 'reason', 'created_at']
        read_only_fields = fields


class AttendanceReportSnapshotSerializer(serializers.ModelSerializer):
    class Meta:
        model = AttendanceReportSnapshot
        fields = ['id', 'exam', 'student', 'term', 'through_date', 'summary', 'is_out_of_date', 'generated_at']
        read_only_fields = fields


class AttendanceNotificationSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.name', read_only=True)
    term_name = serializers.CharField(source='term.name', read_only=True, allow_null=True)

    class Meta:
        model = AttendanceNotification
        fields = ['id', 'student', 'student_name', 'term', 'term_name', 'kind', 'message', 'created_at', 'read_at']
        read_only_fields = ['id', 'student', 'student_name', 'term', 'term_name', 'kind', 'message', 'created_at']
