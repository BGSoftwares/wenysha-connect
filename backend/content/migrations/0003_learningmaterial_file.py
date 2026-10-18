from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('content', '0002_learningmaterial'),
    ]

    operations = [
        migrations.AddField(
            model_name='learningmaterial',
            name='file',
            field=models.FileField(blank=True, null=True, upload_to='learning_materials/'),
        ),
        migrations.AlterField(
            model_name='learningmaterial',
            name='file_url',
            field=models.CharField(blank=True, max_length=512),
        ),
    ]
