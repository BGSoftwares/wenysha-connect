#!/usr/bin/env python
"""Create comprehensive profiles for test users."""
import os
import django
from datetime import datetime, date, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from core.models import UserProfile, Role
from school.models import SchoolClass, Teacher, Student, Subject
from parents.models import Parent, StudentParent
from finance.models import FeeStructure

print("--- Creating Test Profiles ---\n")

# ===== ADMIN PROFILE =====
print("1️⃣ Creating Admin Profile...")
admin_user = User.objects.get(username='admin')
admin_profile, created = UserProfile.objects.get_or_create(
    user=admin_user,
    defaults={
        'role': Role.objects.get(name='Admin'),
        'full_name': 'Dr. Margaret Chinyanga'
    }
)
if not created:
    admin_profile.full_name = 'Dr. Margaret Chinyanga'
    admin_profile.save()
print(f"✓ Admin profile created: {admin_profile.full_name}\n")

# ===== TEACHER PROFILE =====
print("2️⃣ Creating Teacher Profile...")
teacher_user = User.objects.get(username='teacher01')
teacher_profile, created = UserProfile.objects.get_or_create(
    user=teacher_user,
    defaults={
        'role': Role.objects.get(name='Teacher'),
        'full_name': 'Mrs. Sarah Johnson'
    }
)
if not created:
    teacher_profile.full_name = 'Mrs. Sarah Johnson'
    teacher_profile.save()

# Create Teacher profile record
teacher, created = Teacher.objects.get_or_create(
    user=teacher_user,
    defaults={
        'name': 'Mrs. Sarah Johnson',
        'department': 'Mathematics',
        'phone': '+263 773 123 456'
    }
)
if not created:
    teacher.department = 'Mathematics'
    teacher.phone = '+263 773 123 456'
    teacher.save()
print(f"✓ Teacher profile created: {teacher.name}")
print(f"  Department: {teacher.department}")
print(f"  Phone: {teacher.phone}\n")

# ===== SCHOOL CLASS =====
print("3️⃣ Creating School Class...")
school_class, created = SchoolClass.objects.get_or_create(
    name='Form 4A',
    defaults={
        'capacity': 45,
        'enrolled': 0,
        'class_teacher': teacher
    }
)
if not created:
    school_class.class_teacher = teacher
    school_class.save()
print(f"✓ School class created: {school_class.name}")
print(f"  Capacity: {school_class.capacity}")
print(f"  Class Teacher: {school_class.class_teacher.name}\n")

# ===== STUDENT PROFILE =====
print("4️⃣ Creating Student Profile...")
student_user = User.objects.get(username='student01')
student_profile, created = UserProfile.objects.get_or_create(
    user=student_user,
    defaults={
        'role': Role.objects.get(name='Student'),
        'full_name': 'John Smith'
    }
)
if not created:
    student_profile.full_name = 'John Smith'
    student_profile.save()

# Create Student record
student, created = Student.objects.get_or_create(
    user=student_user,
    defaults={
        'student_id': 'STU001',
        'name': 'John Smith',
        'school_class': school_class,
        'gender': 'Male',
        'status': 'Active',
        'date_of_birth': date(2008, 3, 15),
        'address': '123 Main Street, Harare'
    }
)
if not created:
    student.name = 'John Smith'
    student.school_class = school_class
    student.gender = 'Male'
    student.status = 'Active'
    student.date_of_birth = date(2008, 3, 15)
    student.address = '123 Main Street, Harare'
    student.save()
print(f"✓ Student profile created: {student.name}")
print(f"  Student ID: {student.student_id}")
print(f"  Class: {student.school_class.name}")
print(f"  Gender: {student.gender}")
print(f"  Date of Birth: {student.date_of_birth}")
print(f"  Status: {student.status}\n")

