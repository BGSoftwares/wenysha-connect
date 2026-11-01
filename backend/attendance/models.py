from django.conf import settings
from django.db import models
from django.db.models import Q
from django.utils import timezone

from school.models import SchoolClass, Student, Term
from exams.models import Exam


class SchoolCalendarDay(models.Model):
    DAY_TYPE_CHOICES = [
        ('school_day', 'School day'),
        ('holiday', 'Holiday'),
        ('closed', 'Closed'),
    ]

    date = models.DateField(unique=True)
    day_type = models.CharField(max_length=16, choices=DAY_TYPE_CHOICES)
    note = models.CharField(max_length=255, blank=True)
    term = models.ForeignKey(Term, on_delete=models.SET_NULL, null=True, blank=True, related_name='calendar_days')
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='updated_school_calendar_days',
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['date']
        indexes = [models.Index(fields=['date', 'day_type'])]

    def __str__(self):
        return f'{self.date} - {self.get_day_type_display()}'


class AttendanceSettings(models.Model):
    edit_cutoff_hours = models.PositiveSmallIntegerField(default=24)
    at_risk_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=85)
    consecutive_absence_threshold = models.PositiveSmallIntegerField(default=3)
    sessions_enabled = models.BooleanField(default=False)
    lesson_attendance_enabled = models.BooleanField(default=False)
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='attendance_settings_updates',
    )
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return 'Attendance settings'


class AttendanceRecord(models.Model):
    SESSION_CHOICES = [
        ('morning', 'Morning'),
        ('afternoon', 'Afternoon'),
        ('evening', 'Evening'),
    ]
    STATUS_CHOICES = [
        ('present', 'Present'),
        ('absent', 'Absent'),
        ('late', 'Late'),
        ('excused', 'Excused'),
        ('sick_bay', 'Sick bay'),
        ('suspended', 'Suspended'),
    ]
    EXCUSE_REASON_CHOICES = [
        ('sick', 'Sick'),
        ('funeral', 'Funeral'),
        ('family_emergency', 'Family emergency'),
        ('school_trip', 'School-sanctioned trip or sports'),
        ('fees_related', 'Fees-related'),
        ('other', 'Other'),
    ]

    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='attendance_records')
    school_class = models.ForeignKey(
        SchoolClass, on_delete=models.SET_NULL, null=True, blank=True, related_name='attendance_records'
    )
    term = models.ForeignKey(
        Term, on_delete=models.SET_NULL, null=True, blank=True, related_name='attendance_records'
    )
    date = models.DateField()
    session = models.CharField(max_length=16, choices=SESSION_CHOICES, default='morning')
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default='present')
    late_minutes = models.PositiveSmallIntegerField(default=0)
    excuse_reason = models.CharField(max_length=32, choices=EXCUSE_REASON_CHOICES, blank=True)
    excuse_note = models.CharField(max_length=500, blank=True)
    marked_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='attendance_marked'
    )
    marked_at = models.DateTimeField(default=timezone.now)
    last_edited_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='attendance_last_edited',
    )
    last_edited_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-date', 'student_id', 'session']
        constraints = [
            models.UniqueConstraint(fields=['student', 'date', 'session'], name='unique_attendance_student_date_session'),
            models.CheckConstraint(
                check=Q(status='late') | Q(late_minutes=0),
                name='attendance_late_minutes_only_for_late',
            ),
        ]
        indexes = [
            models.Index(fields=['student', 'term', 'date']),
            models.Index(fields=['school_class', 'date', 'session']),
        ]

    def __str__(self):
        return f'{self.student.name} - {self.date} - {self.session} - {self.status}'


class AttendanceExcuse(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='attendance_excuses')
    date = models.DateField()
    reason = models.CharField(max_length=32, choices=AttendanceRecord.EXCUSE_REASON_CHOICES)
    note = models.CharField(max_length=1000, blank=True)
    attachment = models.FileField(upload_to='attendance/excuses/%Y/%m/', null=True, blank=True)
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default='pending')
    submitted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='attendance_excuses_submitted'
    )
    submitted_at = models.DateTimeField(auto_now_add=True)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='attendance_excuses_reviewed',
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    review_note = models.CharField(max_length=500, blank=True)

    class Meta:
        ordering = ['-submitted_at']
        indexes = [models.Index(fields=['student', 'date', 'status'])]

    def __str__(self):
        return f'{self.student.name} - {self.date} ({self.status})'


