from django.db import migrations

TERM_NUMBERS = (
    ('end_of_1st_term', 1),
    ('end_of_2nd_term', 2),
    ('end_of_3rd_term', 3),
)


def rename_end_of_term_exams(apps, schema_editor):
    """'2026 End of Term 3 exam' becomes 'End of Term 3 2026'."""
    Exam = apps.get_model('exams', 'Exam')
    database = schema_editor.connection.alias
    for report_type, number in TERM_NUMBERS:
        exams = Exam.objects.using(database).filter(report_type=report_type)
        for exam in exams.only('pk', 'year'):
            exams.filter(pk=exam.pk).update(name=f'End of Term {number} {exam.year}')


def restore_end_of_term_exams(apps, schema_editor):
    Exam = apps.get_model('exams', 'Exam')
    database = schema_editor.connection.alias
    for report_type, number in TERM_NUMBERS:
        exams = Exam.objects.using(database).filter(report_type=report_type)
        for exam in exams.only('pk', 'year'):
            exams.filter(pk=exam.pk).update(name=f'{exam.year} End of Term {number} exam')


class Migration(migrations.Migration):

    dependencies = [
        ('exams', '0009_reportcardreview_next_term_begins'),
    ]

    operations = [
        migrations.RunPython(rename_end_of_term_exams, restore_end_of_term_exams),
    ]
