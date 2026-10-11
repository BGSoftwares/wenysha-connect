from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework.test import APIClient

from school.models import SchoolClass, Teacher


class ClassTeacherAssignmentApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.client.force_authenticate(user=User.objects.create_user(username='class_teacher_admin'))
        self.teacher = Teacher.objects.create(name='Class Teacher', department='Science')
        self.school_class = SchoolClass.objects.create(name='Form 2A')

    def test_admin_can_assign_and_unassign_a_class_teacher(self):
        url = f'/api/school/classes/{self.school_class.id}/'

        assigned = self.client.patch(
            url,
            {'class_teacher': self.teacher.id},
            format='json',
        )

        self.assertEqual(assigned.status_code, 200)
        self.assertEqual(assigned.data['class_teacher'], self.teacher.id)
        self.assertEqual(assigned.data['class_teacher_name'], self.teacher.name)

        unassigned = self.client.patch(
            url,
            {'class_teacher': None},
            format='json',
        )

        self.assertEqual(unassigned.status_code, 200)
        self.assertIsNone(unassigned.data['class_teacher'])
