#!/usr/bin/env python
"""Test the student API response."""
import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from school.models import Student
from school.serializers import StudentSerializer

print("--- Testing Student API Response ---\n")

# Get student01 user
student_user = User.objects.get(username='student01')
print(f"User: {student_user.username} (ID: {student_user.id})")

# Get the student record
student = Student.objects.get(user=student_user)
print(f"Student: {student.name} (ID: {student.id})")

# Serialize it
serializer = StudentSerializer(student)
data = serializer.data

print(f"\nSerialized student data:")
print(json.dumps(data, indent=2, default=str))

# Check if user field is included
if 'user' in data:
    print(f"\n✓ 'user' field is present: {data['user']}")
else:
    print(f"\n✗ 'user' field is MISSING!")

# Test list endpoint
print("\n--- Testing List Endpoint ---")
students = Student.objects.all()
serializer = StudentSerializer(students, many=True)
print(f"Number of students: {len(serializer.data)}")
for s in serializer.data[:3]:
    print(f"  {s.get('name', 'N/A')} -> user={s.get('user', 'MISSING')}")
