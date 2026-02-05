from django.db import models
from django.conf import settings


class SchoolClass(models.Model):
    """e.g. Form 4A, Form 3B."""
    name = models.CharField(max_length=64, unique=True)
    capacity = models.PositiveIntegerField(default=45)
    enrolled = models.PositiveIntegerField(default=0)  # denormalized count
    class_teacher = models.ForeignKey(
        'Teacher', on_delete=models.SET_NULL, null=True, blank=True, related_name='teaching_classes'
    )

    class Meta:
        verbose_name = 'Class'
        verbose_name_plural = 'Classes'

    def __str__(self):
        return self.name


class Teacher(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True, related_name='teacher_profile'
    )
    name = models.CharField(max_length=255)
    department = models.CharField(max_length=128, blank=True)
    phone = models.CharField(max_length=32, blank=True)

    def __str__(self):
        return self.name


class Subject(models.Model):
    name = models.CharField(max_length=128)
    code = models.CharField(max_length=32, blank=True)
    curriculum = models.CharField(max_length=64, blank=True)
    department = models.CharField(max_length=128, blank=True)

    def __str__(self):
        return self.name


class Student(models.Model):
    STATUS_CHOICES = [('Active', 'Active'), ('Inactive', 'Inactive')]
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True, related_name='student_profile'
    )
    student_id = models.CharField(max_length=32, unique=True)  # STU001
    name = models.CharField(max_length=255)
    school_class = models.ForeignKey(SchoolClass, on_delete=models.PROTECT, related_name='students')
    gender = models.CharField(max_length=16, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Active')
    date_of_birth = models.DateField(null=True, blank=True)
    address = models.TextField(blank=True)

    class Meta:
        ordering = ['student_id']

    def __str__(self):
        return f"{self.name} ({self.student_id})"


class TeacherSubjectClass(models.Model):
    """Allocation: teacher teaches subject to class with N periods per week."""
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE, related_name='allocations')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='allocations')
    school_class = models.ForeignKey(SchoolClass, on_delete=models.CASCADE, related_name='allocations')
    periods = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = [['teacher', 'subject', 'school_class']]
        verbose_name_plural = 'Teacher subject class allocations'

    def __str__(self):
        return f"{self.teacher.name} - {self.subject.name} - {self.school_class.name}"


# --- Academic & Grading ---

class AcademicYear(models.Model):
    name = models.CharField(max_length=64, unique=True, help_text="e.g. 2024")
    start_date = models.DateField()
    end_date = models.DateField()
    is_current = models.BooleanField(default=False)

    def __str__(self):
        return self.name

class Term(models.Model):
    name = models.CharField(max_length=64, help_text="e.g. Term 1")
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE, related_name='terms')
    start_date = models.DateField()
    end_date = models.DateField()
    is_active = models.BooleanField(default=False)

    class Meta:
        unique_together = [['name', 'academic_year']]

    def __str__(self):
        return f"{self.name} - {self.academic_year.name}"

class Assessment(models.Model):
    ASSESSMENT_TYPES = [('Exam', 'Exam'), ('Assignment', 'Assignment'), ('Quiz', 'Quiz')]
    
    name = models.CharField(max_length=128)
    assessment_type = models.CharField(max_length=32, choices=ASSESSMENT_TYPES, default='Exam')
    # Link to TeacherSubjectClass to ensure valid assignment? Or just Subject+Class
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    school_class = models.ForeignKey(SchoolClass, on_delete=models.CASCADE)
    term = models.ForeignKey(Term, on_delete=models.CASCADE)
    total_marks = models.DecimalField(max_digits=5, decimal_places=2, default=100.00)
    due_date = models.DateField(null=True, blank=True)

    def __str__(self):
        return f"{self.name} ({self.school_class} - {self.subject})"

class Grade(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='grades')
    assessment = models.ForeignKey(Assessment, on_delete=models.CASCADE, related_name='grades')
    score = models.DecimalField(max_digits=5, decimal_places=2)
    remarks = models.CharField(max_length=255, blank=True)
    date_recorded = models.DateField(auto_now_add=True)

    class Meta:
        unique_together = [['student', 'assessment']]

    def __str__(self):
        return f"{self.student.name} - {self.assessment.name}: {self.score}"


# --- Fees & Finance ---

class FeeStructure(models.Model):
    """Fees applicable to a class or school-wide for a term."""
    name = models.CharField(max_length=128, help_text="e.g. Tuition Term 1")
    term = models.ForeignKey(Term, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    # Optional: simplify by just linking to class name string or M2M if fees vary by class significantly
    # For now, let's assume fees are generally per term, maybe varying by form level?
    # Simple valid approach: create multiple entries "Form 4 Tuition"
    description = models.TextField(blank=True)
    due_date = models.DateField(null=True, blank=True)

    def __str__(self):
        return f"{self.name} ({self.term})"

class StudentFee(models.Model):
    """Instance of a fee assigned to a specific student."""
    STATUS_CHOICES = [('Pending', 'Pending'), ('Partial', 'Partial'), ('Paid', 'Paid')]

    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='fees')
    fee_structure = models.ForeignKey(FeeStructure, on_delete=models.CASCADE)
    amount_due = models.DecimalField(max_digits=10, decimal_places=2) # Could differ from structure if scholarship
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')

    def save(self, *args, **kwargs):
        if self.amount_paid >= self.amount_due:
            self.status = 'Paid'
        elif self.amount_paid > 0:
            self.status = 'Partial'
        else:
            self.status = 'Pending'
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.student.name} - {self.fee_structure.name}"

class Payment(models.Model):
    student_fee = models.ForeignKey(StudentFee, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    date = models.DateField(auto_now_add=True)
    reference = models.CharField(max_length=64, blank=True)
    method = models.CharField(max_length=32, default='Cash') # Cash, Transfer, Ecocash

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Update parent StudentFee
        fee = self.student_fee
        total_paid = sum(p.amount for p in fee.payments.all())
        fee.amount_paid = total_paid
        fee.save()

# --- Operations ---

class Attendance(models.Model):
    STATUS_CHOICES = [('Present', 'Present'), ('Absent', 'Absent'), ('Late', 'Late'), ('Excused', 'Excused')]
    
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='school_attendance_records')
    date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Present')
    remarks = models.CharField(max_length=255, blank=True)

    class Meta:
        unique_together = [['student', 'date']]

class Timetable(models.Model):
    DAYS = [('Monday', 'Monday'), ('Tuesday', 'Tuesday'), ('Wednesday', 'Wednesday'), ('Thursday', 'Thursday'), ('Friday', 'Friday')]
    
    school_class = models.ForeignKey(SchoolClass, on_delete=models.CASCADE, related_name='timetable_entries')
    day_of_week = models.CharField(max_length=16, choices=DAYS)
    period_start = models.TimeField()
    period_end = models.TimeField()
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    room = models.CharField(max_length=32, blank=True)
    teacher = models.ForeignKey(Teacher, on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        ordering = ['day_of_week', 'period_start']
