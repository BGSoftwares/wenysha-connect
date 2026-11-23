from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('exams', '0008_publishedranking'),
    ]

    operations = [
        migrations.AddField(
            model_name='reportcardreview',
            name='next_term_begins',
            field=models.DateField(blank=True, null=True),
        ),
    ]
