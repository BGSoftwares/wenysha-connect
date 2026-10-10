"""Add fictional Able God College sample learners without changing existing records.

Run with: python manage.py seed_college_sample_students
The command is idempotent and creates no login accounts or credentials.
"""
from datetime import date

from django.core.management.base import BaseCommand

from school.models import SchoolClass, Student


SAMPLE_STUDENTS = [
    ("AGC26S001", "Tariro Mupfumi", "Female", date(2010, 4, 12)),
    ("AGC26S002", "Tawanda Chikomo", "Male", date(2009, 8, 3)),
    ("AGC26S003", "Rudo Muchengeti", "Female", date(2010, 1, 27)),
    ("AGC26S004", "Farai Nyoni", "Male", date(2009, 11, 18)),
]


class Command(BaseCommand):
    help = "Add up to four clearly documented sample learners, bringing a six-record local database to ten."

    def handle(self, *args, **options):
        school_class = SchoolClass.objects.filter(name="Form 4A").first() or SchoolClass.objects.first()
        if not school_class:
            self.stderr.write(self.style.ERROR("Create a class before adding sample learners."))
            return

        created = 0
        for student_id, name, gender, birth_date in SAMPLE_STUDENTS:
            _, was_created = Student.objects.get_or_create(
                student_id=student_id,
                defaults={
                    "name": name,
                    "school_class": school_class,
                    "gender": gender,
                    "status": "Active",
                    "date_of_birth": birth_date,
                    "address": "3878 Zexcom, Masvingo (sample record)",
                },
            )
            created += int(was_created)

        self.stdout.write(self.style.SUCCESS(
            f"Added {created} sample learner(s). Database now has {Student.objects.count()} student records."
        ))
