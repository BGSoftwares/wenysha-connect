from django.db import models
from django.conf import settings
from school.models import Student


class Parent(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True, related_name='parent_profile'
    )
    name = models.CharField(max_length=255)
    phone = models.CharField(max_length=32, blank=True)
    email = models.EmailField(blank=True)
    address = models.TextField(blank=True)
    status = models.CharField(max_length=20, default='Active')  # Active, Inactive

    def __str__(self):
        return self.name


class StudentParent(models.Model):
    """M:M student ↔ parent."""
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='parents_link')
    parent = models.ForeignKey(Parent, on_delete=models.CASCADE, related_name='students_link')

    class Meta:
        unique_together = [['student', 'parent']]

    def __str__(self):
        return f"{self.student.name} - {self.parent.name}"
