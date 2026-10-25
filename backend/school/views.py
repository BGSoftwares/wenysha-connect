from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from core.roles import is_admin, portal_role, teacher_class_ids
from parents.models import StudentParent
from .models import (
    SchoolClass, Teacher, Subject, Student, TeacherSubjectClass,
    Assessment, Grade, StudentFee, Attendance, Timetable,
)
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
    queryset = Teacher.objects.prefetch_related('allocations__subject', 'allocations__school_class', 'teaching_classes').all().order_by('id')
    serializer_class = TeacherSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        from core.roles import portal_role
        if portal_role(self.request.user) == 'teacher':
            return queryset.filter(user=self.request.user)
        return queryset

    def _require_admin(self):
        from core.roles import is_admin
        if not is_admin(self.request.user):
            raise PermissionDenied('Only administrators can manage teacher records.')

    def perform_create(self, serializer):
        self._require_admin()
        serializer.save()

    def perform_update(self, serializer):
        self._require_admin()
        serializer.save()

    def destroy(self, request, *args, **kwargs):
        from core.roles import is_admin
        if not is_admin(request.user):
            raise PermissionDenied('Only administrators can manage teacher records.')
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
    queryset = Student.objects.select_related('school_class', 'user').all().order_by('id')
    serializer_class = StudentSerializer
    search_fields = ['student_id', 'name']
    filterset_fields = ['school_class', 'status']
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        from core.roles import is_admin, portal_role, teacher_class_ids

        role = portal_role(user)
        if is_admin(user) or role == 'accounts':
            return queryset
        if role == 'teacher':
            return queryset.filter(school_class_id__in=teacher_class_ids(user))
        if role == 'student':
            return queryset.filter(user=user)
        if role == 'parent':
            from parents.models import StudentParent
            linked_student_ids = StudentParent.objects.filter(parent__user=user).values_list('student_id', flat=True)
            return queryset.filter(pk__in=linked_student_ids)
        return queryset.none()

    def _is_class_teacher_for(self, school_class):
        from core.roles import portal_role

        if portal_role(self.request.user) != 'teacher':
            return False
        return bool(school_class and school_class.class_teacher_id and
                    school_class.class_teacher.user_id == self.request.user.pk)

    def perform_create(self, serializer):
        from core.roles import is_admin

        school_class = serializer.validated_data.get('school_class')
        role = portal_role(self.request.user)
        if not is_admin(self.request.user) and not self._is_class_teacher_for(school_class):
            raise PermissionDenied('Only the assigned class teacher can add students to this class.')
        if role == 'teacher' and not serializer.validated_data.get('next_of_kin_details'):
            raise ValidationError({'next_of_kin_details': 'Next of kin details are required when a teacher enrolls a student.'})
        self.created_student = serializer.save()

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        student = getattr(self, 'created_student', None)
        temporary_password = getattr(student, '_portal_temporary_password', None)
        if student and temporary_password:
            response.data['portal_credentials'] = {
                'username': student.user.username,
                'temporary_password': temporary_password,
            }
        return response

    def perform_update(self, serializer):
        from core.roles import is_admin

        if not is_admin(self.request.user):
            if 'user' in serializer.validated_data:
                raise PermissionDenied('Only an administrator can link a student portal account.')
            current_class = self.get_object().school_class
            target_class = serializer.validated_data.get('school_class', current_class)
            if not self._is_class_teacher_for(current_class) or not self._is_class_teacher_for(target_class):
                raise PermissionDenied('Only the assigned class teacher can update students in this class.')
        serializer.save()

    @transaction.atomic
    def perform_destroy(self, instance):
        from core.roles import display_name, is_admin

        if not is_admin(self.request.user):
            if not self._is_class_teacher_for(instance.school_class):
                raise PermissionDenied('Only the assigned class teacher can remove students from this class.')

            from notices.models import Notice

            teacher_name = display_name(self.request.user)
            Notice.objects.create(
                title=f'ALERT: Student removed from {instance.school_class.name}',
                content=(
                    f'{teacher_name} removed {instance.name} (student ID: {instance.student_id}) '
                    f'from {instance.school_class.name} on {timezone.localtime():%Y-%m-%d %H:%M}.'
                ),
                author=teacher_name,
                audience='Administrators',
                priority='High',
                pinned=True,
                recipient_type='staff',
                created_by=self.request.user,
                status='approved',
                approved_at=timezone.now(),
            )
        super().perform_destroy(instance)


