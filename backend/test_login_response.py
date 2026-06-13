#!/usr/bin/env python
"""Test the login endpoint response."""
import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from core.views import get_tokens_for_user

print("--- Testing Login Response ---\n")

# Get student01 user
student_user = User.objects.get(username='student01')
print(f"User: {student_user.username} (ID: {student_user.id})")

# Get the tokens response
tokens_response = get_tokens_for_user(student_user)

# Add role info
try:
    profile = student_user.profile
    tokens_response['user']['role'] = profile.role.name if profile.role else None
    tokens_response['user']['full_name'] = profile.full_name or student_user.username
except:
    tokens_response['user']['role'] = None
    tokens_response['user']['full_name'] = student_user.username

print(f"\nLogin response that would be sent:")
print(json.dumps({
    'access': tokens_response['access'][:20] + '...',
    'refresh': tokens_response['refresh'][:20] + '...',
    'user': tokens_response['user']
}, indent=2))

print(f"\nUser data that would be stored:")
print(json.dumps(tokens_response['user'], indent=2))

# Simulate what frontend does
stored_user = tokens_response['user']
print(f"\nWhen frontend does useStudentProfile():")
print(f"  Stored user ID: {stored_user['id']}")
print(f"  Looking for student with user={stored_user['id']}")

# Check if any student matches
from school.models import Student
student = Student.objects.filter(user_id=stored_user['id']).first()
if student:
    print(f"  ✓ Found student: {student.name}")
else:
    print(f"  ✗ No student found with user_id={stored_user['id']}")
