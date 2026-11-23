from django.db import models
from django.conf import settings
from django.contrib.auth.models import AbstractUser, BaseUserManager


class Role(models.Model):
    name = models.CharField(max_length=64, unique=True)  # Admin, Teacher, Student, Parent, Accounts
    description = models.TextField(blank=True)
    permissions = models.JSONField(default=list, blank=True)  # list of permission codes

    def __str__(self):
        return self.name


class UserProfile(models.Model):
    """Links Django User to Role and optional profile (Student/Teacher/Parent)."""
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='profile')
    role = models.ForeignKey(Role, on_delete=models.PROTECT, null=True, blank=True)
    full_name = models.CharField(max_length=255, blank=True, db_index=True)
    preferences = models.JSONField(default=dict, blank=True)

    def __str__(self):
        return f"{self.user.email} ({self.role.name if self.role else 'no role'})"


def signature_upload_path(instance, filename):
    """Random file name, so a signature's address cannot be guessed from the person's name or id."""
    import uuid
    from pathlib import Path
    return f'signatures/{uuid.uuid4().hex}{Path(filename).suffix.lower()}'


class UserSignature(models.Model):
    """A teacher's or the principal's signature image, printed on the report cards they approve."""
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='signature')
    image = models.FileField(upload_to=signature_upload_path)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'Signature of {self.user}'


class PendingApproval(models.Model):
    """Sign-up requests awaiting admin approval."""
    ROLE_CHOICES = [
        ('student', 'Student'),
        ('teacher', 'Teacher'),
        ('parent', 'Parent'),
        ('accounts', 'Accounts'),
    ]
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    full_name = models.CharField(max_length=255)
    email = models.EmailField(unique=False, db_index=True)
    password_hash = models.CharField(max_length=128)  # store hashed until approved
    role = models.CharField(max_length=32, choices=ROLE_CHOICES, db_index=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', db_index=True)
    requested_at = models.DateTimeField(auto_now_add=True, db_index=True)
    additional_info = models.JSONField(default=dict, blank=True)  # class, department, studentName

    class Meta:
        ordering = ['-requested_at']
        indexes = [
            models.Index(fields=['status', 'requested_at'], name='idx_pending_stat_req'),
        ]

    def __str__(self):
        return f"{self.full_name} ({self.role}) - {self.status}"
