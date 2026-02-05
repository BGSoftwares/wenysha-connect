from rest_framework import serializers
from .models import (
    SchoolClass, Teacher, Subject, Student, TeacherSubjectClass,
    AcademicYear, Term, Assessment, Grade, FeeStructure, StudentFee, Payment, Attendance, Timetable
)


class SchoolClassSerializer(serializers.ModelSerializer):
    class_teacher_name = serializers.CharField(source='class_teacher.name', read_only=True)

    class Meta:
        model = SchoolClass
        fields = ['id', 'name', 'capacity', 'enrolled', 'class_teacher', 'class_teacher_name']


class TeacherSerializer(serializers.ModelSerializer):
    class Meta:
        model = Teacher
        fields = ['id', 'user', 'name', 'department', 'phone']


class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = ['id', 'name', 'code', 'curriculum', 'department']


class StudentSerializer(serializers.ModelSerializer):
    class_name = serializers.CharField(source='school_class.name', read_only=True)

    class Meta:
        model = Student
        fields = [
            'id', 'user', 'student_id', 'name', 'school_class', 'class_name', 'gender', 'status',
            'date_of_birth', 'address'
        ]


class TeacherSubjectClassSerializer(serializers.ModelSerializer):
    teacher_name = serializers.CharField(source='teacher.name', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    class_name = serializers.CharField(source='school_class.name', read_only=True)

    class Meta:
        model = TeacherSubjectClass
        fields = ['id', 'teacher', 'teacher_name', 'subject', 'subject_name', 'school_class', 'class_name', 'periods']


class AcademicYearSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicYear
        fields = '__all__'


class TermSerializer(serializers.ModelSerializer):
    academic_year_name = serializers.CharField(source='academic_year.name', read_only=True)

    class Meta:
        model = Term
        fields = ['id', 'name', 'academic_year', 'academic_year_name', 'start_date', 'end_date', 'is_active']


class AssessmentSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    class_name = serializers.CharField(source='school_class.name', read_only=True)
    term_name = serializers.CharField(source='term.name', read_only=True)

    class Meta:
        model = Assessment
        fields = [
            'id', 'name', 'assessment_type', 'subject', 'subject_name', 
            'school_class', 'class_name', 'term', 'term_name', 
            'total_marks', 'due_date'
        ]


class GradeSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.name', read_only=True)
    assessment_name = serializers.CharField(source='assessment.name', read_only=True)
    subject_name = serializers.CharField(source='assessment.subject.name', read_only=True)

    class Meta:
        model = Grade
        fields = [
            'id', 'student', 'student_name', 'assessment', 'assessment_name', 
            'subject_name', 'score', 'remarks', 'date_recorded'
        ]


class FeeStructureSerializer(serializers.ModelSerializer):
    term_name = serializers.CharField(source='term.name', read_only=True)

    class Meta:
        model = FeeStructure
        fields = ['id', 'name', 'term', 'term_name', 'amount', 'description', 'due_date']


class StudentFeeSerializer(serializers.ModelSerializer):
    fee_name = serializers.CharField(source='fee_structure.name', read_only=True)
    student_name = serializers.CharField(source='student.name', read_only=True)

    class Meta:
        model = StudentFee
        fields = [
            'id', 'student', 'student_name', 'fee_structure', 'fee_name', 
            'amount_due', 'amount_paid', 'status'
        ]


class PaymentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student_fee.student.name', read_only=True)
    fee_name = serializers.CharField(source='student_fee.fee_structure.name', read_only=True)

    class Meta:
        model = Payment
        fields = [
            'id', 'student_fee', 'student_name', 'fee_name', 
            'amount', 'date', 'reference', 'method'
        ]


class AttendanceSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.name', read_only=True)

    class Meta:
        model = Attendance
        fields = ['id', 'student', 'student_name', 'date', 'status', 'remarks']


class TimetableSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    teacher_name = serializers.CharField(source='teacher.name', read_only=True)
    class_name = serializers.CharField(source='school_class.name', read_only=True)

    class Meta:
        model = Timetable
        fields = [
            'id', 'school_class', 'class_name', 'day_of_week', 
            'period_start', 'period_end', 'subject', 'subject_name', 
            'room', 'teacher', 'teacher_name'
        ]
