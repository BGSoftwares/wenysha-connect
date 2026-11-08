from datetime import date
from django.contrib.auth.models import User
from rest_framework.test import APITestCase
from school.models import SchoolClass, Subject, Student, Teacher, TeacherSubjectClass
from core.models import Role, UserProfile
from exams.models import Exam, ExamMark, MarkSubmission, ReportCardReview


class MarkSheetTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_superuser('admin1', 'a@x.com', 'pass12345')
        self.client.force_authenticate(self.user)
        self.teacher = Teacher.objects.create(name='Mr Moyo')
        self.cls = SchoolClass.objects.create(name='Form 2A')
        self.subject = Subject.objects.create(name='Maths')
        self.student = Student.objects.create(student_id='S1', name='Tariro', school_class=self.cls)
        self.exam = Exam.objects.create(name='Term 1', term='1', year='2026', start_date=date.today(), end_date=date.today())
        self.exam.classes.add(self.cls)
        self.exam.subjects.add(self.subject)

    def test_mark_saves_with_comment(self):
        r = self.client.post('/api/exams/exam-marks/', {'exam': self.exam.id, 'student': self.student.id, 'subject': self.subject.id, 'total_marks': 100, 'scored': 72, 'comment': 'Good effort'}, format='json')
        self.assertEqual(r.status_code, 201, r.content)
        self.assertEqual(ExamMark.objects.get().comment, 'Good effort')

    def test_mark_sheet_bulk_save_updates_existing_marks(self):
        for scored, comment in ((72, 'Initial comment'), (81, 'Updated comment')):
            response = self.client.post('/api/exams/mark-sheets/', {
                'exam': self.exam.pk,
                'school_class': self.cls.pk,
                'subject': self.subject.pk,
                'marks': [{
                    'student': self.student.pk,
                    'total_marks': 100,
                    'scored': scored,
                    'comment': comment,
                }],
            }, format='json')
            self.assertEqual(response.status_code, 200, response.data)

        self.assertEqual(ExamMark.objects.count(), 1)
        mark = ExamMark.objects.get()
        self.assertEqual(mark.scored, 81)
        self.assertEqual(mark.comment, 'Updated comment')

    def test_publish_rejects_missing_active_learner_marks_even_without_reviews(self):
        self.exam.status = 'completed'
        self.exam.save(update_fields=['status'])
        other_student = Student.objects.create(
            student_id='S2',
            name='Second Learner',
            school_class=self.cls,
        )
        ExamMark.objects.create(
            exam=self.exam,
            student=self.student,
            subject=self.subject,
            total_marks=100,
            scored=72,
        )
        response = self.client.patch(
            f'/api/exams/exams/{self.exam.pk}/',
            {'results_published': True},
            format='json',
        )

        self.assertEqual(response.status_code, 400, response.data)
        self.assertIn('Complete marks for every active learner', str(response.data['results_published']))
        self.assertFalse(Exam.objects.get(pk=self.exam.pk).results_published)

        ExamMark.objects.create(
            exam=self.exam,
            student=other_student,
            subject=self.subject,
            total_marks=100,
            scored=68,
        )
        publish_response = self.client.patch(
            f'/api/exams/exams/{self.exam.pk}/',
            {'results_published': True},
            format='json',
        )
        self.assertEqual(publish_response.status_code, 200, publish_response.data)

    def test_zero_mark_is_valid_and_marks_cannot_exceed_the_total(self):
        zero_mark = self.client.post('/api/exams/exam-marks/', {
            'exam': self.exam.id,
            'student': self.student.id,
            'subject': self.subject.id,
            'total_marks': 100,
            'scored': 0,
        }, format='json')
        self.assertEqual(zero_mark.status_code, 201, zero_mark.data)

        other_student = Student.objects.create(
            student_id='S2', name='Second Learner', school_class=self.cls
        )
        over_total = self.client.post('/api/exams/exam-marks/', {
            'exam': self.exam.id,
            'student': other_student.id,
            'subject': self.subject.id,
            'total_marks': 100,
            'scored': 101,
        }, format='json')
        self.assertEqual(over_total.status_code, 400, over_total.data)

        third_student = Student.objects.create(
            student_id='S3', name='Third Learner', school_class=self.cls
        )
        zero_total = self.client.post('/api/exams/exam-marks/', {
            'exam': self.exam.id,
            'student': third_student.id,
            'subject': self.subject.id,
            'total_marks': 0,
            'scored': 0,
        }, format='json')
        self.assertEqual(zero_total.status_code, 400, zero_total.data)

    def test_teacher_can_submit_mark_sheet(self):
        r = self.client.post('/api/exams/mark-submissions/', {'exam': self.exam.id, 'subject': self.subject.id, 'school_class': self.cls.id, 'teacher_name': 'Mr Moyo'}, format='json')
        self.assertEqual(r.status_code, 201, r.content)
        self.assertEqual(MarkSubmission.objects.count(), 1)

    def test_admin_can_filter_marks_to_submitted_class(self):
        other_class = SchoolClass.objects.create(name='Form 2B')
        other_student = Student.objects.create(student_id='S2', name='Other Learner', school_class=other_class)
        ExamMark.objects.create(exam=self.exam, student=self.student, subject=self.subject, total_marks=100, scored=72)
        ExamMark.objects.create(exam=self.exam, student=other_student, subject=self.subject, total_marks=100, scored=85)

        response = self.client.get('/api/exams/exam-marks/', {
            'exam': self.exam.pk,
            'subject': self.subject.pk,
            'school_class': self.cls.pk,
        })

        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual([mark['student'] for mark in response.data['results']], [self.student.pk])

    def test_invalid_mark_class_filter_is_reported(self):
        response = self.client.get('/api/exams/exam-marks/', {'school_class': 'not-a-class'})
        self.assertEqual(response.status_code, 400, response.data)

    def test_admin_assigns_class_teacher(self):
        r = self.client.patch(f'/api/school/classes/{self.cls.id}/', {'class_teacher': self.teacher.id}, format='json')
        self.assertEqual(r.status_code, 200, r.content)
        self.cls.refresh_from_db()
        self.assertEqual(self.cls.class_teacher_id, self.teacher.id)

    def test_admin_allocates_subject_to_teacher(self):
        r = self.client.post('/api/school/allocations/', {'teacher': self.teacher.id, 'subject': self.subject.id, 'school_class': self.cls.id, 'periods': 5, 'room': '101'}, format='json')
        self.assertEqual(r.status_code, 201, r.content)
        r = self.client.get(f'/api/school/allocations/?teacher={self.teacher.id}')
        self.assertEqual(r.status_code, 200)


