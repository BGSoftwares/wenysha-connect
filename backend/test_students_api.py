#!/usr/bin/env python
"""Test the students API endpoint."""
import os
import django
import json
from django.test import Client

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken

print("--- Testing /api/school/students/ Endpoint ---\n")

# Get student01 user and create token
student_user = User.objects.get(username='student01')
token = str(RefreshToken.for_user(student_user).access_token)

print(f"User: {student_user.username} (ID: {student_user.id})")
print(f"Token: {token[:50]}...")

# Create a test client
client = Client()

# Make request with token
response = client.get(
    '/api/school/students/',
    HTTP_AUTHORIZATION=f'Bearer {token}'
)

print(f"\nResponse status: {response.status_code}")
print(f"Response content type: {response.get('Content-Type', 'N/A')}")

data = response.json()
print(f"Response data:")
print(json.dumps(data, indent=2, default=str))

# Check if user ID is in responses
print(f"\nStudents returned:")
if isinstance(data, list):
    for s in data:
        print(f"  - {s.get('name', 'N/A')} (user={s.get('user', 'MISSING')})")
