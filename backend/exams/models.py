from django.db import models
from school.models import SchoolClass, Subject, Student


class Exam(models.Model):
    STATUS_CHOICES = [
        ('scheduled', 'Scheduled'),
        ('ongoing', 'Ongoing'),
        ('completed', 'Completed'),
        ('grading', 'Grading in Progress'),
    ]
    name = models.CharField(max_length=255)
    term = models.CharField(max_length=32)
    year = models.CharField(max_length=8)
    start_date = models.DateField()
    end_date = models.DateField()
    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default='scheduled')
    created_at = models.DateTimeField(auto_now_add=True)
    classes = models.ManyToManyField(SchoolClass, related_name='exams', blank=True)
    subjects = models.ManyToManyField(Subject, related_name='exams', blank=True)

    class Meta:
        ordering = ['-start_date']

    def __str__(self):
        return self.name


class ExamSchedule(models.Model):
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name='schedules')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='exam_schedules')
    school_class = models.ForeignKey(SchoolClass, on_delete=models.CASCADE, related_name='exam_schedules')
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    venue = models.CharField(max_length=64, blank=True)
    invigilator = models.CharField(max_length=128, blank=True)

    class Meta:
        ordering = ['date', 'start_time']

    def __str__(self):
        return f"{self.exam.name} - {self.subject.name} - {self.school_class.name}"


class ExamMark(models.Model):
    """Marks per student per subject per exam."""
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name='marks')
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='exam_marks')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='exam_marks')
    total_marks = models.PositiveIntegerField(default=100)
    scored = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = [['exam', 'student', 'subject']]
        ordering = ['student', 'subject']

    def __str__(self):
        return f"{self.student.name} - {self.subject.name} - {self.scored}/{self.total_marks}"
