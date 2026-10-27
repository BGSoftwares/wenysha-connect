from rest_framework import serializers
from .models import Exam, ExamSchedule, ExamMark, MarkSubmission
from core.roles import is_admin, portal_role
from school.models import SchoolClass, Student, Subject, TeacherSubjectClass


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
        total_marks = attrs.get('total_marks', getattr(self.instance, 'total_marks', None))
        scored = attrs.get('scored', getattr(self.instance, 'scored', None))
        if total_marks is not None and total_marks <= 0:
            raise serializers.ValidationError({'total_marks': 'Total marks must be greater than zero.'})
        if scored is not None and scored < 0:
            raise serializers.ValidationError({'scored': 'Score cannot be negative.'})
        if total_marks is not None and scored is not None and scored > total_marks:
            raise serializers.ValidationError({'scored': 'Score cannot exceed total marks.'})
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


class ExamMarkSheetRowSerializer(serializers.Serializer):
    student = serializers.PrimaryKeyRelatedField(queryset=Student.objects.all())
    total_marks = serializers.IntegerField(min_value=1)
    scored = serializers.IntegerField(min_value=0)
    comment = serializers.CharField(max_length=500, required=False, allow_blank=True, default='')

    def validate(self, attrs):
        if attrs['scored'] > attrs['total_marks']:
            raise serializers.ValidationError({'scored': 'Score cannot exceed total marks.'})
        return attrs


class ExamMarkSheetSerializer(serializers.Serializer):
    exam = serializers.PrimaryKeyRelatedField(queryset=Exam.objects.all())
    school_class = serializers.PrimaryKeyRelatedField(queryset=SchoolClass.objects.all())
    subject = serializers.PrimaryKeyRelatedField(queryset=Subject.objects.all())
    marks = ExamMarkSheetRowSerializer(many=True, allow_empty=False)

    def validate(self, attrs):
        exam = attrs['exam']
        school_class = attrs['school_class']
        subject = attrs['subject']
        rows = attrs['marks']
        if not exam.classes.filter(pk=school_class.pk).exists():
            raise serializers.ValidationError({'school_class': 'This class is not assigned to the selected exam.'})
        if not exam.subjects.filter(pk=subject.pk).exists():
            raise serializers.ValidationError({'subject': 'This subject is not assigned to the selected exam.'})

        student_ids = [row['student'].pk for row in rows]
        if len(student_ids) != len(set(student_ids)):
            raise serializers.ValidationError({'marks': 'A student can appear only once in a mark sheet.'})
        if any(row['student'].school_class_id != school_class.pk for row in rows):
            raise serializers.ValidationError({'marks': 'Every student must belong to the selected class.'})

        request = self.context.get('request')
        if request and portal_role(request.user) == 'teacher':
            if exam.results_published:
                raise serializers.ValidationError({'detail': 'Published marks can only be changed by an administrator.'})
            if not TeacherSubjectClass.objects.filter(
                teacher__user=request.user,
                school_class=school_class,
                subject=subject,
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
