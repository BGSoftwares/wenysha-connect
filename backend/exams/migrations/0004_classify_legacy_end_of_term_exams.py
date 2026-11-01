import re

from django.db import migrations


REPORT_TYPE_BY_TERM = {
    '1': 'end_of_1st_term',
    '2': 'end_of_2nd_term',
    '3': 'end_of_3rd_term',
}


def classify_legacy_end_of_term_exams(apps, schema_editor):
    Exam = apps.get_model('exams', 'Exam')
    database = schema_editor.connection.alias
    exams = Exam.objects.using(database).filter(report_type='fortnightly_tests')
    updates = {report_type: [] for report_type in REPORT_TYPE_BY_TERM.values()}

    for exam in exams.only('id', 'name', 'term'):
        normalized_name = re.sub(r'[^a-z0-9]+', ' ', exam.name.casefold()).strip()
        if not re.search(r'\bend of term\b', normalized_name):
            continue

        normalized_term = exam.term.casefold().strip()
        match = re.search(r'\bterm\s*([123])\b', normalized_term)
        if not match:
            match = re.search(r'\b([123])(?:st|nd|rd)?\s+term\b', normalized_term)
        if match:
            updates[REPORT_TYPE_BY_TERM[match.group(1)]].append(exam.pk)

    for report_type, exam_ids in updates.items():
        if exam_ids:
            Exam.objects.using(database).filter(pk__in=exam_ids).update(report_type=report_type)


class Migration(migrations.Migration):

    dependencies = [
        ('exams', '0003_exam_report_type_exam_results_published'),
    ]

    operations = [
        migrations.RunPython(classify_legacy_end_of_term_exams, migrations.RunPython.noop),
    ]
