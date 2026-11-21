import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('school', '0001_initial'),
        ('exams', '0007_exammark_absent_decimal_scores'),
    ]

    operations = [
        migrations.CreateModel(
            name='PublishedRanking',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('class_position', models.PositiveIntegerField(blank=True, null=True)),
                ('class_total', models.PositiveIntegerField(default=0)),
                ('level_position', models.PositiveIntegerField(blank=True, null=True)),
                ('level_total', models.PositiveIntegerField(blank=True, null=True)),
                ('level_name', models.CharField(blank=True, max_length=64)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('exam', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='published_rankings', to='exams.exam')),
                ('student', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='published_rankings', to='school.student')),
            ],
        ),
        migrations.AddConstraint(
            model_name='publishedranking',
            constraint=models.UniqueConstraint(fields=('exam', 'student'), name='exams_one_published_ranking_per_student'),
        ),
    ]