class TeacherSubjectClassViewSet(viewsets.ModelViewSet):
    queryset = TeacherSubjectClass.objects.select_related('teacher', 'subject', 'school_class').all().order_by('id')
    serializer_class = TeacherSubjectClassSerializer
    filterset_fields = ['teacher', 'subject', 'school_class']
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        from core.roles import is_admin, portal_role
        if is_admin(self.request.user):
            return queryset
        if portal_role(self.request.user) == 'teacher':
            return queryset.filter(teacher__user=self.request.user)
        return queryset.none()

    def _require_admin(self):
        from core.roles import is_admin
        if not is_admin(self.request.user):
            raise PermissionDenied('Only administrators can change teaching allocations.')

    def perform_create(self, serializer):
        self._require_admin()
        serializer.save()

    def perform_update(self, serializer):
        self._require_admin()
        serializer.save()

    def perform_destroy(self, instance):
        self._require_admin()
        instance.delete()


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

    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()
        role = portal_role(user)
        if is_admin(user):
            return queryset
        if role == 'student':
            return queryset.filter(student__user=user)
        if role == 'parent':
            linked_ids = StudentParent.objects.filter(parent__user=user).values_list('student_id', flat=True)
            return queryset.filter(student_id__in=linked_ids)
        if role == 'teacher':
            class_teacher_ids = SchoolClass.objects.filter(class_teacher__user=user).values_list('id', flat=True)
            allocations = TeacherSubjectClass.objects.filter(teacher__user=user)
            return queryset.filter(
                Q(assessment__school_class_id__in=class_teacher_ids)
                | Q(
                    assessment__school_class_id__in=allocations.values('school_class_id'),
                    assessment__subject_id__in=allocations.values('subject_id'),
                )
            )
        return queryset.none()

    def _validate_grade_write(self, student, assessment):
        user = self.request.user
        if not (is_admin(user) or portal_role(user) == 'teacher'):
            raise PermissionDenied('Only teachers and administrators can change academic grades.')
        if student.school_class_id != assessment.school_class_id:
            raise PermissionDenied('A student can only receive a grade for an assessment in their class.')
        if portal_role(user) == 'teacher':
            is_class_teacher = SchoolClass.objects.filter(
                pk=assessment.school_class_id, class_teacher__user=user
            ).exists()
            is_subject_teacher = TeacherSubjectClass.objects.filter(
                teacher__user=user,
                school_class_id=assessment.school_class_id,
                subject_id=assessment.subject_id,
            ).exists()
            if not (is_class_teacher or is_subject_teacher):
                raise PermissionDenied('You can only grade assessments for classes and subjects assigned to you.')

    def perform_create(self, serializer):
        self._validate_grade_write(serializer.validated_data['student'], serializer.validated_data['assessment'])
        serializer.save()

    def perform_update(self, serializer):
        instance = self.get_object()
        self._validate_grade_write(
            serializer.validated_data.get('student', instance.student),
            serializer.validated_data.get('assessment', instance.assessment),
        )
        serializer.save()

    def perform_destroy(self, instance):
        self._validate_grade_write(instance.student, instance.assessment)
        instance.delete()

# --- Fees & Finance Views ---

class FeeStructureViewSet(viewsets.ModelViewSet):
    queryset = FeeStructure.objects.select_related('term').all().order_by('id')
    serializer_class = FeeStructureSerializer
    filterset_fields = ['term']

