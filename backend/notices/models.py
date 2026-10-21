from django.db import models
from django.conf import settings
from django.utils import timezone


class Notice(models.Model):
    RECIPIENT_CHOICES = [
        ('all_students', 'All students'),
        ('all_parents', 'All parents'),
        ('staff', 'School staff'),
        ('class', 'A class'),
        ('individual', 'An individual student'),
    ]
    STATUS_CHOICES = [
        ('pending', 'Pending approval'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    title = models.CharField(max_length=255)
    content = models.TextField()
    author = models.CharField(max_length=128)
    date = models.DateField(default=timezone.localdate)
    audience = models.CharField(max_length=64, blank=True)  # Human readable target label.
    priority = models.CharField(max_length=16, default='Medium')  # High, Medium, Low
    pinned = models.BooleanField(default=False)
    views = models.PositiveIntegerField(default=0)
    recipient_type = models.CharField(max_length=16, choices=RECIPIENT_CHOICES, default='all_students')
    recipient_class = models.ForeignKey(
        'school.SchoolClass', on_delete=models.CASCADE, null=True, blank=True, related_name='notices'
    )
    recipient_student = models.ForeignKey(
        'school.Student', on_delete=models.CASCADE, null=True, blank=True, related_name='notices'
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_notices'
    )
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default='approved')
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_notices'
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    review_note = models.CharField(max_length=500, blank=True)

    class Meta:
        ordering = ['-pinned', '-date']

    def __str__(self):
        return self.title
