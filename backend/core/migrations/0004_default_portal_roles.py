from django.db import migrations


PORTAL_ROLES = {
    'Admin': 'Administrator access to school operations.',
    'Teacher': 'Teacher portal access.',
    'Student': 'Student portal access.',
    'Parent': 'Parent and guardian portal access.',
    'Accounts': 'Accounts and finance portal access.',
}


def ensure_portal_roles(apps, schema_editor):
    Role = apps.get_model('core', 'Role')
    for name, description in PORTAL_ROLES.items():
        if not Role.objects.filter(name__iexact=name).exists():
            Role.objects.create(name=name, description=description, permissions=[])


class Migration(migrations.Migration):
    dependencies = [
        ('core', '0003_userprofile_preferences'),
    ]

    operations = [
        migrations.RunPython(ensure_portal_roles, migrations.RunPython.noop),
    ]
