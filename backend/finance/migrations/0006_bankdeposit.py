from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('finance', '0005_alter_onlinepayment_provider'),
    ]

    operations = [
        migrations.CreateModel(
            name='BankDeposit',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('bank_txn_id', models.CharField(max_length=64, unique=True)),
                ('amount', models.DecimalField(decimal_places=2, max_digits=12)),
                ('currency', models.CharField(choices=[('USD', 'US Dollar'), ('ZWG', 'Zimbabwe Gold (ZiG)')], default='USD', max_length=3)),
                ('value_date', models.DateField()),
                ('reference', models.CharField(blank=True, max_length=255)),
                ('payer_name', models.CharField(blank=True, max_length=128)),
                ('source', models.CharField(choices=[('webhook', 'Bank feed'), ('csv', 'Statement import')], default='csv', max_length=16)),
                ('status', models.CharField(choices=[('matched', 'Matched'), ('unmatched', 'Needs review'), ('ignored', 'Ignored')], db_index=True, default='unmatched', max_length=16)),
                ('note', models.CharField(blank=True, max_length=255)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('invoice', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='bank_deposits', to='finance.invoice')),
                ('matched_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='matched_bank_deposits', to=settings.AUTH_USER_MODEL)),
                ('payment', models.OneToOneField(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='bank_deposit', to='finance.payment')),
            ],
            options={
                'ordering': ['-value_date', '-id'],
            },
        ),
        migrations.AddConstraint(
            model_name='bankdeposit',
            constraint=models.CheckConstraint(check=models.Q(('amount__gt', 0)), name='bank_deposit_amount_positive'),
        ),
    ]
