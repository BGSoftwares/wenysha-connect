from datetime import date
from io import StringIO

from django.contrib.auth.models import User
from django.core.management import call_command
from django.test import TestCase
from rest_framework.test import APIClient

from exams.models import Exam, ExamMark, PublishedRanking
from exams.rankings import freeze_rankings
from school.models import SchoolClass, Student, Subject


class PublishedRankingTests(TestCase):
    def setUp(self):
        admin = User.objects.create_user(username='fixed_rank_admin', password='pwd-Strong-123', is_staff=True)
        self.client = APIClient()
        self.client.force_authenticate(admin)
        self.cls = SchoolClass.objects.create(name='Form 3 Blue')
        self.other = SchoolClass.objects.create(name='Form 3 Red')
        self.subject = Subject.objects.create(name='Fixed Maths')
        self.exam = Exam.objects.create(
            name='Fixed Exam', term='Term 1', year='2026', start_date=date(2026, 3, 1), end_date=date(2026, 3, 5),
            status='completed', results_published=True,
        )
        self.exam.classes.add(self.cls, self.other)
        self.exam.subjects.add(self.subject)
        self.a = Student.objects.create(name='Fixed A', school_class=self.cls)
        self.b = Student.objects.create(name='Fixed B', school_class=self.cls)
        self.c = Student.objects.create(name='Fixed C', school_class=self.other)
        self.unmarked = Student.objects.create(name='Fixed Unmarked', school_class=self.cls)
        for student, scored in ((self.a, 80), (self.b, 60), (self.c, 70)):
            ExamMark.objects.create(exam=self.exam, student=student, subject=self.subject, total_marks=100, scored=scored)

    def ranking(self, student):
        response = self.client.get('/api/exams/exam-rankings/', {'exam': self.exam.pk, 'student': student.pk})
        self.assertEqual(response.status_code, 200, getattr(response, 'data', None))
        return response.data

    def test_freezing_stores_class_and_year_group_positions(self):
        self.assertEqual(freeze_rankings(self.exam), 4)
        a = PublishedRanking.objects.get(exam=self.exam, student=self.a)
        b = PublishedRanking.objects.get(exam=self.exam, student=self.b)
        c = PublishedRanking.objects.get(exam=self.exam, student=self.c)
        self.assertEqual((a.class_position, a.class_total, a.level_position, a.level_total, a.level_name), (1, 3, 1, 4, 'Form 3'))
        self.assertEqual((b.class_position, b.level_position), (2, 3))
        self.assertEqual((c.class_position, c.class_total, c.level_position), (1, 1, 2))
        self.assertIsNone(PublishedRanking.objects.get(student=self.unmarked).class_position)

    def test_a_corrected_mark_does_not_move_published_positions(self):
        freeze_rankings(self.exam)
        self.assertEqual(self.ranking(self.b)['class_position'], 2)
        ExamMark.objects.filter(student=self.b).update(scored=99)  # a late correction
        again = self.ranking(self.b)
        self.assertEqual((again['class_position'], again['level_position']), (2, 3))
        self.assertEqual(self.ranking(self.a)['class_position'], 1)

    def test_without_a_stored_copy_the_live_ranking_is_still_used(self):
        self.assertEqual(self.ranking(self.a)['class_position'], 1)
        ExamMark.objects.filter(student=self.b).update(scored=99)
        from exams import ranking_cache
        ranking_cache.bump_version()
        self.assertEqual(self.ranking(self.a)['class_position'], 2)

    def test_freezing_again_replaces_the_earlier_copy(self):
        freeze_rankings(self.exam)
        ExamMark.objects.filter(student=self.b).update(scored=99)
        freeze_rankings(self.exam)
        self.assertEqual(PublishedRanking.objects.filter(exam=self.exam).count(), 4)
        self.assertEqual(self.ranking(self.b)['class_position'], 1)

    def test_command_fixes_positions_only_for_published_exams_without_a_copy(self):
        out = StringIO()
        call_command('freeze_published_rankings', '--dry-run', stdout=out)
        self.assertIn('Would fix positions', out.getvalue())
        self.assertEqual(PublishedRanking.objects.count(), 0)
        call_command('freeze_published_rankings', stdout=out)
        self.assertEqual(PublishedRanking.objects.filter(exam=self.exam).count(), 4)
        out = StringIO()
        call_command('freeze_published_rankings', stdout=out)
        self.assertIn('already has fixed positions', out.getvalue())
