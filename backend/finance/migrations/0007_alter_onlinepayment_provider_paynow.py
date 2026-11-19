from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('finance', '0006_bankdeposit'),
    ]

    operations = [
        migrations.AlterField(
            model_name='onlinepayment',
            name='provider',
            field=models.CharField(
                choices=[('ecocash', 'EcoCash'), ('zimswitch', 'ZimSwitch'), ('paynow', 'Paynow'), ('bank_transfer', 'NBS Bank Transfer')],
                max_length=16,
            ),
        ),
    ]
