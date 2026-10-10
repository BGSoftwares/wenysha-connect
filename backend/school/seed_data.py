from datetime import date

from django.contrib.auth.models import User
from django.db import transaction

from exams.models import Exam, ExamMark
from school.models import SchoolClass, Subject, Student, Teacher, TeacherSubjectClass


REQUIRED_SUBJECTS = [
    {"name": "Chemistry", "code": "CHEM", "department": "Science"},
    {"name": "Biology", "code": "BIO", "department": "Science"},
    {"name": "Physics", "code": "PHY", "department": "Science"},
    {"name": "Computer Science", "code": "CS", "department": "Technology"},
    {"name": "Combined Science", "code": "CSCI", "department": "Science"},
    {"name": "Mathematics", "code": "MATH", "department": "Mathematics"},
    {"name": "Geography", "code": "GEO", "department": "Humanities"},
    {"name": "Shona", "code": "SHO", "department": "Languages"},
    {"name": "English", "code": "ENG", "department": "Languages"},
    {"name": "FRS", "code": "FRS", "department": "Humanities"},
    {"name": "Heritage", "code": "HER", "department": "Humanities"},
    {"name": "BES", "code": "BES", "department": "Business"},
    {"name": "Economics", "code": "ECO", "department": "Business"},
]


DEFAULT_MARKS = {
    "Chemistry": 82,
    "Biology": 86,
    "Physics": 78,
    "Computer Science": 90,
    "Combined Science": 84,
    "Mathematics": 88,
    "Geography": 76,
    "Shona": 80,
    "English": 79,
    "FRS": 83,
    "Heritage": 77,
    "BES": 75,
    "Economics": 81,
}


@transaction.atomic
def ensure_academic_seed_data():
    school_class, _ = SchoolClass.objects.get_or_create(
        name="3B2",
        defaults={"capacity": 45, "enrolled": 0},
    )

    subject_by_name = {}
    for subject_data in REQUIRED_SUBJECTS:
        subject, _ = Subject.objects.get_or_create(
            name=subject_data["name"],
            defaults={
                "code": subject_data["code"],
                "department": subject_data["department"],
            },
        )
        subject_by_name[subject.name] = subject

    user = User.objects.filter(username="student01").first()
    if user is None:
        user = User.objects.create_user(
            username="student01",
            email="student01@wenysha.com",
            password="student123",
        )

    student, _ = Student.objects.get_or_create(
        user=user,
        defaults={
            "student_id": "STU001",
            "name": "Prince Hanyani",
            "school_class": school_class,
            "gender": "Male",
            "status": "Active",
        },
    )
    student.name = "Prince Hanyani"
    student.student_id = "STU001"
    student.school_class = school_class
    student.gender = "Male"
    student.status = "Active"
    student.save()

    teacher_user = User.objects.filter(username="teacher01").first()
    if teacher_user:
        teacher, _ = Teacher.objects.get_or_create(
            user=teacher_user,
            defaults={
                "name": "Mrs. Sarah Johnson",
                "department": "Science",
                "phone": "+263 773 123 456",
            },
        )
        teacher.name = "Mrs. Sarah Johnson"
        teacher.department = "Science"
        teacher.phone = "+263 773 123 456"
        teacher.save()

        for subject in subject_by_name.values():
            TeacherSubjectClass.objects.get_or_create(
                teacher=teacher,
                subject=subject,
                school_class=school_class,
                defaults={"periods": 5},
            )

    exam, _ = Exam.objects.get_or_create(
        name="Term 1 2025",
        defaults={
            "term": "Term 1",
            "year": "2025",
            "start_date": date(2025, 1, 13),
            "end_date": date(2025, 4, 12),
            "status": "grading",
        },
    )
    exam.classes.add(school_class)

    for subject_name, score in DEFAULT_MARKS.items():
        subject = subject_by_name[subject_name]
        exam.subjects.add(subject)
        ExamMark.objects.update_or_create(
            exam=exam,
            student=student,
            subject=subject,
            defaults={"total_marks": 100, "scored": score},
        )

    return school_class
