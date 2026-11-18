import django.core.validators
from decimal import Decimal
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('exams', '0006_reportcardreview_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='exammark',
            name='absent',
            field=models.BooleanField(default=False),
        ),
        migrations.AlterField(
            model_name='exammark',
            name='scored',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=6, validators=[django.core.validators.MinValueValidator(0)]),
        ),
    ]
