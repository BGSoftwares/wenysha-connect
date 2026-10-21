from datetime import datetime

from django.db import transaction
from rest_framework import serializers
from .models import (
    SchoolClass, Teacher, Subject, Student, TeacherSubjectClass,
    AcademicYear, Term, Assessment, Grade, FeeStructure, StudentFee, Payment, Attendance, Timetable
)


class SchoolClassSerializer(serializers.ModelSerializer):
    class_teacher_name = serializers.CharField(source='class_teacher.name', read_only=True)
    enrolled = serializers.SerializerMethodField()

    class Meta:
        model = SchoolClass
        fields = ['id', 'name', 'capacity', 'enrolled', 'class_teacher', 'class_teacher_name', 'parents_whatsapp_group']

    def get_enrolled(self, obj):
        return obj.students.count()


class TeacherSubjectClassSerializer(serializers.ModelSerializer):
    teacher_name = serializers.CharField(source='teacher.name', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    class_name = serializers.CharField(source='school_class.name', read_only=True)
    scheduled_periods = serializers.SerializerMethodField()

    class Meta:
        model = TeacherSubjectClass
        fields = ['id', 'teacher', 'teacher_name', 'subject', 'subject_name', 'school_class', 'class_name', 'periods', 'room', 'scheduled_periods']

    def get_scheduled_periods(self, obj):
        return [
            {
                'day_of_week': period.day_of_week,
                'period_start': period.period_start.strftime('%H:%M'),
                'period_end': period.period_end.strftime('%H:%M'),
                'room': period.room,
            }
            for period in obj.scheduled_periods.all()
        ]

    def validate_periods(self, value):
        if value < 1 or value > 35:
            raise serializers.ValidationError('Periods per week must be between 1 and 35.')
        return value

    def validate_room(self, value):
        room = value.strip()
        if not room:
            raise serializers.ValidationError('Assign a room before adding periods to the master timetable.')
        return room

    def validate(self, attrs):
        periods = attrs.get('periods', getattr(self.instance, 'periods', 0))
        if periods < 1 or periods > 35:
            raise serializers.ValidationError({'periods': 'Periods per week must be between 1 and 35.'})
        room = attrs.get('room', getattr(self.instance, 'room', '')).strip()
        if not room:
            raise serializers.ValidationError({'room': 'Assign a room before adding periods to the master timetable.'})
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        allocation = super().create(validated_data)
        schedule_allocation(allocation)
        return allocation

    @transaction.atomic
    def update(self, instance, validated_data):
        allocation = super().update(instance, validated_data)
        allocation.scheduled_periods.all().delete()
        schedule_allocation(allocation)
        return allocation


LESSON_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
LESSON_SLOTS = [
    ('07:40', '08:40'), ('08:40', '09:40'), ('09:40', '10:40'),
    ('11:10', '12:10'), ('12:10', '13:10'),
    ('14:00', '15:00'), ('15:00', '16:00'),
]


def _overlaps(start, end, other_start, other_end):
    return start < other_end and end > other_start


def _schedule_conflict(school_class_id, teacher_id, room, day, start, end, occupied):
    normalized_room = room.strip().casefold()
    for entry in occupied:
        if entry['day'] != day or not _overlaps(start, end, entry['start'], entry['end']):
            continue
        if entry['school_class_id'] == school_class_id:
            return True
        if teacher_id and entry['teacher_id'] == teacher_id:
            return True
        if normalized_room and entry['room'].strip().casefold() == normalized_room:
            return True
    return False


def schedule_allocation(allocation):
    """Fill the weekly timetable evenly using free one-hour lesson slots."""
    occupied = [
        {
            'day': entry.day_of_week,
            'start': entry.period_start,
            'end': entry.period_end,
            'school_class_id': entry.school_class_id,
            'teacher_id': entry.teacher_id,
            'room': entry.room,
        }
        for entry in Timetable.objects.exclude(allocation=allocation)
    ]
    # Slot-major order spreads repeated lessons across weekdays before using a
    # second period on the same day (e.g. five periods become one per weekday).
    candidates = [
        (day, start, end)
        for start, end in LESSON_SLOTS
        for day in LESSON_DAYS
    ]
    scheduled = []
    for day, start, end in candidates:
        start_time = datetime.strptime(start, '%H:%M').time()
        end_time = datetime.strptime(end, '%H:%M').time()
        if _schedule_conflict(
            allocation.school_class_id, allocation.teacher_id, allocation.room,
            day, start_time, end_time, occupied,
        ):
            continue
        scheduled.append(Timetable(
            school_class_id=allocation.school_class_id,
            day_of_week=day,
            period_start=start_time,
            period_end=end_time,
            subject_id=allocation.subject_id,
            room=allocation.room,
            teacher_id=allocation.teacher_id,
            allocation=allocation,
        ))
        occupied.append({
            'day': day, 'start': start_time, 'end': end_time,
            'school_class_id': allocation.school_class_id,
            'teacher_id': allocation.teacher_id, 'room': allocation.room,
        })
        if len(scheduled) == allocation.periods:
            break
    if len(scheduled) != allocation.periods:
        raise serializers.ValidationError({
            'periods': 'Not enough clash-free lesson slots are available for this allocation. Adjust another allocation or choose a different room.'
        })
    Timetable.objects.bulk_create(scheduled)


class TeacherSerializer(serializers.ModelSerializer):
    allocations = TeacherSubjectClassSerializer(many=True, read_only=True)

    class Meta:
        model = Teacher
        fields = ['id', 'user', 'name', 'department', 'phone', 'employee_id', 'allocations']

    def create(self, validated_data):
        teacher = super().create(validated_data)
        if teacher.user_id:
            from core.sync import sync_linked_portal_records
            sync_linked_portal_records(teacher.user, teacher.name)
        return teacher

    def update(self, instance, validated_data):
        teacher = super().update(instance, validated_data)
        if teacher.user_id:
            from core.sync import sync_linked_portal_records
            sync_linked_portal_records(teacher.user, teacher.name)
        return teacher


class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = ['id', 'name', 'code', 'curriculum', 'department']


class StudentSerializer(serializers.ModelSerializer):
    student_id = serializers.CharField(required=False, allow_blank=True)
    class_name = serializers.CharField(source='school_class.name', read_only=True)
    account_email = serializers.EmailField(source='user.email', read_only=True, allow_null=True)
    next_of_kin = serializers.SerializerMethodField()

    class Meta:
        model = Student
        fields = [
            'id', 'user', 'account_email', 'next_of_kin', 'student_id', 'name', 'school_class', 'class_name', 'gender', 'status',
            'date_of_birth', 'address'
        ]

    def get_next_of_kin(self, obj):
        from parents.models import StudentParent
        links = StudentParent.objects.filter(student=obj).select_related('parent')
        return [
            {'id': link.parent_id, 'name': link.parent.name, 'phone': link.parent.phone, 'email': link.parent.email}
            for link in links
        ]

    def create(self, validated_data):
        if not validated_data.get('student_id') or not validated_data['student_id'].strip():
            from .models import generate_next_student_id
            validated_data['student_id'] = generate_next_student_id()
        return super().create(validated_data)

    def update(self, instance, validated_data):
        student = super().update(instance, validated_data)
        if student.user_id:
            from core.models import UserProfile
            user = student.user
            parts = student.name.strip().split(maxsplit=1)
            user.first_name = parts[0] if parts else ''
            user.last_name = parts[1] if len(parts) > 1 else ''
            user.save(update_fields=['first_name', 'last_name'])
            profile, _ = UserProfile.objects.get_or_create(user=user)
            profile.full_name = student.name
            profile.save(update_fields=['full_name'])
        return student


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
    allocation = serializers.PrimaryKeyRelatedField(queryset=TeacherSubjectClass.objects.all(), required=False, allow_null=True)

    class Meta:
        model = Timetable
        fields = [
            'id', 'school_class', 'class_name', 'day_of_week', 
            'period_start', 'period_end', 'subject', 'subject_name', 
            'room', 'teacher', 'teacher_name', 'allocation'
        ]

    def validate(self, attrs):
        start = attrs.get('period_start', getattr(self.instance, 'period_start', None))
        end = attrs.get('period_end', getattr(self.instance, 'period_end', None))
        day = attrs.get('day_of_week', getattr(self.instance, 'day_of_week', None))
        school_class = attrs.get('school_class', getattr(self.instance, 'school_class', None))
        teacher = attrs.get('teacher', getattr(self.instance, 'teacher', None))
        room = attrs.get('room', getattr(self.instance, 'room', '')).strip()
        if start is None or end is None or start >= end:
            raise serializers.ValidationError({'period_end': 'End time must be after start time.'})
        valid_slots = {
            (datetime.strptime(slot_start, '%H:%M').time(), datetime.strptime(slot_end, '%H:%M').time())
            for slot_start, slot_end in LESSON_SLOTS
        }
        if (start, end) not in valid_slots:
            raise serializers.ValidationError({
                'period_start': 'Lessons must use one-hour slots between 07:40 and 16:00. Break is 10:40–11:10 and lunch is 13:10–14:00.'
            })
        if school_class and day:
            entries = Timetable.objects.filter(day_of_week=day).exclude(pk=getattr(self.instance, 'pk', None))
            for entry in entries.select_related('school_class', 'teacher'):
                if not _overlaps(start, end, entry.period_start, entry.period_end):
                    continue
                class_conflict = entry.school_class_id == school_class.pk
                teacher_conflict = bool(teacher and entry.teacher_id == teacher.pk)
                room_conflict = bool(room and entry.room.strip().casefold() == room.casefold())
                if class_conflict or teacher_conflict or room_conflict:
                    conflict = 'class' if class_conflict else 'teacher' if teacher_conflict else 'room'
                    raise serializers.ValidationError({
                        'period_start': f'This period clashes with another timetable entry for the same {conflict}.'
                    })
        return attrs
