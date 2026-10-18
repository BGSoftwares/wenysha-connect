from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('school', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='schoolclass',
            name='parents_whatsapp_group',
            field=models.CharField(
                blank=True,
                help_text='WhatsApp group invite link for class parents (chat.whatsapp.com/...)',
                max_length=512,
            ),
        ),
    ]
