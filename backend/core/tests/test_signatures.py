import shutil
import tempfile
from pathlib import Path

from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from core.models import Role, UserProfile, UserSignature

# The smallest valid PNG: enough for the signature to pass the real-file check.
PNG = (
    b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89'
    b'\x00\x00\x00\rIDATx\x9cc\xf8\xcf\xc0\x00\x00\x03\x01\x01\x00\x18\xdd\x8d\xb0\x00\x00\x00\x00IEND\xaeB`\x82'
)
MEDIA = tempfile.mkdtemp(prefix='signature-tests-')


def make_user(username, role_name):
    user = User.objects.create_user(username, password='signature-pass-123')
    role, _ = Role.objects.get_or_create(name=role_name)
    UserProfile.objects.create(user=user, role=role, full_name=username.title())
    return user


@override_settings(MEDIA_ROOT=MEDIA)
class SignatureUploadTests(TestCase):
    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        shutil.rmtree(MEDIA, ignore_errors=True)

    def setUp(self):
        self.teacher = make_user('sig-teacher', 'Teacher')
        self.client = APIClient()
        self.client.force_authenticate(self.teacher)

    def upload(self, name='signature.png', content=PNG):
        return self.client.post('/api/auth/signature/', {'image': SimpleUploadedFile(name, content, content_type='image/png')}, format='multipart')

    def test_teacher_can_upload_replace_and_remove_a_signature(self):
        self.assertIsNone(self.client.get('/api/auth/signature/').data['url'])
        first = self.upload()
        self.assertEqual(first.status_code, 200, first.data)
        self.assertTrue(first.data['url'].startswith('/media/signatures/'))
        first_file = UserSignature.objects.get(user=self.teacher).image.path
        self.assertTrue(Path(first_file).exists())

        second = self.upload('second.png')
        self.assertEqual(second.status_code, 200, second.data)
        self.assertEqual(UserSignature.objects.filter(user=self.teacher).count(), 1)
        self.assertFalse(Path(first_file).exists(), 'the replaced file should be removed')

        removed = self.client.delete('/api/auth/signature/')
        self.assertEqual(removed.status_code, 204)
        self.assertFalse(UserSignature.objects.filter(user=self.teacher).exists())

    def test_text_renamed_to_png_is_refused(self):
        response = self.upload('trick.png', b'<script>alert(1)</script>')
        self.assertEqual(response.status_code, 400)
        self.assertFalse(UserSignature.objects.exists())

    def test_oversized_image_is_refused(self):
        response = self.upload('big.png', PNG + b'0' * (1024 * 1024))
        self.assertEqual(response.status_code, 400)

    def test_students_and_parents_have_no_signature(self):
        for role in ('Student', 'Parent'):
            client = APIClient()
            client.force_authenticate(make_user(f'sig-{role.lower()}', role))
            self.assertEqual(client.get('/api/auth/signature/').status_code, 403)
            response = client.post('/api/auth/signature/', {'image': SimpleUploadedFile('s.png', PNG, content_type='image/png')}, format='multipart')
            self.assertEqual(response.status_code, 403)

    def test_anonymous_users_are_turned_away(self):
        self.assertIn(APIClient().get('/api/auth/signature/').status_code, (401, 403))