class AttendanceAuditLog(models.Model):
    attendance_record = models.ForeignKey(
        AttendanceRecord, on_delete=models.SET_NULL, null=True, blank=True, related_name='audit_entries'
    )
    student = models.ForeignKey(Student, on_delete=models.SET_NULL, null=True, related_name='attendance_audit_entries')
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='attendance_audit_entries'
    )
    action = models.CharField(max_length=16, choices=[
        ('created', 'Created'),
        ('updated', 'Updated'),
        ('deleted', 'Deleted'),
    ])
    old_value = models.JSONField(null=True, blank=True)
    new_value = models.JSONField(null=True, blank=True)
    reason = models.CharField(max_length=500, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['student', 'created_at']),
            models.Index(fields=['actor', 'created_at']),
        ]

    def __str__(self):
        return f'{self.action} attendance for {self.student_id} by {self.actor_id}'


class AttendanceTermSummary(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='attendance_term_summaries')
    term = models.ForeignKey(Term, on_delete=models.CASCADE, related_name='attendance_summaries')
    total_school_days = models.PositiveIntegerField(default=0)
    days_present = models.PositiveIntegerField(default=0)
    days_absent = models.PositiveIntegerField(default=0)
    days_late = models.PositiveIntegerField(default=0)
    days_excused = models.PositiveIntegerField(default=0)
    days_sick_bay = models.PositiveIntegerField(default=0)
    days_suspended = models.PositiveIntegerField(default=0)
    attendance_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    is_finalized = models.BooleanField(default=False)
    is_out_of_date = models.BooleanField(default=False)
    calculated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['student', 'term'], name='unique_attendance_summary_student_term'),
        ]
        indexes = [models.Index(fields=['term', 'attendance_percentage'])]

    def __str__(self):
        return f'{self.student.name} - {self.term} - {self.attendance_percentage}%'


class AttendanceReportSnapshot(models.Model):
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name='attendance_snapshots')
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='attendance_report_snapshots')
    term = models.ForeignKey(Term, on_delete=models.SET_NULL, null=True, blank=True, related_name='report_snapshots')
    through_date = models.DateField()
    summary = models.JSONField(default=dict)
    is_out_of_date = models.BooleanField(default=False)
    generated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['exam', 'student'], name='unique_attendance_snapshot_exam_student'),
        ]
        indexes = [models.Index(fields=['student', 'exam', 'is_out_of_date'])]

    def __str__(self):
        return f'{self.student.name} - attendance for {self.exam.name}'


class AttendanceNotification(models.Model):
    KIND_CHOICES = [
        ('absent', 'Absent'),
        ('late', 'Late'),
        ('low_attendance', 'Low attendance'),
    ]

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='attendance_notifications',
    )
    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name='attendance_notifications',
    )
    attendance_record = models.ForeignKey(
        AttendanceRecord,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='notifications',
    )
    term = models.ForeignKey(
        Term,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='attendance_notifications',
    )
    kind = models.CharField(max_length=24, choices=KIND_CHOICES)
    message = models.CharField(max_length=500)
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        constraints = [
            models.UniqueConstraint(
                fields=['recipient', 'student', 'term', 'kind'],
                condition=Q(kind='low_attendance', term__isnull=False),
                name='unique_low_attendance_notification_per_term',
            ),
            models.UniqueConstraint(
                fields=['recipient', 'attendance_record', 'kind'],
                condition=Q(attendance_record__isnull=False, kind__in=['absent', 'late']),
                name='unique_daily_attendance_notification',
            ),
        ]
        indexes = [models.Index(fields=['recipient', 'read_at', 'created_at'])]

    def __str__(self):
        return f'{self.kind} notification for {self.student.name} to {self.recipient_id}'
