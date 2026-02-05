from rest_framework import serializers
from .models import Exam, ExamSchedule, ExamMark


class ExamSerializer(serializers.ModelSerializer):
    class Meta:
        model = Exam
        fields = [
            'id', 'name', 'term', 'year', 'start_date', 'end_date', 'status', 'created_at',
            'classes', 'subjects'
        ]


class ExamScheduleSerializer(serializers.ModelSerializer):
    exam_name = serializers.CharField(source='exam.name', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    class_name = serializers.CharField(source='school_class.name', read_only=True)

    class Meta:
        model = ExamSchedule
        fields = [
            'id', 'exam', 'exam_name', 'subject', 'subject_name', 'school_class', 'class_name',
            'date', 'start_time', 'end_time', 'venue', 'invigilator'
        ]


class ExamMarkSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.name', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)

    class Meta:
        model = ExamMark
        fields = ['id', 'exam', 'student', 'student_name', 'subject', 'subject_name', 'total_marks', 'scored']
