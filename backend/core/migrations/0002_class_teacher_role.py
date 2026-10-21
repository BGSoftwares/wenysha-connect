from django.db import migrations


def ensure_class_teacher_role(apps, schema_editor):
    Role = apps.get_model('core', 'Role')
    Role.objects.get_or_create(
        name='Class Teacher',
        defaults={
            'description': 'Teacher responsible for a class register and its student records.',
            'permissions': [],
        },
    )


class Migration(migrations.Migration):
    dependencies = [
        ('core', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(ensure_class_teacher_role, migrations.RunPython.noop),
    ]
