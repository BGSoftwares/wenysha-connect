from django.db import migrations

NAMES = {
    'end_of_1st_term': 'End of Term 1',
    'end_of_2nd_term': 'End of Term 2',
    'end_of_3rd_term': 'End of Term 3',
    'monthly_report_card': 'End of Month',
    'fortnightly_tests': 'Fortnightly Test',
}


def use_plain_exam_names(apps, schema_editor):
    """'2026 End of Term 3 exam' becomes 'End of Term 3'; monthly and fortnightly exams lose their timestamps."""
    Exam = apps.get_model('exams', 'Exam')
    database = schema_editor.connection.alias
    for report_type, name in NAMES.items():
        Exam.objects.using(database).filter(report_type=report_type).update(name=name)


class Migration(migrations.Migration):

    dependencies = [
        ('exams', '0009_reportcardreview_next_term_begins'),
    ]

    operations = [
        # Old names cannot be rebuilt exactly (timestamps), so this step is not reversible.
        migrations.RunPython(use_plain_exam_names, migrations.RunPython.noop),
    ]
