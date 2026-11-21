from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from core.roles import portal_role
from school.models import Project, ProjectItem


class ProjectApiTests(APITestCase):
    def setUp(self):
        User = get_user_model()
        self.admin = User.objects.create_superuser('boss', 'boss@example.com', 'pass12345!')
        self.other = User.objects.create_user('someone', 'x@example.com', 'pass12345!')

    def test_admin_creates_project_and_items_and_sees_totals(self):
        self.assertEqual(portal_role(self.admin), 'admin')
        self.client.force_authenticate(self.admin)
        created = self.client.post('/api/school/projects/', {'name': 'Science fair', 'status': 'active', 'budget': '300.00', 'currency': 'USD'}, format='json')
        self.assertEqual(created.status_code, 201, created.content)
        pid = created.json()['id']
        self.client.post('/api/school/project-items/', {'project': pid, 'kind': 'activity', 'title': 'Judging day', 'cost': '0'}, format='json')
        self.client.post('/api/school/project-items/', {'project': pid, 'kind': 'resource', 'title': 'Display boards', 'cost': '45.50'}, format='json')
        item = ProjectItem.objects.get(title='Judging day')
        self.client.patch(f'/api/school/project-items/{item.id}/', {'done': True}, format='json')
        data = self.client.get(f'/api/school/projects/{pid}/').json()
        self.assertEqual(data['spent'], '45.50')
        self.assertEqual(data['progress'], {'done': 1, 'total': 1})

    def test_end_before_start_is_rejected(self):
        self.client.force_authenticate(self.admin)
        response = self.client.post('/api/school/projects/', {'name': 'X', 'start_date': '2026-05-02', 'end_date': '2026-05-01'}, format='json')
        self.assertEqual(response.status_code, 400)

    def test_non_admins_are_refused(self):
        Project.objects.create(name='Secret')
        self.client.force_authenticate(self.other)
        self.assertEqual(self.client.get('/api/school/projects/').status_code, 403)
        self.client.force_authenticate(None)
        self.assertIn(self.client.get('/api/school/projects/').status_code, (401, 403))