class StudentFeeViewSet(viewsets.ModelViewSet):
    queryset = StudentFee.objects.select_related('student', 'fee_structure').all().order_by('id')
    serializer_class = StudentFeeSerializer
    filterset_fields = ['student', 'status']

    def get_queryset(self):
        user = self.request.user
        role = portal_role(user)
        queryset = super().get_queryset()
        if is_admin(user) or role == 'accounts':
            return queryset
        if role == 'student':
            return queryset.filter(student__user=user)
        if role == 'parent':
            linked_ids = StudentParent.objects.filter(parent__user=user).values_list('student_id', flat=True)
            return queryset.filter(student_id__in=linked_ids)
        return queryset.none()

    def _require_finance_staff(self):
        if not (is_admin(self.request.user) or portal_role(self.request.user) == 'accounts'):
            raise PermissionDenied('Only accounts staff or administrators can change fee records.')

    def perform_create(self, serializer):
        self._require_finance_staff()
        serializer.save()

    def perform_update(self, serializer):
        self._require_finance_staff()
        serializer.save()

    def perform_destroy(self, instance):
        self._require_finance_staff()
        instance.delete()

class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.select_related('student_fee__student', 'student_fee__fee_structure').all().order_by('id')
    serializer_class = PaymentSerializer
    filterset_fields = ['student_fee']

# --- Operations Views ---

class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.select_related('student').all().order_by('id')
    serializer_class = AttendanceSerializer
    filterset_fields = ['student', 'date', 'status']

    def get_queryset(self):
        user = self.request.user
        role = portal_role(user)
        queryset = super().get_queryset()
        if is_admin(user):
            return queryset
        if role == 'student':
            return queryset.filter(student__user=user)
        if role == 'parent':
            linked_ids = StudentParent.objects.filter(parent__user=user).values_list('student_id', flat=True)
            return queryset.filter(student_id__in=linked_ids)
        if role == 'teacher':
            return queryset.filter(student__school_class_id__in=teacher_class_ids(user))
        return queryset.none()

    def _require_teacher_or_admin(self, student):
        user = self.request.user
        if is_admin(user):
            return
        if portal_role(user) != 'teacher' or student.school_class_id not in teacher_class_ids(user):
            raise PermissionDenied('Only an administrator or a teacher assigned to the class can change attendance.')

    def perform_create(self, serializer):
        self._require_teacher_or_admin(serializer.validated_data['student'])
        serializer.save()

    def perform_update(self, serializer):
        instance = self.get_object()
        self._require_teacher_or_admin(serializer.validated_data.get('student', instance.student))
        serializer.save()

    def perform_destroy(self, instance):
        self._require_teacher_or_admin(instance.student)
        instance.delete()

    @action(detail=False, methods=['post'])
    def bulk(self, request):
        serializer = self.get_serializer(data=request.data, many=True)
        serializer.is_valid(raise_exception=True)
        for record in serializer.validated_data:
            self._require_teacher_or_admin(record['student'])
        with transaction.atomic():
            records = serializer.save()
        return Response(self.get_serializer(records, many=True).data, status=status.HTTP_201_CREATED)

class TimetableViewSet(viewsets.ModelViewSet):
    queryset = Timetable.objects.select_related('school_class', 'subject', 'teacher').all().order_by('day_of_week', 'period_start')
    serializer_class = TimetableSerializer
    filterset_fields = ['school_class', 'day_of_week', 'teacher']
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        from core.roles import is_admin, portal_role
        if is_admin(user):
            return queryset
        role = portal_role(user)
        if role == 'teacher':
            return queryset.filter(teacher__user=user)
        if role == 'student':
            return queryset.filter(school_class__students__user=user)
        if role == 'parent':
            from parents.models import StudentParent
            student_ids = StudentParent.objects.filter(parent__user=user).values_list('student_id', flat=True)
            return queryset.filter(school_class__students__in=student_ids).distinct()
        return queryset.none()

    def _require_admin(self):
        from core.roles import is_admin
        if not is_admin(self.request.user):
            raise PermissionDenied('Only administrators can edit the master timetable.')

    def perform_create(self, serializer):
        self._require_admin()
        serializer.save()

    def perform_update(self, serializer):
        self._require_admin()
        serializer.save()

    def perform_destroy(self, instance):
        self._require_admin()
        instance.delete()
