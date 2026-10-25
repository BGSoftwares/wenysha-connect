from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('parents', '0001_initial'),
        ('school', '0005_payment_school_payment_amount_positive'),
    ]

    operations = [
        migrations.AddField(
            model_name='studentparent',
            name='relationship',
            field=models.CharField(blank=True, max_length=64),
        ),
    ]
