from django.core.management.base import BaseCommand

from exams.models import Exam
from exams.rankings import freeze_rankings


class Command(BaseCommand):
    help = (
        'Store the current class and year-group positions for published exams that have none saved yet '
        '(results published before positions were fixed at publish time).'
    )

    def add_arguments(self, parser):
        parser.add_argument('--dry-run', action='store_true', help='List the exams without saving anything.')

    def handle(self, *args, **options):
        pending = Exam.objects.filter(results_published=True, published_rankings__isnull=True).distinct()
        if not pending:
            self.stdout.write('Every published exam already has fixed positions.')
            return
        for exam in pending:
            if options['dry_run']:
                self.stdout.write(f'Would fix positions for: {exam}')
            else:
                self.stdout.write(f'{exam}: fixed positions for {freeze_rankings(exam)} learners.')
