from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('content', '0005_learningassignment_learningsubmission_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='galleryitem',
            name='description',
            field=models.CharField(blank=True, max_length=512),
        ),
        migrations.AddField(
            model_name='galleryitem',
            name='display_mode',
            field=models.CharField(choices=[('cover', 'Cover'), ('contain', 'Contain')], default='cover', max_length=8),
        ),
        migrations.AddField(
            model_name='galleryitem',
            name='display_order',
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.AddField(
            model_name='galleryitem',
            name='media_file',
            field=models.FileField(blank=True, null=True, upload_to='gallery/'),
        ),
        migrations.AddField(
            model_name='galleryitem',
            name='show_on_homepage',
            field=models.BooleanField(default=False),
        ),
        migrations.CreateModel(
            name='HeroCarouselConfig',
            fields=[
                ('id', models.PositiveSmallIntegerField(default=1, editable=False, primary_key=True, serialize=False)),
                ('initialized', models.BooleanField(default=False)),
            ],
        ),
    ]
