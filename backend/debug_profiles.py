#!/usr/bin/env python
"""Debug student profile linking."""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from school.models import Student

print("--- Checking Student Profiles ---\n")

# Check student01 user
try:
    student_user = User.objects.get(username='student01')
    print(f"✓ User found: {student_user.username} (ID: {student_user.id})")
    
    # Check if student record exists for this user
    try:
        student = Student.objects.get(user=student_user)
        print(f"✓ Student record found: {student.name} (user_id: {student.user_id})")
        print(f"  Student ID: {student.student_id}")
        print(f"  Class: {student.school_class.name}")
    except Student.DoesNotExist:
        print(f"✗ No Student record linked to user {student_user.username}")
        print(f"  Will create or update the link...")
        
        # Try to find student by name
        students = Student.objects.filter(name='John Smith')
        if students.exists():
            student = students.first()
            print(f"✓ Found student by name: {student.name}")
            print(f"  Current user link: {student.user}")
            # Link it
            student.user = student_user
            student.save()
            print(f"✓ Updated student user link to: {student_user.username}")
        else:
            print(f"✗ No student found with name 'John Smith'")
            
except User.DoesNotExist:
    print(f"✗ User student01 not found")

print("\n--- All Students ---")
all_students = Student.objects.all()
for s in all_students:
    print(f"  {s.student_id}: {s.name} -> user={s.user}")
