from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('finance', '0007_alter_onlinepayment_provider_paynow'),
    ]

    operations = [
        migrations.CreateModel(
            name='Expense',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('date', models.DateField()),
                ('category', models.CharField(choices=[('salaries', 'Salaries and wages'), ('utilities', 'Utilities'), ('supplies', 'Teaching supplies'), ('maintenance', 'Repairs and maintenance'), ('transport', 'Transport and fuel'), ('food', 'Kitchen and food'), ('events', 'Events and activities'), ('other', 'Other')], db_index=True, default='other', max_length=16)),
                ('description', models.CharField(max_length=255)),
                ('paid_to', models.CharField(blank=True, max_length=128)),
                ('amount', models.DecimalField(decimal_places=2, max_digits=12)),
                ('currency', models.CharField(choices=[('USD', 'US Dollar'), ('ZWG', 'Zimbabwe Gold (ZiG)')], default='USD', max_length=3)),
                ('method', models.CharField(blank=True, max_length=32)),
                ('reference', models.CharField(blank=True, max_length=64)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('recorded_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='recorded_expenses', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-date', '-id'],
            },
        ),
        migrations.AddConstraint(
            model_name='expense',
            constraint=models.CheckConstraint(check=models.Q(('amount__gt', 0)), name='finance_expense_amount_positive'),
        ),
    ]
