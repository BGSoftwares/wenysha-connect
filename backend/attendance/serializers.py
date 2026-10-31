from rest_framework import serializers
from .models import AttendanceRecord
from .school_calendar import attendance_date_error


class AttendanceRecordSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.name', read_only=True)
    class_name = serializers.CharField(source='student.school_class.name', read_only=True)

    class Meta:
        model = AttendanceRecord
        fields = ['id', 'student', 'student_name', 'class_name', 'date', 'status']

    def validate_date(self, value):
        error = attendance_date_error(value)
        if error:
            raise serializers.ValidationError(error)
        return value
