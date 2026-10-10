from rest_framework import status, viewsets
from rest_framework.response import Response
from .models import SchoolClass, Teacher, Subject, Student, TeacherSubjectClass
from .serializers import (
    SchoolClassSerializer,
    TeacherSerializer,
    SubjectSerializer,
    StudentSerializer,
    TeacherSubjectClassSerializer,
)


class SchoolClassViewSet(viewsets.ModelViewSet):
    queryset = SchoolClass.objects.select_related('class_teacher').all().order_by('id')
    serializer_class = SchoolClassSerializer

    def destroy(self, request, *args, **kwargs):
        school_class = self.get_object()
        if school_class.students.exists() or school_class.timetable_entries.exists() or school_class.allocations.exists() or school_class.exam_schedules.exists() or school_class.exams.exists():
            return Response({'detail': 'This class has linked student or academic records and cannot be deleted.'}, status=status.HTTP_400_BAD_REQUEST)
        return super().destroy(request, *args, **kwargs)


class TeacherViewSet(viewsets.ModelViewSet):
    queryset = Teacher.objects.all().order_by('id')
    serializer_class = TeacherSerializer

    def destroy(self, request, *args, **kwargs):
        teacher = self.get_object()
        if teacher.allocations.exists() or teacher.teaching_classes.exists():
            return Response({'detail': 'This teacher is assigned to classes or subjects. Remove those assignments before deleting.'}, status=status.HTTP_400_BAD_REQUEST)
        return super().destroy(request, *args, **kwargs)


class SubjectViewSet(viewsets.ModelViewSet):
    queryset = Subject.objects.all().order_by('id')
    serializer_class = SubjectSerializer

    def destroy(self, request, *args, **kwargs):
        subject = self.get_object()
        if subject.allocations.exists() or subject.assessment_set.exists() or subject.exam_schedules.exists() or subject.exam_marks.exists():
            return Response({'detail': 'This subject has linked academic records and cannot be deleted.'}, status=status.HTTP_400_BAD_REQUEST)
        return super().destroy(request, *args, **kwargs)


class StudentViewSet(viewsets.ModelViewSet):
    queryset = Student.objects.select_related('school_class').all().order_by('id')
    serializer_class = StudentSerializer
    search_fields = ['student_id', 'name']
    filterset_fields = ['school_class', 'status']


class TeacherSubjectClassViewSet(viewsets.ModelViewSet):
    queryset = TeacherSubjectClass.objects.select_related('teacher', 'subject', 'school_class').all().order_by('id')
    serializer_class = TeacherSubjectClassSerializer
    filterset_fields = ['teacher', 'subject', 'school_class']


# --- Academic & Grading Views ---

from .models import AcademicYear, Term, Assessment, Grade, FeeStructure, StudentFee, Payment, Attendance, Timetable
from .serializers import (
    AcademicYearSerializer, TermSerializer, AssessmentSerializer, GradeSerializer,
    FeeStructureSerializer, StudentFeeSerializer, PaymentSerializer, AttendanceSerializer, TimetableSerializer
)

class AcademicYearViewSet(viewsets.ModelViewSet):
    queryset = AcademicYear.objects.all().order_by('id')
    serializer_class = AcademicYearSerializer
    filterset_fields = ['is_current']

class TermViewSet(viewsets.ModelViewSet):
    queryset = Term.objects.select_related('academic_year').all().order_by('id')
    serializer_class = TermSerializer
    filterset_fields = ['academic_year', 'is_active']

class AssessmentViewSet(viewsets.ModelViewSet):
    queryset = Assessment.objects.select_related('subject', 'school_class', 'term').all().order_by('id')
    serializer_class = AssessmentSerializer
    filterset_fields = ['school_class', 'subject', 'term', 'assessment_type']

class GradeViewSet(viewsets.ModelViewSet):
    queryset = Grade.objects.select_related('student', 'assessment__subject').all().order_by('id')
    serializer_class = GradeSerializer
    filterset_fields = ['student', 'assessment']

# --- Fees & Finance Views ---

class FeeStructureViewSet(viewsets.ModelViewSet):
    queryset = FeeStructure.objects.select_related('term').all().order_by('id')
    serializer_class = FeeStructureSerializer
    filterset_fields = ['term']

class StudentFeeViewSet(viewsets.ModelViewSet):
    queryset = StudentFee.objects.select_related('student', 'fee_structure').all().order_by('id')
    serializer_class = StudentFeeSerializer
    filterset_fields = ['student', 'status']

class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.select_related('student_fee__student', 'student_fee__fee_structure').all().order_by('id')
    serializer_class = PaymentSerializer
    filterset_fields = ['student_fee']

# --- Operations Views ---

class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.select_related('student').all().order_by('id')
    serializer_class = AttendanceSerializer
    filterset_fields = ['student', 'date', 'status']

class TimetableViewSet(viewsets.ModelViewSet):
    queryset = Timetable.objects.select_related('school_class', 'subject', 'teacher').all().order_by('id')
    serializer_class = TimetableSerializer
    filterset_fields = ['school_class', 'day_of_week', 'teacher']
