import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('school', '0008_issue_missing_student_numbers'),
    ]

    operations = [
        migrations.CreateModel(
            name='Project',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=160)),
                ('description', models.TextField(blank=True)),
                ('status', models.CharField(choices=[('planned', 'Planned'), ('active', 'Active'), ('on_hold', 'On hold'), ('completed', 'Completed')], default='planned', max_length=16)),
                ('start_date', models.DateField(blank=True, null=True)),
                ('end_date', models.DateField(blank=True, null=True)),
                ('budget', models.DecimalField(blank=True, decimal_places=2, max_digits=12, null=True)),
                ('currency', models.CharField(choices=[('USD', 'US dollars'), ('ZWG', 'Zimbabwe Gold')], default='USD', max_length=3)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('lead', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='led_projects', to='school.teacher')),
            ],
            options={'ordering': ['-created_at']},
        ),
        migrations.CreateModel(
            name='ProjectItem',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('kind', models.CharField(choices=[('activity', 'Activity'), ('resource', 'Resource')], default='activity', max_length=10)),
                ('title', models.CharField(max_length=200)),
                ('notes', models.CharField(blank=True, max_length=500)),
                ('due_date', models.DateField(blank=True, null=True)),
                ('cost', models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ('done', models.BooleanField(default=False)),
                ('project', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='items', to='school.project')),
            ],
            options={'ordering': ['done', 'due_date', 'id']},
        ),
    ]
