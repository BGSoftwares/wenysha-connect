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
    full_name = models.CharField(max_length=255, blank=True)

    def __str__(self):
        return f"{self.user.email} ({self.role.name if self.role else 'no role'})"


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
    email = models.EmailField(unique=False)
    password_hash = models.CharField(max_length=128)  # store hashed until approved
    role = models.CharField(max_length=32, choices=ROLE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    requested_at = models.DateTimeField(auto_now_add=True)
    additional_info = models.JSONField(default=dict, blank=True)  # class, department, studentName

    class Meta:
        ordering = ['-requested_at']

    def __str__(self):
        return f"{self.full_name} ({self.role}) - {self.status}"
