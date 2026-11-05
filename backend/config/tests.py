from pathlib import Path
from tempfile import TemporaryDirectory

from django.test import SimpleTestCase, override_settings


class FrontendFallbackTests(SimpleTestCase):
    def setUp(self):
        self.frontend_dir = TemporaryDirectory()
        self.frontend_path = Path(self.frontend_dir.name)
        (self.frontend_path / 'index.html').write_text('<main>frontend</main>', encoding='utf-8')
        (self.frontend_path / 'able-god-college-logo.png').write_bytes(b'logo')

    def tearDown(self):
        self.frontend_dir.cleanup()

    def test_root_serves_built_frontend(self):
        with override_settings(FRONTEND_BUILD_DIR=self.frontend_path):
            response = self.client.get('/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['Content-Type'], 'text/html')
        self.assertEqual(b''.join(response.streaming_content), b'<main>frontend</main>')
        response.close()

    def test_client_side_route_serves_frontend_entrypoint(self):
        with override_settings(FRONTEND_BUILD_DIR=self.frontend_path):
            response = self.client.get('/student/reports')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(b''.join(response.streaming_content), b'<main>frontend</main>')
        response.close()

    def test_existing_frontend_file_is_served(self):
        with override_settings(FRONTEND_BUILD_DIR=self.frontend_path):
            response = self.client.get('/able-god-college-logo.png')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(b''.join(response.streaming_content), b'logo')
        response.close()

    def test_missing_asset_returns_not_found_instead_of_spa_html(self):
        with override_settings(FRONTEND_BUILD_DIR=self.frontend_path):
            response = self.client.get('/assets/missing.js')

        self.assertEqual(response.status_code, 404)
