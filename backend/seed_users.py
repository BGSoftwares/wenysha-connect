#!/usr/bin/env python
"""Seed test users for different roles."""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from core.models import Role, UserProfile

# Define roles
ROLES = ['Admin', 'Teacher', 'Student', 'Parent', 'Accounts']

# Ensure roles exist
roles_dict = {}
for role_name in ROLES:
    role, _ = Role.objects.get_or_create(name=role_name, defaults={'description': f'{role_name} role'})
    roles_dict[role_name] = role
    print(f"[OK] Role '{role_name}' ready")

# Test users to create
test_users = [
    {
        'username': 'admin',
        'email': 'admin@wenysha.com',
        'password': 'adminpass',
        'role': 'Admin',
        'full_name': 'Administrator',
        'is_staff': True,
        'is_superuser': True,
    },
    {
        'username': 'teacher01',
        'email': 'teacher01@wenysha.com',
        'password': 'teacher123',
        'role': 'Teacher',
        'full_name': 'Mrs. Sarah Johnson',
        'is_staff': False,
        'is_superuser': False,
    },
    {
        'username': 'student01',
        'email': 'student01@wenysha.com',
        'password': 'student123',
        'role': 'Student',
        'full_name': 'John Smith',
        'is_staff': False,
        'is_superuser': False,
    },
    {
        'username': 'parent01',
        'email': 'parent01@wenysha.com',
        'password': 'parent123',
        'role': 'Parent',
        'full_name': 'Mr. Michael Smith',
        'is_staff': False,
        'is_superuser': False,
    },
    {
        'username': 'accounts01',
        'email': 'accounts01@wenysha.com',
        'password': 'accounts123',
        'role': 'Accounts',
        'full_name': 'Finance Officer',
        'is_staff': False,
        'is_superuser': False,
    },
]

# Create users
print("\n--- Creating Test Users ---")
for user_data in test_users:
    username = user_data['username']
    email = user_data['email']
    password = user_data['password']
    role_name = user_data['role']
    full_name = user_data['full_name']
    is_staff = user_data['is_staff']
    is_superuser = user_data['is_superuser']
    
    user, created = User.objects.get_or_create(
        username=username,
        defaults={
            'email': email,
            'is_staff': is_staff,
            'is_superuser': is_superuser
        }
    )
    
    if created:
        user.set_password(password)
        user.save()
        print(f"[OK] Created user: {username} ({email})")
    else:
        print(f"[INFO] User already exists: {username}")
        # Update password if needed
        if not user.check_password(password):
            user.set_password(password)
            user.save()
    
    # Create or update profile
    profile, created_profile = UserProfile.objects.get_or_create(
        user=user,
        defaults={
            'role': roles_dict[role_name],
            'full_name': full_name
        }
    )
    if not created_profile:  # Only update if was created
        profile.role = roles_dict[role_name]
        profile.full_name = full_name
        profile.save()

print("\n[OK] All test users created successfully!")
print("\n--- Available Test Accounts ---")
for user_data in test_users:
    print(f"Username: {user_data['username']}")
    print(f"Email:    {user_data['email']}")
    print(f"Password: {user_data['password']}")
    print(f"Role:     {user_data['role']}")
    print()

