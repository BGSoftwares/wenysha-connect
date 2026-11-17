from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('school', '0006_teacher_employee_id_unique'),
    ]

    operations = [
        migrations.CreateModel(
            name='StudentNumberSequence',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('last_number', models.PositiveIntegerField(default=0)),
            ],
        ),
        migrations.AlterField(
            model_name='student',
            name='student_id',
            field=models.CharField(blank=True, help_text='Issued automatically when the student is created. It is unique and never changes.', max_length=32, unique=True),
        ),
    ]
