from django.core.cache import cache
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import SimpleTestCase, TestCase, override_settings
from rest_framework import serializers
from rest_framework.test import APIClient

from core.upload_validation import (
    ATTACHMENT_EXTENSIONS, IMAGE_EXTENSIONS, VIDEO_EXTENSIONS, validate_upload,
)

PNG = b'\x89PNG\r\n\x1a\n' + b'\x00' * 32
PDF = b'%PDF-1.7\n' + b'x' * 32
HTML = b'<html><script>alert(1)</script></html>'
SVG = b'<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'


def upload(name, data):
    return SimpleUploadedFile(name, data)


class UploadValidationTests(SimpleTestCase):
    def test_genuine_files_pass_and_stream_is_rewound(self):
        f = upload('photo.PNG', PNG)
        self.assertIs(validate_upload(f, IMAGE_EXTENSIONS), f)
        self.assertEqual(f.read(), PNG)
        validate_upload(upload('a.pdf', PDF), ATTACHMENT_EXTENSIONS)

    def test_html_disguised_as_image_is_rejected(self):
        with self.assertRaises(serializers.ValidationError):
            validate_upload(upload('photo.png', HTML), IMAGE_EXTENSIONS)

    def test_svg_and_html_extensions_are_never_allowed(self):
        for name, data in (('x.svg', SVG), ('x.html', HTML), ('x.js', b'alert(1)'), ('x.exe', b'MZ')):
            with self.assertRaises(serializers.ValidationError, msg=name):
                validate_upload(upload(name, data), IMAGE_EXTENSIONS | VIDEO_EXTENSIONS | ATTACHMENT_EXTENSIONS)

    def test_double_extension_uses_last_suffix(self):
        with self.assertRaises(serializers.ValidationError):
            validate_upload(upload('invoice.pdf.html', HTML), ATTACHMENT_EXTENSIONS)

    def test_pdf_label_with_png_content_is_rejected(self):
        with self.assertRaises(serializers.ValidationError):
            validate_upload(upload('a.pdf', PNG), {'.pdf'})

    def test_none_is_passed_through(self):
        self.assertIsNone(validate_upload(None, IMAGE_EXTENSIONS))


@override_settings(CACHES={'default': {'BACKEND': 'django.core.cache.backends.locmem.LocMemCache'}})
class SignupThrottleTests(TestCase):
    def setUp(self):
        cache.clear()

    def test_signup_is_rate_limited_per_ip(self):
        from core.throttling import SignupRateThrottle
        with mock_rates({'signup': '2/hour'}):
            client = APIClient()
            codes = [client.post('/api/auth/signup/', {}, format='json').status_code for _ in range(3)]
        self.assertNotEqual(codes[0], 429)
        self.assertNotEqual(codes[1], 429)
        self.assertEqual(codes[2], 429)


class mock_rates:
    """Temporarily override DRF throttle rates (the class caches them at import)."""
    def __init__(self, rates):
        self.rates = rates

    def __enter__(self):
        from core.throttling import SignupRateThrottle
        self.old = SignupRateThrottle.THROTTLE_RATES
        SignupRateThrottle.THROTTLE_RATES = {**self.old, **self.rates}

    def __exit__(self, *exc):
        from core.throttling import SignupRateThrottle
        SignupRateThrottle.THROTTLE_RATES = self.old
