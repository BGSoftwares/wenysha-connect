from rest_framework import serializers
from .models import Exam, ExamSchedule, ExamMark, MarkSubmission
from core.roles import is_admin, portal_role
from school.models import TeacherSubjectClass


class ExamSerializer(serializers.ModelSerializer):
    class Meta:
        model = Exam
        fields = [
            'id', 'name', 'report_type', 'results_published', 'term', 'year', 'start_date', 'end_date', 'status', 'created_at',
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
        fields = ['id', 'exam', 'student', 'student_name', 'subject', 'subject_name', 'total_marks', 'scored', 'comment']

    def validate(self, attrs):
        exam = attrs.get('exam', getattr(self.instance, 'exam', None))
        student = attrs.get('student', getattr(self.instance, 'student', None))
        subject = attrs.get('subject', getattr(self.instance, 'subject', None))
        if exam and student and subject:
            if not exam.classes.filter(pk=student.school_class_id).exists():
                raise serializers.ValidationError({'student': 'This student is not in a class assigned to the exam.'})
            if not exam.subjects.filter(pk=subject.pk).exists():
                raise serializers.ValidationError({'subject': 'This subject is not assigned to the exam.'})

            request = self.context.get('request')
            if request and portal_role(request.user) == 'teacher':
                if exam.results_published:
                    raise serializers.ValidationError({'detail': 'Published marks can only be changed by an administrator.'})
                if not TeacherSubjectClass.objects.filter(
                    teacher__user=request.user,
                    school_class_id=student.school_class_id,
                    subject_id=subject.pk,
                ).exists():
                    raise serializers.ValidationError({'detail': 'You can only enter marks for your allocated class and subject.'})
            elif request and not is_admin(request.user):
                raise serializers.ValidationError({'detail': 'Your account cannot enter examination marks.'})
        return attrs


class MarkSubmissionSerializer(serializers.ModelSerializer):
    exam_name = serializers.CharField(source='exam.name', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    class_name = serializers.CharField(source='school_class.name', read_only=True)

    class Meta:
        model = MarkSubmission
        fields = ['id', 'exam', 'exam_name', 'subject', 'subject_name', 'school_class', 'class_name',
                  'teacher_name', 'note', 'submitted_at']
