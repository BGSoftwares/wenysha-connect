import re

from django.db import migrations, models


def assign_missing_or_duplicate_staff_ids(apps, schema_editor):
    Teacher = apps.get_model('school', 'Teacher')
    used = set()
    next_number = 0
    prefix_pattern = re.compile(r'^AbleGodStaff(\d+)$', re.IGNORECASE)
    teachers = list(Teacher.objects.order_by('pk'))

    for teacher in teachers:
        value = (teacher.employee_id or '').strip()
        match = prefix_pattern.fullmatch(value)
        if match:
            next_number = max(next_number, int(match.group(1)))

    for teacher in teachers:
        value = (teacher.employee_id or '').strip()
        normalized = value.casefold()
        if value and normalized not in used:
            used.add(normalized)
            continue

        while True:
            next_number += 1
            value = f'AbleGodStaff{next_number:03d}'
            normalized = value.casefold()
            if normalized not in used:
                break
        teacher.employee_id = value
        teacher.save(update_fields=['employee_id'])
        used.add(normalized)


class Migration(migrations.Migration):
    dependencies = [
        ('parents', '0001_initial'),
        ('school', '0005_payment_school_payment_amount_positive'),
    ]

    operations = [
        migrations.RunPython(assign_missing_or_duplicate_staff_ids, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='teacher',
            name='employee_id',
            field=models.CharField(
                blank=True,
                help_text='Automatically assigned staff ID (e.g. AbleGodStaff001)',
                max_length=32,
                unique=True,
            ),
        ),
    ]
