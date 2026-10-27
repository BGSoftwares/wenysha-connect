from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
import tempfile

from django.test import TestCase, override_settings
from rest_framework.test import APIClient
from core.models import Role, UserProfile
from school.models import SchoolClass, Teacher

from content.models import LearningMaterial


class LearningMaterialUploadTests(TestCase):
    def setUp(self):
        self.media_directory = tempfile.TemporaryDirectory(prefix='ablegod-test-media-')
        self.addCleanup(self.media_directory.cleanup)
        media_override = override_settings(MEDIA_ROOT=self.media_directory.name)
        media_override.enable()
        self.addCleanup(media_override.disable)
        self.client = APIClient()
        self.user = User.objects.create_user(username='teacher1', password='pass12345')
        accounts, _ = Role.objects.get_or_create(name='Accounts')
        UserProfile.objects.create(user=self.user, role=accounts)
        self.client.force_authenticate(user=self.user)

    def test_create_requires_a_local_file(self):
        response = self.client.post('/api/content/materials/', {
            'title': 'Algebra notes',
            'subject_name': 'Mathematics',
            'class_name': 'Form 2A',
        }, format='multipart')
        self.assertEqual(response.status_code, 400)

    def test_upload_local_file_and_download_url(self):
        payload = {
            'title': 'Algebra notes',
            'subject_name': 'Mathematics',
            'class_name': 'Form 2A',
            'uploaded_by': 'Mrs Moyo',
            'file': SimpleUploadedFile('algebra-notes.pdf', b'%PDF-1.4 notes', content_type='application/pdf'),
        }
        created = self.client.post('/api/content/materials/', payload, format='multipart')
        self.assertEqual(created.status_code, 201, created.data)
        self.assertEqual(created.data['file_type'], 'PDF')
        self.assertTrue(created.data['file_url'])
        self.assertIn('algebra-notes', created.data['file_name'])
        self.assertEqual(LearningMaterial.objects.count(), 1)

    def test_class_teacher_can_upload_notes_for_their_class(self):
        teacher_role = Role.objects.get(name='Class Teacher')
        teacher_user = User.objects.create_user(username='class-teacher', password='teacher-pass-123')
        UserProfile.objects.create(user=teacher_user, role=teacher_role, full_name='Class Teacher')
        teacher = Teacher.objects.create(user=teacher_user, name='Class Teacher')
        SchoolClass.objects.create(name='Form 2A', class_teacher=teacher)
        self.client.force_authenticate(user=teacher_user)

        response = self.client.post('/api/content/materials/', {
            'title': 'Form 2A algebra notes',
            'subject_name': 'Mathematics',
            'class_name': 'Form 2A',
            'file': SimpleUploadedFile('form-2a-algebra.pdf', b'%PDF-1.4 notes', content_type='application/pdf'),
        }, format='multipart')

        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(response.data['uploaded_by_user'], teacher_user.pk)
        self.assertEqual(LearningMaterial.objects.get(pk=response.data['id']).visibility, 'class')
        visible = self.client.get('/api/content/materials/')
        self.assertEqual(visible.status_code, 200)
        self.assertEqual(len(visible.data['results']), 1)

    def test_admin_portal_role_can_upload_and_list_materials(self):
        admin_role, _ = Role.objects.get_or_create(name='Admin')
        admin_user = User.objects.create_user(username='portal-admin', password='admin-pass-123')
        UserProfile.objects.create(user=admin_user, role=admin_role, full_name='Portal Admin')
        self.client.force_authenticate(user=admin_user)

        response = self.client.post('/api/content/materials/', {
            'title': 'School-wide revision notes',
            'subject_name': 'General',
            'class_name': 'All Classes',
            'visibility': 'staff',
            'file': SimpleUploadedFile('revision-notes.pdf', b'%PDF-1.4 notes', content_type='application/pdf'),
        }, format='multipart')

        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(response.data['uploaded_by_user'], admin_user.pk)
        visible = self.client.get('/api/content/materials/')
        self.assertEqual(visible.status_code, 200)
        self.assertEqual(len(visible.data['results']), 1)
