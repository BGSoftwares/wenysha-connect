from datetime import date

from django.test import TestCase
from rest_framework.test import APIClient
from django.contrib.auth.models import User

from exams.models import Exam, ExamMark
from school.models import SchoolClass, Student, Subject


class RankingCacheTests(TestCase):
    def setUp(self):
        self.admin = User.objects.create_user(username='rank_cache_admin', password='pwd-Strong-123', is_staff=True)
        self.client = APIClient()
        self.client.force_authenticate(self.admin)
        self.cls = SchoolClass.objects.create(name='Cache Form 1')
        self.subject = Subject.objects.create(name='Cache Maths')
        self.exam = Exam.objects.create(
            name='Cache Exam', term='Term 1', year='2026', start_date=date(2026, 3, 1), end_date=date(2026, 3, 5),
            status='completed', results_published=True,
        )
        self.exam.classes.add(self.cls)
        self.exam.subjects.add(self.subject)
        self.a = Student.objects.create(name='Cache A', school_class=self.cls)
        self.b = Student.objects.create(name='Cache B', school_class=self.cls)
        ExamMark.objects.create(exam=self.exam, student=self.a, subject=self.subject, total_marks=100, scored=80)
        ExamMark.objects.create(exam=self.exam, student=self.b, subject=self.subject, total_marks=100, scored=60)

    def position(self, student):
        response = self.client.get('/api/exams/exam-rankings/', {'exam': self.exam.pk, 'student': student.pk})
        self.assertEqual(response.status_code, 200, getattr(response, 'data', None))
        return response.data['class_position']

    def test_ranking_follows_a_changed_mark_instead_of_serving_stale_data(self):
        self.assertEqual((self.position(self.a), self.position(self.b)), (1, 2))
        ExamMark.objects.filter(student=self.b).first().delete()
        ExamMark.objects.create(exam=self.exam, student=self.b, subject=self.subject, total_marks=100, scored=95)
        self.assertEqual((self.position(self.a), self.position(self.b)), (2, 1))

    def test_a_repeat_request_is_served_from_the_cache(self):
        from unittest import mock
        from exams import ranking_cache
        from exams.models import ExamMark

        self.position(self.a)
        with mock.patch.object(ranking_cache, 'cached_ranking', wraps=ranking_cache.cached_ranking) as spy:
            with mock.patch.object(ExamMark.objects, 'filter', side_effect=AssertionError('marks were re-read')):
                self.assertEqual(self.position(self.a), 1)
        self.assertTrue(spy.called)
