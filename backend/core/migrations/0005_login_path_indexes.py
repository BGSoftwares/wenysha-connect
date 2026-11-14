from django.db import migrations, models

EMAIL_INDEX_NAME = 'auth_user_email_idx'


def _has_email_index(schema_editor, table):
    connection = schema_editor.connection
    with connection.cursor() as cursor:
        constraints = connection.introspection.get_constraints(cursor, table)
    return any(c.get('index') and c.get('columns') == ['email'] for c in constraints.values())


def add_auth_user_email_index(apps, schema_editor):
    """Login also looks accounts up by email; Django's auth_user has no index on it (full table scan)."""
    User = apps.get_model('auth', 'User')
    if _has_email_index(schema_editor, User._meta.db_table):
        return
    schema_editor.add_index(User, models.Index(fields=['email'], name=EMAIL_INDEX_NAME))


def drop_auth_user_email_index(apps, schema_editor):
    User = apps.get_model('auth', 'User')
    schema_editor.remove_index(User, models.Index(fields=['email'], name=EMAIL_INDEX_NAME))


class Migration(migrations.Migration):

    dependencies = [
        ('auth', '0012_alter_user_first_name_max_length'),
        ('core', '0004_default_portal_roles'),
    ]

    operations = [
        migrations.AlterField(
            model_name='userprofile',
            name='full_name',
            field=models.CharField(blank=True, db_index=True, max_length=255),
        ),
        migrations.AlterField(
            model_name='pendingapproval',
            name='email',
            field=models.EmailField(db_index=True, max_length=254),
        ),
        migrations.AlterField(
            model_name='pendingapproval',
            name='role',
            field=models.CharField(
                choices=[('student', 'Student'), ('teacher', 'Teacher'), ('parent', 'Parent'), ('accounts', 'Accounts')],
                db_index=True,
                max_length=32,
            ),
        ),
        migrations.AlterField(
            model_name='pendingapproval',
            name='status',
            field=models.CharField(
                choices=[('pending', 'Pending'), ('approved', 'Approved'), ('rejected', 'Rejected')],
                db_index=True,
                default='pending',
                max_length=20,
            ),
        ),
        migrations.AlterField(
            model_name='pendingapproval',
            name='requested_at',
            field=models.DateTimeField(auto_now_add=True, db_index=True),
        ),
        migrations.AddIndex(
            model_name='pendingapproval',
            index=models.Index(fields=['status', 'requested_at'], name='idx_pending_stat_req'),
        ),
        migrations.RunPython(add_auth_user_email_index, drop_auth_user_email_index),
    ]
