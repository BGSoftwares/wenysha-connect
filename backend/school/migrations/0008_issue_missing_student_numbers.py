import re

from django.db import migrations

PREFIX = 'AbleGodStudent'
PATTERN = re.compile(rf'^{PREFIX}(\d+)$', re.IGNORECASE)


def issue_numbers(apps, schema_editor):
    """Start the counter after the highest number in use, then number every student who has none.

    Students that already have a number keep it exactly as it is: it may already be on receipts,
    report cards or bank references.
    """
    Student = apps.get_model('school', 'Student')
    Sequence = apps.get_model('school', 'StudentNumberSequence')
    User = apps.get_model('auth', 'User')

    taken = {(sid or '').strip().upper() for sid in Student.objects.values_list('student_id', flat=True)}
    taken |= {name.upper() for name in User.objects.filter(username__istartswith=PREFIX).values_list('username', flat=True)}
    highest = 0
    for value in taken:
        match = PATTERN.fullmatch(value)
        if match:
            highest = max(highest, int(match.group(1)))

    sequence, _ = Sequence.objects.get_or_create(pk=1)
    number = max(sequence.last_number, highest)
    for student in Student.objects.order_by('pk'):
        if (student.student_id or '').strip():
            continue
        while True:
            number += 1
            candidate = f'{PREFIX}{number:05d}'
            if candidate.upper() not in taken:
                break
        taken.add(candidate.upper())
        student.student_id = candidate
        student.save(update_fields=['student_id'])
    sequence.last_number = number
    sequence.save()


class Migration(migrations.Migration):

    dependencies = [
        ('school', '0007_studentnumbersequence'),
        ('auth', '0012_alter_user_first_name_max_length'),
    ]

    operations = [
        migrations.RunPython(issue_numbers, migrations.RunPython.noop),
    ]