# ===== PARENT PROFILE =====
print("5️⃣ Creating Parent Profile...")
parent_user = User.objects.get(username='parent01')
parent_profile, created = UserProfile.objects.get_or_create(
    user=parent_user,
    defaults={
        'role': Role.objects.get(name='Parent'),
        'full_name': 'Mr. Michael Smith'
    }
)
if not created:
    parent_profile.full_name = 'Mr. Michael Smith'
    parent_profile.save()

# Create Parent record
parent, created = Parent.objects.get_or_create(
    user=parent_user,
    defaults={
        'name': 'Mr. Michael Smith',
        'phone': '+263 773 456 789',
        'email': 'michael.smith@email.com',
        'address': '123 Main Street, Harare',
        'status': 'Active'
    }
)
if not created:
    parent.name = 'Mr. Michael Smith'
    parent.phone = '+263 773 456 789'
    parent.email = 'michael.smith@email.com'
    parent.address = '123 Main Street, Harare'
    parent.status = 'Active'
    parent.save()
print(f"✓ Parent profile created: {parent.name}")
print(f"  Phone: {parent.phone}")
print(f"  Email: {parent.email}")
print(f"  Address: {parent.address}\n")

# ===== LINK PARENT TO STUDENT =====
print("6️⃣ Linking Parent to Student...")
student_parent, created = StudentParent.objects.get_or_create(
    student=student,
    parent=parent
)
if created:
    print(f"✓ Parent {parent.name} linked to Student {student.name}\n")
else:
    print(f"→ Link already exists between {parent.name} and {student.name}\n")

# ===== ACCOUNTS OFFICER PROFILE =====
print("7️⃣ Creating Accounts Officer Profile...")
accounts_user = User.objects.get(username='accounts01')
accounts_profile, created = UserProfile.objects.get_or_create(
    user=accounts_user,
    defaults={
        'role': Role.objects.get(name='Accounts'),
        'full_name': 'Finance Officer'
    }
)
if not created:
    accounts_profile.full_name = 'Mr. Tinashe Mwandiwa'
    accounts_profile.save()
print(f"✓ Accounts Officer profile created: {accounts_profile.full_name}\n")

# ===== CREATE SAMPLE SUBJECT & FEE STRUCTURE =====
print("8️⃣ Creating Sample Subjects...")
subjects_list = ['Mathematics', 'English', 'Sciences', 'History', 'Geography']
for subject_name in subjects_list:
    subject, created = Subject.objects.get_or_create(
        name=subject_name,
        defaults={
            'code': subject_name[:3].upper(),
            'department': 'Academics'
        }
    )
    if created:
        print(f"✓ Subject created: {subject.name}")

print("\n9️⃣ Creating Fee Structures...")
fee_structures = [
    {'name': 'Form 4 Tuition Term 1', 'amount': 25000, 'term': 'Term 1', 'form': 'Form 4'},
    {'name': 'Form 4 Tuition Term 2', 'amount': 25000, 'term': 'Term 2', 'form': 'Form 4'},
    {'name': 'Form 4 Tuition Term 3', 'amount': 25000, 'term': 'Term 3', 'form': 'Form 4'},
]
for fee_data in fee_structures:
    fee, created = FeeStructure.objects.get_or_create(
        name=fee_data['name'],
        defaults={
            'amount': fee_data['amount'],
            'term': fee_data['term'],
            'form': fee_data['form'],
            'active': True
        }
    )
    if created:
        print(f"✓ Fee structure created: {fee.name} - ZWL {fee.amount}")

print("\n" + "="*60)
print("✅ All profiles created successfully!")
print("="*60)
print("\n--- Profile Summary ---")
print(f"Admin:    {admin_profile.full_name} (admin@wenysha.com)")
print(f"Teacher:  {teacher_profile.full_name} ({teacher.department})")
print(f"Student:  {student_profile.full_name} ({student.student_id})")
print(f"Parent:   {parent_profile.full_name}")
print(f"Accounts: {accounts_profile.full_name}")
