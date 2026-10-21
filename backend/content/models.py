from django.db import models
from django.conf import settings


class GalleryItem(models.Model):
    title = models.CharField(max_length=255)
    category = models.CharField(max_length=64)  # Sports, Academics, Arts, Events, Campus
    item_type = models.CharField(max_length=16, default='image')  # image, video
    image_url = models.URLField(max_length=512, blank=True)
    date = models.DateField(null=True, blank=True)

    class Meta:
        ordering = ['-date', '-id']

    def __str__(self):
        return self.title


class Announcement(models.Model):
    category = models.CharField(max_length=64)  # Academic, Events, Sports, Administrative
    title = models.CharField(max_length=255)
    content = models.TextField()
    date = models.CharField(max_length=32)  # or DateField
    important = models.BooleanField(default=False)

    class Meta:
        ordering = ['-id']

    def __str__(self):
        return self.title


class ContactMessage(models.Model):
    name = models.CharField(max_length=128)
    email = models.EmailField()
    phone = models.CharField(max_length=32, blank=True)
    subject = models.CharField(max_length=64)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} - {self.subject}"


class StaffMember(models.Model):
    name = models.CharField(max_length=128)
    role = models.CharField(max_length=64)
    department = models.CharField(max_length=64)
    bio = models.TextField(blank=True)
    image_url = models.URLField(max_length=512, blank=True)
    email = models.EmailField(blank=True)

    def __str__(self):
        return f"{self.name} - {self.role}"


class LearningMaterial(models.Model):
    VISIBILITY_CHOICES = [
        ('class', 'Class material'),
        ('staff', 'Staff only'),
    ]

    title = models.CharField(max_length=255)
    subject_name = models.CharField(max_length=128)
    class_name = models.CharField(max_length=64, blank=True)
    file = models.FileField(upload_to="learning_materials/", blank=True, null=True)
    file_url = models.CharField(max_length=512, blank=True)
    file_type = models.CharField(max_length=32, default="PDF")
    uploaded_by = models.CharField(max_length=128, blank=True)
    uploaded_by_user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='learning_materials'
    )
    visibility = models.CharField(max_length=16, choices=VISIBILITY_CHOICES, default='class')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title


class LearningAssignment(models.Model):
    title = models.CharField(max_length=255)
    instructions = models.TextField(blank=True)
    school_class = models.ForeignKey(
        'school.SchoolClass', on_delete=models.CASCADE, related_name='learning_assignments'
    )
    subject = models.ForeignKey(
        'school.Subject', on_delete=models.CASCADE, related_name='learning_assignments'
    )
    teacher = models.ForeignKey(
        'school.Teacher', on_delete=models.CASCADE, related_name='learning_assignments'
    )
    due_at = models.DateTimeField(null=True, blank=True)
    attachment = models.FileField(upload_to='learning_assignments/', blank=True, null=True)
    is_published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['due_at', '-created_at']

    def __str__(self):
        return f'{self.title} - {self.school_class.name}'


class LearningSubmission(models.Model):
    assignment = models.ForeignKey(
        LearningAssignment, on_delete=models.CASCADE, related_name='submissions'
    )
    student = models.ForeignKey(
        'school.Student', on_delete=models.CASCADE, related_name='learning_submissions'
    )
    answer = models.TextField(blank=True)
    attachment = models.FileField(upload_to='learning_submissions/', blank=True, null=True)
    submitted_at = models.DateTimeField(auto_now=True)
    teacher_feedback = models.TextField(blank=True)
    score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-submitted_at']
        constraints = [
            models.UniqueConstraint(fields=['assignment', 'student'], name='one_learning_submission_per_student'),
        ]

    def __str__(self):
        return f'{self.student.name} - {self.assignment.title}'
