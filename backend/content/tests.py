from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from content.models import LearningMaterial


@override_settings(MEDIA_ROOT='/tmp/ablegod-test-media')
class LearningMaterialUploadTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='teacher1', password='pass12345')
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
