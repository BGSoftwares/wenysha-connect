from datetime import date
from django.contrib.auth.models import User
from rest_framework.test import APITestCase
from school.models import SchoolClass, Subject, Student, Teacher
from exams.models import Exam, ExamMark, MarkSubmission


class MarkSheetTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_superuser('admin1', 'a@x.com', 'pass12345')
        self.client.force_authenticate(self.user)
        self.teacher = Teacher.objects.create(name='Mr Moyo')
        self.cls = SchoolClass.objects.create(name='Form 2A')
        self.subject = Subject.objects.create(name='Maths')
        self.student = Student.objects.create(student_id='S1', name='Tariro', school_class=self.cls)
        self.exam = Exam.objects.create(name='Term 1', term='1', year='2026', start_date=date.today(), end_date=date.today())

    def test_mark_saves_with_comment(self):
        r = self.client.post('/api/exams/exam-marks/', {'exam': self.exam.id, 'student': self.student.id, 'subject': self.subject.id, 'total_marks': 100, 'scored': 72, 'comment': 'Good effort'}, format='json')
        self.assertEqual(r.status_code, 201, r.content)
        self.assertEqual(ExamMark.objects.get().comment, 'Good effort')

    def test_teacher_can_submit_mark_sheet(self):
        r = self.client.post('/api/exams/mark-submissions/', {'exam': self.exam.id, 'subject': self.subject.id, 'school_class': self.cls.id, 'teacher_name': 'Mr Moyo'}, format='json')
        self.assertEqual(r.status_code, 201, r.content)
        self.assertEqual(MarkSubmission.objects.count(), 1)

    def test_admin_assigns_class_teacher(self):
        r = self.client.patch(f'/api/school/classes/{self.cls.id}/', {'class_teacher': self.teacher.id}, format='json')
        self.assertEqual(r.status_code, 200, r.content)
        self.cls.refresh_from_db()
        self.assertEqual(self.cls.class_teacher_id, self.teacher.id)

    def test_admin_allocates_subject_to_teacher(self):
        r = self.client.post('/api/school/allocations/', {'teacher': self.teacher.id, 'subject': self.subject.id, 'school_class': self.cls.id, 'periods': 5}, format='json')
        self.assertEqual(r.status_code, 201, r.content)
        r = self.client.get(f'/api/school/allocations/?teacher={self.teacher.id}')
        self.assertEqual(r.status_code, 200)