class ReportTypeIsolationTests(APITestCase):
    def setUp(self):
        teacher_role, _ = Role.objects.get_or_create(name='Teacher')
        self.teacher_user = User.objects.create_user('report-teacher', password='teacher-pass-123')
        UserProfile.objects.create(user=self.teacher_user, role=teacher_role, full_name='Report Teacher')
        self.teacher = Teacher.objects.create(user=self.teacher_user, name='Report Teacher', department='Sciences')
        self.school_class = SchoolClass.objects.create(name='Form 4 Sciences')
        self.subject = Subject.objects.create(name='Mathematics', department='Sciences')
        TeacherSubjectClass.objects.create(
            teacher=self.teacher, subject=self.subject, school_class=self.school_class,
        )
        self.student = Student.objects.create(name='Tendai Moyo', school_class=self.school_class)
        self.other_student = Student.objects.create(name='Tendai Ncube', school_class=self.school_class)
        self.report_types = [
            'monthly_report_card',
            'fortnightly_tests',
            'end_of_1st_term',
            'end_of_2nd_term',
            'end_of_3rd_term',
        ]
        self.exams = []
        for index, report_type in enumerate(self.report_types, start=1):
            exam = Exam.objects.create(
                name=f'Report {index}', report_type=report_type, term=str(index), year='2026',
                start_date=date.today(), end_date=date.today(), status='ongoing',
            )
            exam.classes.add(self.school_class)
            exam.subjects.add(self.subject)
            self.exams.append(exam)

    def test_teacher_saves_each_report_type_separately_and_student_sees_only_own_published_marks(self):
        self.client.force_authenticate(user=self.teacher_user)
        for index, exam in enumerate(self.exams, start=1):
            response = self.client.post('/api/exams/mark-sheets/', {
                'exam': exam.pk, 'school_class': self.school_class.pk, 'subject': self.subject.pk,
                'marks': [{
                    'student': self.student.pk, 'total_marks': 100,
                    'scored': 50 + index, 'comment': f'Report {index}',
                }],
            }, format='json')
            self.assertEqual(response.status_code, 200, response.data)

        self.assertEqual(ExamMark.objects.filter(student=self.student).count(), 5)
        for index, exam in enumerate(self.exams, start=1):
            self.assertEqual(ExamMark.objects.get(exam=exam, student=self.student).scored, 50 + index)
            self.assertEqual(ExamMark.objects.get(exam=exam, student=self.student).comment, f'Report {index}')

        invalid_sheet = self.client.post('/api/exams/mark-sheets/', {
            'exam': self.exams[0].pk,
            'school_class': self.school_class.pk,
            'subject': self.subject.pk,
            'marks': [
                {'student': self.student.pk, 'total_marks': 100, 'scored': 10},
                {'student': self.other_student.pk, 'total_marks': 10, 'scored': 11},
            ],
        }, format='json')
        self.assertEqual(invalid_sheet.status_code, 400, invalid_sheet.data)
        self.assertEqual(ExamMark.objects.get(exam=self.exams[0], student=self.student).scored, 51)

        teacher_exams = self.client.get('/api/exams/exams/')
        self.assertEqual(teacher_exams.status_code, 200, teacher_exams.data)
        self.assertEqual(len(teacher_exams.data['results']), 5)

        # The teacher cannot write marks for an unallocated subject, even in an assigned class.
        other_subject = Subject.objects.create(name='History', department='Arts')
        unallocated_exam = Exam.objects.create(
            name='Unallocated subject report', report_type='monthly_report_card', term='6', year='2026',
            start_date=date.today(), end_date=date.today(), status='ongoing',
        )
        unallocated_exam.classes.add(self.school_class)
        unallocated_exam.subjects.add(other_subject)
        denied = self.client.post('/api/exams/exam-marks/', {
            'exam': unallocated_exam.pk, 'student': self.student.pk, 'subject': other_subject.pk,
            'total_marks': 100, 'scored': 80,
        }, format='json')
        self.assertEqual(denied.status_code, 400, denied.data)
        denied_sheet = self.client.post('/api/exams/mark-sheets/', {
            'exam': unallocated_exam.pk,
            'school_class': self.school_class.pk,
            'subject': other_subject.pk,
            'marks': [{'student': self.student.pk, 'total_marks': 100, 'scored': 80}],
        }, format='json')
        self.assertEqual(denied_sheet.status_code, 400, denied_sheet.data)

        for exam in self.exams:
            exam.status = 'completed'
            exam.results_published = True
            exam.save(update_fields=['status', 'results_published'])
        ExamMark.objects.create(
            exam=self.exams[0], student=self.other_student, subject=self.subject,
            total_marks=100, scored=100,
        )

        self.client.force_authenticate(user=self.student.user)
        marks_response = self.client.get('/api/exams/exam-marks/')
        self.assertEqual(marks_response.status_code, 200, marks_response.data)
        marks = marks_response.data['results']
        self.assertEqual(len(marks), 5)
        self.assertTrue(all(mark['student'] == self.student.pk for mark in marks))
        exams_response = self.client.get('/api/exams/exams/')
        self.assertEqual(exams_response.status_code, 200, exams_response.data)
        self.assertEqual(len(exams_response.data['results']), 5)
        for report_type in self.report_types:
            selected_report = self.client.get('/api/exams/exams/', {'report_type': report_type})
            self.assertEqual(selected_report.status_code, 200, selected_report.data)
            self.assertEqual(len(selected_report.data['results']), 1)
            self.assertEqual(selected_report.data['results'][0]['report_type'], report_type)

        unpublished_exam = Exam.objects.create(
            name='Unpublished', report_type='monthly_report_card', term='6', year='2026',
            start_date=date.today(), end_date=date.today(), status='ongoing', results_published=False,
        )
        unpublished_exam.classes.add(self.school_class)
        unpublished_exam.subjects.add(self.subject)
        ExamMark.objects.create(
            exam=unpublished_exam, student=self.student, subject=self.subject,
            total_marks=100, scored=99,
        )
        ExamMark.objects.create(
            exam=unpublished_exam, student=self.other_student, subject=self.subject,
            total_marks=100, scored=85,
        )
        # When exam report card is locked (results_published=False), student cannot see it
        marks_response = self.client.get('/api/exams/exam-marks/')
        self.assertEqual(len(marks_response.data['results']), 5)

        # When admin unlocks and publishes report cards, student sees their own marks
        self.client.force_authenticate(user=self.teacher_user)
        publish_response = self.client.patch(
            f'/api/exams/exams/{unpublished_exam.pk}/',
            {'results_published': True},
            format='json',
        )
        self.assertEqual(publish_response.status_code, 403)

        admin = User.objects.create_superuser('report-admin', 'admin@example.test', 'admin-pass-123')
        self.client.force_authenticate(user=admin)
        publish_response = self.client.patch(
            f'/api/exams/exams/{unpublished_exam.pk}/',
            {'results_published': True},
            format='json',
        )
        self.assertEqual(publish_response.status_code, 400)
        unpublished_exam.status = 'completed'
        unpublished_exam.save(update_fields=['status'])
        publish_response = self.client.patch(
            f'/api/exams/exams/{unpublished_exam.pk}/',
            {'results_published': True},
            format='json',
        )
        self.assertEqual(publish_response.status_code, 200, publish_response.data)
        published_at = unpublished_exam.__class__.objects.get(pk=unpublished_exam.pk).results_published_at
        self.assertIsNotNone(published_at)
        self.client.patch(
            f'/api/exams/exams/{unpublished_exam.pk}/',
            {'results_published': False},
            format='json',
        )
        republish_response = self.client.patch(
            f'/api/exams/exams/{unpublished_exam.pk}/',
            {'results_published': True},
            format='json',
        )
        self.assertEqual(republish_response.status_code, 200, republish_response.data)
        self.assertEqual(
            unpublished_exam.__class__.objects.get(pk=unpublished_exam.pk).results_published_at,
            published_at,
        )
        self.client.force_authenticate(user=self.student.user)
        unlocked_response = self.client.get('/api/exams/exam-marks/')
        self.assertEqual(len(unlocked_response.data['results']), 6)
        self.assertTrue(all(mark['student'] == self.student.pk for mark in unlocked_response.data['results']))

    def test_published_student_report_includes_all_subjects_and_updated_position(self):
        exam = self.exams[0]
        science = Subject.objects.create(name='Science', department='Sciences')
        exam.subjects.add(science)
        TeacherSubjectClass.objects.create(
            teacher=self.teacher,
            subject=science,
            school_class=self.school_class,
        )

        self.client.force_authenticate(user=self.teacher_user)
        first_subject_response = self.client.post('/api/exams/mark-sheets/', {
            'exam': exam.pk,
            'school_class': self.school_class.pk,
            'subject': self.subject.pk,
            'marks': [
                {'student': self.student.pk, 'total_marks': 100, 'scored': 60, 'comment': 'Math comment'},
                {'student': self.other_student.pk, 'total_marks': 100, 'scored': 90, 'comment': 'Peer math'},
            ],
        }, format='json')
        self.assertEqual(first_subject_response.status_code, 200, first_subject_response.data)

        admin = User.objects.create_superuser('report-admin2', 'admin2@example.test', 'admin-pass-123')
        self.client.force_authenticate(user=admin)
        initial_ranking = self.client.get('/api/exams/exam-rankings/', {
            'exam': exam.pk, 'student': self.student.pk,
        })
        self.assertEqual(initial_ranking.data['class_position'], 2)

        self.client.force_authenticate(user=self.teacher_user)
        second_subject_response = self.client.post('/api/exams/mark-sheets/', {
            'exam': exam.pk,
            'school_class': self.school_class.pk,
            'subject': science.pk,
            'marks': [
                {'student': self.student.pk, 'total_marks': 100, 'scored': 100, 'comment': 'Science comment'},
                {'student': self.other_student.pk, 'total_marks': 100, 'scored': 10, 'comment': 'Peer science'},
            ],
        }, format='json')
        self.assertEqual(second_subject_response.status_code, 200, second_subject_response.data)

        self.client.force_authenticate(user=admin)
        updated_ranking = self.client.get('/api/exams/exam-rankings/', {
            'exam': exam.pk, 'student': self.student.pk,
        })
        self.assertEqual(updated_ranking.data['class_position'], 1)

        unlock_response = self.client.patch(
            f'/api/exams/exams/{exam.pk}/',
            {'status': 'completed', 'results_published': True},
            format='json',
        )
        self.assertEqual(unlock_response.status_code, 200, unlock_response.data)

        self.client.force_authenticate(user=self.student.user)
        report_marks = self.client.get('/api/exams/exam-marks/', {'exam': exam.pk})
        self.assertEqual(report_marks.status_code, 200, report_marks.data)
        self.assertEqual(len(report_marks.data['results']), 2)
        self.assertEqual({mark['subject'] for mark in report_marks.data['results']}, {self.subject.pk, science.pk})
        self.assertEqual(
            {mark['comment'] for mark in report_marks.data['results']},
            {'Math comment', 'Science comment'},
        )
        student_ranking = self.client.get('/api/exams/exam-rankings/', {
            'exam': exam.pk, 'student': self.student.pk,
        })
        self.assertEqual(student_ranking.status_code, 200, student_ranking.data)
        self.assertEqual(student_ranking.data['class_position'], 1)

    def test_end_of_term_exam_name_is_canonical(self):
        exam = Exam.objects.create(
            name='Custom title',
            report_type='end_of_3rd_term',
            term='Term 3',
            year='2026',
            start_date=date.today(),
            end_date=date.today(),
        )
        self.assertEqual(exam.name, '2026 End of Term 3 exam')


