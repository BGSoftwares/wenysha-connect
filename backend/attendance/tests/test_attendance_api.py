from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from school.models import SchoolClass, Student
from datetime import date

class AttendanceAPITests(TestCase):
    def setUp(self):
        cls = SchoolClass.objects.create(name='API Attend Class')
        self.student = Student.objects.create(student_id='AAPI01', name='Attend API Student', school_class=cls)
        self.user = User.objects.create_user(username='att_user', password='pwd')
        self.client = APIClient()

    def test_attendance_crud_and_permission(self):
        payload = {'student': self.student.id, 'date': date.today().isoformat(), 'status': 'present'}
        # unauthenticated blocked
        r = self.client.post('/api/attendance/attendance/', payload, format='json')
        self.assertEqual(r.status_code, 401)

        self.client.force_authenticate(user=self.user)
        create = self.client.post('/api/attendance/attendance/', payload, format='json')
        self.assertEqual(create.status_code, 201)
        aid = create.data['id']
        # duplicate same day should return 400
        dup = self.client.post('/api/attendance/attendance/', payload, format='json')
        self.assertEqual(dup.status_code, 400)
        # read
        get_r = self.client.get(f'/api/attendance/attendance/{aid}/')
        self.assertEqual(get_r.status_code, 200)
        # update
        patch = self.client.patch(f'/api/attendance/attendance/{aid}/', {'status': 'absent'}, format='json')
        self.assertEqual(patch.status_code, 200)
        # delete
        del_r = self.client.delete(f'/api/attendance/attendance/{aid}/')
        self.assertIn(del_r.status_code, (204, 200))
