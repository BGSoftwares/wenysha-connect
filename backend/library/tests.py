import tempfile
from pathlib import Path

from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from rest_framework.test import APITestCase

from library.models import Book


class DigitalLibraryBookTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_superuser('library-admin', 'library@example.test', 'pass12345')
        self.client.force_authenticate(self.user)
        self.media_directory = tempfile.TemporaryDirectory()
        self.media_override = override_settings(MEDIA_ROOT=self.media_directory.name)
        self.media_override.enable()
        self.addCleanup(self.media_override.disable)
        self.addCleanup(self.media_directory.cleanup)

    def test_staff_can_upload_and_authenticated_users_can_view_book_file_url(self):
        uploaded_file = SimpleUploadedFile('algebra.pdf', b'%PDF-1.4 book content', content_type='application/pdf')
        response = self.client.post('/api/library/books/', {
            'title': 'Algebra',
            'author': 'School Library',
            'copies': 2,
            'digital_file': uploaded_file,
        }, format='multipart')

        self.assertEqual(response.status_code, 201, response.data)
        self.assertTrue(response.data['digital_file_url'].endswith('.pdf'))
        self.assertTrue(Path(Book.objects.get(pk=response.data['id']).digital_file.path).is_file())

        self.client.force_authenticate(user=User.objects.create_user('reader', password='pass12345'))
        catalog_response = self.client.get('/api/library/books/')
        self.assertEqual(catalog_response.status_code, 200, catalog_response.data)
        self.assertEqual(catalog_response.data['results'][0]['digital_file_url'], response.data['digital_file_url'])

    def test_upload_rejects_unsupported_file_types(self):
        uploaded_file = SimpleUploadedFile('program.exe', b'not a book')
        response = self.client.post('/api/library/books/', {
            'title': 'Unsupported',
            'author': 'School Library',
            'digital_file': uploaded_file,
        }, format='multipart')

        self.assertEqual(response.status_code, 400, response.data)
        self.assertFalse(Book.objects.exists())
