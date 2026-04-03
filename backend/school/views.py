from rest_framework import viewsets
from .models import SchoolClass, Teacher, Subject, Student, TeacherSubjectClass
from .serializers import (
    SchoolClassSerializer,
    TeacherSerializer,
    SubjectSerializer,
    StudentSerializer,
    TeacherSubjectClassSerializer,
)
from core.permissions import IsAdminOrReadOwnOnly


class SchoolClassViewSet(viewsets.ModelViewSet):
    queryset = SchoolClass.objects.select_related('class_teacher').all()
    serializer_class = SchoolClassSerializer


class TeacherViewSet(viewsets.ModelViewSet):
    queryset = Teacher.objects.all()
    serializer_class = TeacherSerializer


class SubjectViewSet(viewsets.ModelViewSet):
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer


class StudentViewSet(viewsets.ModelViewSet):
    queryset = Student.objects.select_related('school_class').all()
    serializer_class = StudentSerializer
    search_fields = ['student_id', 'name']
    filterset_fields = ['school_class', 'status']
    permission_classes = [IsAdminOrReadOwnOnly]


class TeacherSubjectClassViewSet(viewsets.ModelViewSet):
    queryset = TeacherSubjectClass.objects.select_related('teacher', 'subject', 'school_class').all()
    serializer_class = TeacherSubjectClassSerializer
    filterset_fields = ['teacher', 'subject', 'school_class']


# --- Academic & Grading Views ---

from .models import AcademicYear, Term, Assessment, Grade, FeeStructure, StudentFee, Payment, Attendance, Timetable
from .serializers import (
    AcademicYearSerializer, TermSerializer, AssessmentSerializer, GradeSerializer,
    FeeStructureSerializer, StudentFeeSerializer, PaymentSerializer, AttendanceSerializer, TimetableSerializer
)

class AcademicYearViewSet(viewsets.ModelViewSet):
    queryset = AcademicYear.objects.all()
    serializer_class = AcademicYearSerializer
    filterset_fields = ['is_current']

class TermViewSet(viewsets.ModelViewSet):
    queryset = Term.objects.select_related('academic_year').all()
    serializer_class = TermSerializer
    filterset_fields = ['academic_year', 'is_active']

class AssessmentViewSet(viewsets.ModelViewSet):
    queryset = Assessment.objects.select_related('subject', 'school_class', 'term').all()
    serializer_class = AssessmentSerializer
    filterset_fields = ['school_class', 'subject', 'term', 'assessment_type']

class GradeViewSet(viewsets.ModelViewSet):
    queryset = Grade.objects.select_related('student', 'assessment__subject').all()
    serializer_class = GradeSerializer
    filterset_fields = ['student', 'assessment']

# --- Fees & Finance Views ---

class FeeStructureViewSet(viewsets.ModelViewSet):
    queryset = FeeStructure.objects.select_related('term').all()
    serializer_class = FeeStructureSerializer
    filterset_fields = ['term']

class StudentFeeViewSet(viewsets.ModelViewSet):
    queryset = StudentFee.objects.select_related('student', 'fee_structure').all()
    serializer_class = StudentFeeSerializer
    filterset_fields = ['student', 'status']

class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.select_related('student_fee__student', 'student_fee__fee_structure').all()
    serializer_class = PaymentSerializer
    filterset_fields = ['student_fee']

# --- Operations Views ---

class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.select_related('student').all()
    serializer_class = AttendanceSerializer
    filterset_fields = ['student', 'date', 'status']

class TimetableViewSet(viewsets.ModelViewSet):
    queryset = Timetable.objects.select_related('school_class', 'subject', 'teacher').all()
    serializer_class = TimetableSerializer
    filterset_fields = ['school_class', 'day_of_week', 'teacher']
