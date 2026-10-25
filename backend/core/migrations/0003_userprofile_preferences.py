from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('core', '0002_class_teacher_role'),
    ]

    operations = [
        migrations.AddField(
            model_name='userprofile',
            name='preferences',
            field=models.JSONField(blank=True, default=dict),
        ),
    ]
