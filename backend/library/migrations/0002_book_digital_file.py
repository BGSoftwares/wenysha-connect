from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('library', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='book',
            name='digital_file',
            field=models.FileField(blank=True, null=True, upload_to='library/books/'),
        ),
    ]
