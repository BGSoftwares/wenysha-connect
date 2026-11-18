import json
from datetime import date

from django.contrib.auth.models import User
from rest_framework.test import APIClient, APITestCase

from core.models import Role, UserProfile
from exams.models import Exam, ExamMark, ReportCardReview
from parents.models import Parent, StudentParent
from school.models import SchoolClass, Student, Subject


def make_user(username, role_name):
    user = User.objects.create_user(username=username, password='pwd-Strong-123')
    role, _ = Role.objects.get_or_create(name=role_name)
    UserProfile.objects.create(user=user, role=role)
    return user


def rows(response):
    data = response.data
    return data['results'] if isinstance(data, dict) and 'results' in data else data


class ParentReportAccessTests(APITestCase):
    def setUp(self):
        self.cls_a = SchoolClass.objects.create(name='Form 1A')
        self.cls_b = SchoolClass.objects.create(name='Form 2B')
        self.maths = Subject.objects.create(name='Mathematics')
        self.child = Student.objects.create(name='Linked Child', school_class=self.cls_a)
        self.other_child = Student.objects.create(name='Someone Else', school_class=self.cls_b)

        self.parent_user = make_user('report_parent', 'Parent')
        parent = Parent.objects.create(user=self.parent_user, name='Report Parent')
        StudentParent.objects.create(student=self.child, parent=parent)
        self.stranger = make_user('stranger_parent', 'Parent')
        Parent.objects.create(user=self.stranger, name='Stranger')

        self.published = self.make_exam('Published exam', published=True, status='completed')
        self.draft = self.make_exam('Draft exam', published=False, status='completed')
        self.ongoing = self.make_exam('Ongoing exam', published=True, status='ongoing')
        for exam in (self.published, self.draft, self.ongoing):
            for student in (self.child, self.other_child):
                ExamMark.objects.create(exam=exam, student=student, subject=self.maths, total_marks=100, scored=60)
        ReportCardReview.objects.create(exam=self.published, student=self.child, class_teacher_comment='Well done', principal_comment='Keep going')
        ReportCardReview.objects.create(exam=self.published, student=self.other_child, class_teacher_comment='Other', principal_comment='Other')
        self.client = APIClient()
        self.client.force_authenticate(self.parent_user)

    def make_exam(self, name, published, status):
        exam = Exam.objects.create(
            name=name, term='Term 1', year='2026', start_date=date(2026, 1, 1), end_date=date(2026, 3, 1),
            results_published=published, status=status,
        )
        exam.classes.add(self.cls_a, self.cls_b)
        exam.subjects.add(self.maths)
        return exam

    def test_parent_sees_only_published_completed_exams_for_their_child(self):
        names = [exam['name'] for exam in rows(self.client.get('/api/exams/exams/'))]
        self.assertEqual(names, ['Published exam'])

    def test_parent_sees_only_their_childs_published_marks(self):
        marks = rows(self.client.get('/api/exams/exam-marks/'))
        self.assertEqual({(mark['student'], mark['exam']) for mark in marks}, {(self.child.pk, self.published.pk)})
        other = rows(self.client.get('/api/exams/exam-marks/', {'student': self.other_child.pk}))
        self.assertEqual(other, [])

    def test_parent_sees_their_childs_comments_but_not_other_childrens(self):
        reviews = rows(self.client.get('/api/exams/report-card-reviews/'))
        self.assertEqual([review['student'] for review in reviews], [self.child.pk])
        self.assertEqual(reviews[0]['principal_comment'], 'Keep going')

    def test_parent_can_see_their_childs_ranking_only(self):
        mine = self.client.get('/api/exams/exam-rankings/', {'exam': self.published.pk, 'student': self.child.pk})
        self.assertEqual(mine.status_code, 200)
        self.assertEqual(mine.data['class_position'], 1)
        theirs = self.client.get('/api/exams/exam-rankings/', {'exam': self.published.pk, 'student': self.other_child.pk})
        self.assertEqual(theirs.status_code, 403)

    def test_parent_cannot_see_ranking_of_unpublished_or_unfinished_exams(self):
        for exam in (self.draft, self.ongoing):
            response = self.client.get('/api/exams/exam-rankings/', {'exam': exam.pk, 'student': self.child.pk})
            self.assertEqual(response.status_code, 403, exam.name)

    def test_a_parent_with_no_linked_child_sees_nothing(self):
        self.client.force_authenticate(self.stranger)
        self.assertEqual(rows(self.client.get('/api/exams/exams/')), [])
        self.assertEqual(rows(self.client.get('/api/exams/exam-marks/')), [])
        self.assertEqual(rows(self.client.get('/api/exams/report-card-reviews/')), [])
        response = self.client.get('/api/exams/exam-rankings/', {'exam': self.published.pk, 'student': self.child.pk})
        self.assertEqual(response.status_code, 403)

    def test_parent_cannot_change_marks_comments_or_exams(self):
        mark = ExamMark.objects.get(exam=self.published, student=self.child)
        body = {'exam': self.published.pk, 'student': self.child.pk, 'subject': self.maths.pk, 'total_marks': 100, 'scored': 99}
        self.assertIn(self.client.post('/api/exams/exam-marks/', body, format='json').status_code, (400, 403))
        self.assertIn(self.client.patch(f'/api/exams/exam-marks/{mark.pk}/', {'scored': 99}, format='json').status_code, (400, 403, 404))
        self.assertEqual(ExamMark.objects.filter(exam=self.published, student=self.child).count(), 1)
        review = ReportCardReview.objects.get(exam=self.published, student=self.child)
        self.assertEqual(self.client.patch(f'/api/exams/report-card-reviews/{review.pk}/', {'principal_comment': 'x'}, format='json').status_code, 403)
        response = self.client.post('/api/exams/report-card-reviews/save-principal-comment/', {
            'exam': self.published.pk, 'student': self.child.pk, 'principal_comment': 'x',
        }, format='json')
        self.assertEqual(response.status_code, 403)
        self.assertEqual(self.client.patch(f'/api/exams/exams/{self.published.pk}/', {'results_published': False}, format='json').status_code, 403)
        mark.refresh_from_db()
        self.assertEqual(mark.scored, 60)


class AbsentAndDecimalMarkTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser('marks_admin', 'marks@example.test', 'pass12345')
        self.client.force_authenticate(self.admin)
        self.cls = SchoolClass.objects.create(name='Form 4A')
        self.maths = Subject.objects.create(name='Mathematics')
        self.english = Subject.objects.create(name='English')
        self.exam = Exam.objects.create(name='Mid year', term='Term 2', year='2026', start_date=date(2026, 5, 1), end_date=date(2026, 5, 20), status='completed')
        self.exam.classes.add(self.cls)
        self.exam.subjects.add(self.maths, self.english)
        self.alice = Student.objects.create(name='Alice', school_class=self.cls)
        self.brian = Student.objects.create(name='Brian', school_class=self.cls)

    def payload(self, student, subject, **extra):
        body = {'exam': self.exam.pk, 'student': student.pk, 'subject': subject.pk, 'total_marks': 100}
        body.update(extra)
        return body

    def post_mark(self, student, subject, **extra):
        return self.client.post('/api/exams/exam-marks/', self.payload(student, subject, **extra), format='json')

    def test_decimal_score_is_saved_and_returned_as_a_number(self):
        response = self.post_mark(self.alice, self.maths, scored=67.5)
        self.assertEqual(response.status_code, 201, response.content)
        self.assertEqual(json.loads(response.content)['scored'], 67.5)
        listed = json.loads(self.client.get('/api/exams/exam-marks/', {'exam': self.exam.pk}).content)
        listed = listed['results'] if isinstance(listed, dict) else listed
        self.assertIsInstance(listed[0]['scored'], float)

    def test_more_than_two_decimal_places_is_refused(self):
        self.assertEqual(self.post_mark(self.alice, self.maths, scored='67.555').status_code, 400)

    def test_a_decimal_score_still_cannot_exceed_the_total(self):
        self.assertEqual(self.post_mark(self.alice, self.maths, scored='100.5').status_code, 400)

    def test_absent_mark_is_stored_as_zero_whatever_score_is_sent(self):
        response = self.post_mark(self.alice, self.maths, absent=True, scored=55)
        self.assertEqual(response.status_code, 201, response.content)
        mark = ExamMark.objects.get()
        self.assertEqual((mark.absent, mark.scored), (True, 0))

    def test_entering_a_score_clears_an_earlier_absence_but_a_comment_edit_keeps_it(self):
        mark = ExamMark.objects.create(exam=self.exam, student=self.alice, subject=self.maths, total_marks=100, absent=True)
        self.client.patch(f'/api/exams/exam-marks/{mark.pk}/', {'comment': 'Sick'}, format='json')
        mark.refresh_from_db()
        self.assertTrue(mark.absent)
        self.client.patch(f'/api/exams/exam-marks/{mark.pk}/', {'scored': 72}, format='json')
        mark.refresh_from_db()
        self.assertEqual((mark.absent, mark.scored), (False, 72))

    def sheet(self, marks):
        return self.client.post('/api/exams/mark-sheets/', {
            'exam': self.exam.pk, 'school_class': self.cls.pk, 'subject': self.maths.pk, 'marks': marks,
        }, format='json')

    def test_mark_sheet_accepts_absent_rows_and_decimals(self):
        response = self.sheet([
            {'student': self.alice.pk, 'total_marks': 50, 'scored': 37.5},
            {'student': self.brian.pk, 'total_marks': 50, 'absent': True},
        ])
        self.assertEqual(response.status_code, 200, response.content)
        alice = ExamMark.objects.get(student=self.alice)
        brian = ExamMark.objects.get(student=self.brian)
        self.assertEqual(float(alice.scored), 37.5)
        self.assertEqual((brian.absent, brian.scored), (True, 0))

    def test_mark_sheet_row_needs_a_score_or_absent(self):
        response = self.sheet([{'student': self.alice.pk, 'total_marks': 50}])
        self.assertEqual(response.status_code, 400)
        self.assertEqual(ExamMark.objects.count(), 0)

    def test_resaving_a_sheet_turns_an_absence_into_a_score(self):
        self.sheet([{'student': self.alice.pk, 'total_marks': 100, 'absent': True}])
        self.sheet([{'student': self.alice.pk, 'total_marks': 100, 'scored': 64}])
        mark = ExamMark.objects.get(student=self.alice)
        self.assertEqual((mark.absent, mark.scored), (False, 64))

    def ranking(self, student):
        return self.client.get('/api/exams/exam-rankings/', {'exam': self.exam.pk, 'student': student.pk}).data

    def test_an_absent_subject_does_not_drag_down_the_ranking(self):
        # Alice: 80 in Maths, absent for English. Brian: 70 and 70. Counting the absence as 0 would put Alice on 40.
        ExamMark.objects.create(exam=self.exam, student=self.alice, subject=self.maths, total_marks=100, scored=80)
        ExamMark.objects.create(exam=self.exam, student=self.alice, subject=self.english, total_marks=100, absent=True)
        ExamMark.objects.create(exam=self.exam, student=self.brian, subject=self.maths, total_marks=100, scored=70)
        ExamMark.objects.create(exam=self.exam, student=self.brian, subject=self.english, total_marks=100, scored=70)
        self.assertEqual(self.ranking(self.alice)['class_position'], 1)
        self.assertEqual(self.ranking(self.brian)['class_position'], 2)

    def test_a_learner_absent_for_everything_has_no_position(self):
        ExamMark.objects.create(exam=self.exam, student=self.alice, subject=self.maths, total_marks=100, absent=True)
        ExamMark.objects.create(exam=self.exam, student=self.brian, subject=self.maths, total_marks=100, scored=50)
        self.assertIsNone(self.ranking(self.alice)['class_position'])
        self.assertEqual(self.ranking(self.brian)['class_position'], 1)
        self.assertEqual(self.ranking(self.brian)['class_total'], 2)

    def test_decimal_scores_rank_correctly(self):
        ExamMark.objects.create(exam=self.exam, student=self.alice, subject=self.maths, total_marks=100, scored='60.5')
        ExamMark.objects.create(exam=self.exam, student=self.brian, subject=self.maths, total_marks=100, scored='60.25')
        self.assertEqual(self.ranking(self.alice)['class_position'], 1)
        self.assertEqual(self.ranking(self.brian)['class_position'], 2)

    def test_publishing_accepts_absent_marks_as_entered(self):
        for student in (self.alice, self.brian):
            ExamMark.objects.create(exam=self.exam, student=student, subject=self.maths, total_marks=100, scored=55)
        ExamMark.objects.create(exam=self.exam, student=self.alice, subject=self.english, total_marks=100, absent=True)
        ExamMark.objects.create(exam=self.exam, student=self.brian, subject=self.english, total_marks=100, scored=61)
        response = self.client.patch(f'/api/exams/exams/{self.exam.pk}/', {'results_published': True}, format='json')
        self.assertEqual(response.status_code, 200, response.content)
