from collections import defaultdict

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from school.models import STUDENT_ID_PREFIX, Student, StudentNumberSequence, allocate_student_id


class Command(BaseCommand):
    help = (
        'Check that every student has exactly one unique student number, and issue numbers to any student '
        'who lacks one. Existing numbers are never changed. Use --dry-run to only report.'
    )

    def add_arguments(self, parser):
        parser.add_argument('--dry-run', action='store_true', help='Report problems without changing anything.')

    def handle(self, *args, **options):
        students = list(Student.objects.order_by('pk'))
        missing = [student for student in students if not (student.student_id or '').strip()]
        by_number = defaultdict(list)
        for student in students:
            if (student.student_id or '').strip():
                by_number[student.student_id.strip().upper()].append(student)
        clashes = {number: owners for number, owners in by_number.items() if len(owners) > 1}
        odd = [s for s in students if s.student_id.strip() and not s.student_id.upper().startswith(STUDENT_ID_PREFIX.upper())]

        self.stdout.write(f'{len(students)} students; {len(missing)} without a number; {len(clashes)} numbers shared by more than one student.')
        for number, owners in clashes.items():
            self.stdout.write(self.style.ERROR(f'  {number} is used by: ' + ', '.join(f'{o.name} (id {o.pk})' for o in owners)))
        if odd:
            self.stdout.write(f'{len(odd)} students keep an older-style number (left unchanged on purpose).')

        if clashes:
            raise CommandError('Some students share a number. Resolve those by hand; the database should have refused this.')
        if options['dry_run'] or not missing:
            return

        with transaction.atomic():
            for student in missing:
                student.student_id = allocate_student_id()
                student.save(update_fields=['student_id'])
        last = StudentNumberSequence.objects.get(pk=1).last_number
        self.stdout.write(self.style.SUCCESS(f'Issued numbers to {len(missing)} students. Counter is now at {last}.'))