class ReportCardReviewWorkflowTests(APITestCase):
    def setUp(self):
        teacher_role, _ = Role.objects.get_or_create(name='Teacher')
        self.teacher_user = User.objects.create_user('class-review-teacher', password='teacher-pass-123')
        UserProfile.objects.create(user=self.teacher_user, role=teacher_role, full_name='Class Teacher')
        self.teacher = Teacher.objects.create(
            user=self.teacher_user,
            name='Class Teacher',
        )
        self.school_class = SchoolClass.objects.create(
            name='Form 3B2',
            class_teacher=self.teacher,
        )
        self.subject = Subject.objects.create(name='Mathematics')
        TeacherSubjectClass.objects.create(
            teacher=self.teacher,
            school_class=self.school_class,
            subject=self.subject,
        )
        self.student_user = User.objects.create_user('review-student', password='student-pass-123')
        student_role, _ = Role.objects.get_or_create(name='Student')
        UserProfile.objects.create(user=self.student_user, role=student_role, full_name='Review Learner')
        self.student = Student.objects.create(
            user=self.student_user,
            student_id='REV001',
            name='Review Learner',
            school_class=self.school_class,
        )
        self.exam = Exam.objects.create(
            name='Term 3 Report',
            term='Term 3',
            year='2026',
            start_date=date(2026, 9, 8),
            end_date=date(2026, 12, 3),
            status='ongoing',
        )
        self.exam.classes.add(self.school_class)
        self.exam.subjects.add(self.subject)

    def test_class_teacher_submits_and_admin_comments_individual_report(self):
        self.client.force_authenticate(self.teacher_user)
        mark_response = self.client.post('/api/exams/mark-sheets/', {
            'exam': self.exam.pk,
            'school_class': self.school_class.pk,
            'subject': self.subject.pk,
            'marks': [{
                'student': self.student.pk,
                'total_marks': 100,
                'scored': 80,
            }],
        }, format='json')
        self.assertEqual(mark_response.status_code, 200, mark_response.data)

        save_response = self.client.post('/api/exams/report-card-reviews/save-class-comments/', {
            'exam': self.exam.pk,
            'school_class': self.school_class.pk,
            'comments': [{
                'student': self.student.pk,
                'comment': 'A thoughtful and hardworking learner.',
            }],
        }, format='json')
        self.assertEqual(save_response.status_code, 200, save_response.data)
        review = ReportCardReview.objects.get(exam=self.exam, student=self.student)
        self.assertEqual(review.class_teacher_comment, 'A thoughtful and hardworking learner.')

        submit_response = self.client.post('/api/exams/report-card-reviews/submit-class/', {
            'exam': self.exam.pk,
            'school_class': self.school_class.pk,
        }, format='json')
        self.assertEqual(submit_response.status_code, 200, submit_response.data)
        review.refresh_from_db()
        self.assertIsNotNone(review.class_teacher_submitted_at)
        self.assertEqual(review.class_teacher_submitted_by, self.teacher_user)

        admin = User.objects.create_superuser('review-admin', 'review-admin@example.test', 'admin-pass-123')
        self.client.force_authenticate(admin)
        pending_publish = self.client.patch(
            f'/api/exams/exams/{self.exam.pk}/',
            {'status': 'completed', 'results_published': True},
            format='json',
        )
        self.assertEqual(pending_publish.status_code, 400, pending_publish.data)
        admin_response = self.client.patch(
            f'/api/exams/report-card-reviews/{review.pk}/',
            {'principal_comment': 'Excellent effort this term.'},
            format='json',
        )
        self.assertEqual(admin_response.status_code, 200, admin_response.data)
        review.refresh_from_db()
        self.assertEqual(review.principal_comment, 'Excellent effort this term.')
        self.assertEqual(review.principal_reviewed_by, admin)

        publish_response = self.client.patch(
            f'/api/exams/exams/{self.exam.pk}/',
            {'status': 'completed', 'results_published': True},
            format='json',
        )
        self.assertEqual(publish_response.status_code, 200, publish_response.data)
        self.client.force_authenticate(self.student_user)
        student_response = self.client.get('/api/exams/report-card-reviews/', {'exam': self.exam.pk})
        self.assertEqual(student_response.status_code, 200, student_response.data)
        self.assertEqual(student_response.data['results'][0]['class_teacher_comment'], 'A thoughtful and hardworking learner.')
        self.assertEqual(student_response.data['results'][0]['principal_comment'], 'Excellent effort this term.')

    def test_non_class_teacher_cannot_save_or_submit_comments(self):
        other_user = User.objects.create_user('other-teacher', password='teacher-pass-123')
        teacher_role = Role.objects.get(name='Teacher')
        UserProfile.objects.create(user=other_user, role=teacher_role, full_name='Other Teacher')
        Teacher.objects.create(user=other_user, name='Other Teacher')
        self.client.force_authenticate(other_user)
        response = self.client.post('/api/exams/report-card-reviews/save-class-comments/', {
            'exam': self.exam.pk,
            'school_class': self.school_class.pk,
            'comments': [{'student': self.student.pk, 'comment': 'Unauthorized'}],
        }, format='json')
        self.assertEqual(response.status_code, 403, response.data)

    def test_class_teacher_can_read_class_marks_without_mark_entry_allocation(self):
        other_subject = Subject.objects.create(name='Science')
        self.exam.subjects.add(other_subject)
        other_teacher_user = User.objects.create_user('science-teacher', password='teacher-pass-123')
        UserProfile.objects.create(
            user=other_teacher_user,
            role=Role.objects.get(name='Teacher'),
            full_name='Science Teacher',
        )
        TeacherSubjectClass.objects.create(
            teacher=Teacher.objects.create(user=other_teacher_user, name='Science Teacher'),
            school_class=self.school_class,
            subject=other_subject,
        )
        mark = ExamMark.objects.create(
            exam=self.exam,
            student=self.student,
            subject=other_subject,
            total_marks=100,
            scored=76,
        )
        self.client.force_authenticate(self.teacher_user)

        response = self.client.get('/api/exams/exam-marks/', {'exam': self.exam.pk})

        self.assertEqual(response.status_code, 200, response.data)
        returned_mark_ids = {row['id'] for row in response.data['results']}
        self.assertIn(mark.pk, returned_mark_ids)
        update_response = self.client.patch(
            f'/api/exams/exam-marks/{mark.pk}/',
            {'scored': 90},
            format='json',
        )
        self.assertEqual(update_response.status_code, 400, update_response.data)
        mark.refresh_from_db()
        self.assertEqual(mark.scored, 76)

        self.client.force_authenticate(other_teacher_user)
        submission_response = self.client.post('/api/exams/mark-submissions/', {
            'exam': self.exam.pk,
            'school_class': self.school_class.pk,
            'subject': other_subject.pk,
            'teacher_name': 'Science Teacher',
            'note': '1 of 1 learners marked',
        }, format='json')
        self.assertEqual(submission_response.status_code, 201, submission_response.data)
        self.client.force_authenticate(self.teacher_user)
        handoff_response = self.client.get('/api/exams/mark-submissions/', {
            'exam': self.exam.pk,
            'school_class': self.school_class.pk,
        })
        self.assertEqual(handoff_response.status_code, 200, handoff_response.data)
        self.assertEqual(handoff_response.data['results'][0]['subject'], other_subject.pk)

    def test_admin_can_save_principal_comment_before_class_teacher_submission(self):
        admin = User.objects.create_superuser('early-comment-admin', 'early@example.test', 'admin-pass-123')
        self.client.force_authenticate(admin)

        response = self.client.post(
            '/api/exams/report-card-reviews/save-principal-comment/',
            {
                'exam': self.exam.pk,
                'student': self.student.pk,
                'principal_comment': 'Excellent progress this term.',
            },
            format='json',
        )

        self.assertEqual(response.status_code, 200, response.data)
        review = ReportCardReview.objects.get(exam=self.exam, student=self.student)
        self.assertEqual(review.principal_comment, 'Excellent progress this term.')
        self.assertEqual(review.principal_reviewed_by, admin)
        self.assertIsNotNone(review.principal_reviewed_at)
        self.assertIsNone(review.class_teacher_submitted_at)
