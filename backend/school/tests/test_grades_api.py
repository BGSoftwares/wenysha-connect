from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from school.models import SchoolClass, Subject, AcademicYear, Term, Assessment, Student
from core.models import Role, UserProfile
from school.models import Teacher
from datetime import date

class GradesAPITests(TestCase):
    def setUp(self):
        role = Role.objects.get(name='Class Teacher')
        self.user = User.objects.create_user(username='grade_user', password='pwd')
        UserProfile.objects.create(user=self.user, role=role, full_name='Grade Teacher')
        teacher = Teacher.objects.create(user=self.user, name='Grade Teacher')
        self.cls = SchoolClass.objects.create(name='API Grade Class', class_teacher=teacher)
        self.subj = Subject.objects.create(name='Biology', code='BIO')
        self.year = AcademicYear.objects.create(name='2026', start_date=date(2026,1,1), end_date=date(2026,12,31))
        self.term = Term.objects.create(name='Term 1', academic_year=self.year, start_date=date(2026,1,1), end_date=date(2026,4,30))
        self.assessment = Assessment.objects.create(name='Quiz 1', assessment_type='Quiz', subject=self.subj, school_class=self.cls, term=self.term, total_marks=100)
        self.student = Student.objects.create(student_id='GAPI01', name='Grade API Student', school_class=self.cls)
        self.client = APIClient()

    def test_grade_crud_and_unique_constraint_via_api(self):
        # unauthenticated cannot create
        payload = {'student': self.student.id, 'assessment': self.assessment.id, 'score': '88.5', 'remarks': 'Good'}
        resp = self.client.post('/api/school/grades/', payload, format='json')
        self.assertEqual(resp.status_code, 401)

        # create as authenticated
        self.client.force_authenticate(user=self.user)
        r1 = self.client.post('/api/school/grades/', payload, format='json')
        self.assertEqual(r1.status_code, 201)
        self.assertEqual(r1.data['assessment_total_marks'], '100.00')
        self.assertEqual(r1.data['assessment_term_name'], self.term.name)
        self.assertEqual(r1.data['academic_year_name'], self.year.name)
        gid = r1.data['id']
        # duplicate should return 400
        r2 = self.client.post('/api/school/grades/', payload, format='json')
        self.assertEqual(r2.status_code, 400)
        # read, update, delete
        get_r = self.client.get(f'/api/school/grades/{gid}/')
        self.assertEqual(get_r.status_code, 200)
        patch = self.client.patch(f'/api/school/grades/{gid}/', {'score': '90.0'}, format='json')
        self.assertEqual(patch.status_code, 200)
        del_r = self.client.delete(f'/api/school/grades/{gid}/')
        self.assertIn(del_r.status_code, (204, 200))

    def test_grade_scores_must_be_within_assessment_total(self):
        self.client.force_authenticate(user=self.user)
        invalid_scores = ('-0.01', '100.01')
        for index, score in enumerate(invalid_scores, start=1):
            with self.subTest(score=score):
                student = Student.objects.create(
                    student_id=f'BOUND{index}', name=f'Bound Student {index}', school_class=self.cls
                )
                response = self.client.post('/api/school/grades/', {
                    'student': student.id,
                    'assessment': self.assessment.id,
                    'score': score,
                }, format='json')
                self.assertEqual(response.status_code, 400, response.data)

        admin = User.objects.create_superuser(
            username='assessment-admin', email='assessment-admin@example.test', password='admin-pass-123'
        )
        self.client.force_authenticate(user=admin)
        zero_total = self.client.post('/api/school/assessments/', {
            'name': 'Invalid zero-total assessment',
            'assessment_type': 'Quiz',
            'subject': self.subj.id,
            'school_class': self.cls.id,
            'term': self.term.id,
            'total_marks': '0',
        }, format='json')
        self.assertEqual(zero_total.status_code, 400, zero_total.data)
