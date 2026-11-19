"""Money-moving logic shared by the API, the bank feed/statement import and the background worker.

Every path that credits a student goes through a function here so that the same rules apply:
rows are locked while they are changed, a payment can only be posted once, and a payment can
never push an invoice past its total.
"""

import hashlib
import logging
import os
import re
import uuid
from datetime import date, datetime, timedelta
from decimal import Decimal, InvalidOperation

from django.db import IntegrityError, transaction
from django.utils import timezone

from school.models import Student

from .gateways import GatewayError, GatewayNotConfigured, refresh_provider_status
from .models import BankDeposit, Invoice, OnlinePayment, Payment

logger = logging.getLogger(__name__)

CURRENCIES = {'USD', 'ZWG'}
TOKEN_RE = re.compile(r'[A-Z0-9][A-Z0-9-]{3,63}')


class DepositError(ValueError):
    """A deposit could not be posted; the message is safe to show to Accounts."""


# --------------------------------------------------------------------------- online payments


def _method_label(provider):
    return {
        'bank_transfer': 'NBS Bank Transfer',
        'ecocash': 'EcoCash Online',
        'paynow': 'Paynow Online',
    }.get(provider, 'ZimSwitch Online')


@transaction.atomic
def record_verified_online_payment(intent, provider_reference=''):
    """Credit the invoice once the provider (or Accounts) has confirmed the money. Idempotent."""
    intent = OnlinePayment.objects.select_for_update().select_related('invoice', 'created_by').get(pk=intent.pk)
    if intent.status == 'paid':
        return intent
    invoice = Invoice.objects.select_for_update().get(pk=intent.invoice_id)
    Payment.objects.create(
        receipt_no=f"ON-{uuid.uuid4().hex[:12].upper()}",
        invoice=invoice,
        amount=intent.amount,
        method=_method_label(intent.provider),
        reference=(provider_reference or intent.client_reference)[:64],
        date=timezone.localdate(),
        recorded_by=intent.created_by,
    )
    intent.status = 'paid'
    intent.provider_reference = (provider_reference or intent.provider_reference)[:64]
    intent.save(update_fields=['status', 'provider_reference', 'updated_at'])
    return intent


@transaction.atomic
def _update_if_pending(intent, **fields):
    """Change a still-pending intent. A payment that was confirmed meanwhile is never overwritten."""
    locked = OnlinePayment.objects.select_for_update().select_related('invoice').get(pk=intent.pk)
    if locked.status != 'pending':
        return locked
    for name, value in fields.items():
        setattr(locked, name, value)
    locked.save(update_fields=[*fields.keys(), 'updated_at'])
    return locked


def refresh_intent(intent):
    """Ask the provider about a pending payment and apply the answer. Returns (intent, message)."""
    if intent.status != 'pending':
        return intent, ''
    try:
        result = refresh_provider_status(intent)
    except (GatewayError, GatewayNotConfigured):
        return intent, 'The payment is still being confirmed. Check again shortly.'
    if result['status'] == 'paid':
        return record_verified_online_payment(intent, result.get('provider_reference', '')), ''
    if result['status'] == 'failed':
        intent = _update_if_pending(
            intent, status='failed', error_code=result.get('error_code', '')[:64],
            provider_reference=result.get('provider_reference', intent.provider_reference)[:64],
        )
        return intent, ''
    intent = _update_if_pending(
        intent, provider_reference=result.get('provider_reference', intent.provider_reference)[:64],
    )
    return intent, ''


def reconcile_pending_payments(now=None):
    """Confirm payments in the background so a parent who closes the browser is still credited.

    Gateway payments that are still unconfirmed after PENDING_EXPIRY_HOURS are cancelled so they
    stop blocking the invoice. Bank-transfer notes are never blocking and expire after 30 days.
    """
    now = now or timezone.now()
    try:
        expiry = timedelta(hours=float(os.environ.get('PENDING_EXPIRY_HOURS', '24')))
    except ValueError:
        expiry = timedelta(hours=24)
    summary = {'checked': 0, 'paid': 0, 'failed': 0, 'expired': 0}
    for intent in OnlinePayment.objects.filter(status='pending').select_related('invoice').order_by('id')[:500]:
        age = now - intent.created_at
        if intent.provider == 'bank_transfer':
            if age > timedelta(days=30):
                if _update_if_pending(intent, status='cancelled', error_code='EXPIRED').status == 'cancelled':
                    summary['expired'] += 1
            continue
        summary['checked'] += 1
        try:
            intent, _ = refresh_intent(intent)
        except Exception:  # one bad row must not stop the rest of the sweep
            logger.exception('Could not reconcile online payment %s', intent.client_reference)
            continue
        if intent.status == 'paid':
            summary['paid'] += 1
        elif intent.status == 'failed':
            summary['failed'] += 1
        elif age > expiry:
            if _update_if_pending(intent, status='cancelled', error_code='EXPIRED').status == 'cancelled':
                summary['expired'] += 1
    return summary


# --------------------------------------------------------------------------- bank deposits


def _tokens(text):
    return set(TOKEN_RE.findall((text or '').upper()))


def _outstanding(invoice):
    return invoice.amount - invoice.paid


def _find_invoice(deposit):
    """Work out which invoice a deposit is for. Returns (invoice or None, how_or_reason)."""
    tokens = _tokens(f"{deposit.reference} {deposit.bank_txn_id}")
    if not tokens:
        return None, 'The bank reference is empty.'

    invoices = list(Invoice.objects.filter(invoice_no__in=tokens))
    if len(invoices) == 1:
        return invoices[0], 'invoice number in the bank reference'
    if len(invoices) > 1:
        return None, 'The reference names more than one invoice.'

    # A parent told the portal about this deposit (their transfer note or deposit slip number).
    noted = {
        intent.invoice_id
        for intent in OnlinePayment.objects.filter(provider='bank_transfer', status='pending')
        if intent.client_reference.upper() in tokens
        or (intent.provider_reference and intent.provider_reference.upper() in tokens)
    }
    if len(noted) == 1:
        return Invoice.objects.get(pk=noted.pop()), "the parent's transfer note"
    if len(noted) > 1:
        return None, 'The reference matches transfer notes for more than one invoice.'

    students = list(Student.objects.filter(student_id__in=tokens))
    if len(students) == 1:
        open_invoices = [
            invoice for invoice in Invoice.objects.filter(student=students[0], currency=deposit.currency)
            if _outstanding(invoice) > 0
        ]
        if len(open_invoices) == 1:
            return open_invoices[0], 'student ID in the bank reference'
        if not open_invoices:
            return None, f'{students[0].name} has no open {deposit.currency} invoice.'
        return None, f'{students[0].name} has several open invoices; choose one.'
    if len(students) > 1:
        return None, 'The reference names more than one student.'
    return None, 'No invoice number or student ID found in the reference.'


def _close_bank_notes(invoice, deposit):
    """Mark the parent's pending transfer notes for this invoice as paid; no second payment is created."""
    tokens = _tokens(f"{deposit.reference} {deposit.bank_txn_id}")
    for intent in OnlinePayment.objects.select_for_update().filter(invoice=invoice, provider='bank_transfer', status='pending'):
        named = intent.client_reference.upper() in tokens or (
            intent.provider_reference and intent.provider_reference.upper() in tokens
        )
        if named or intent.amount == deposit.amount:
            intent.status = 'paid'
            intent.provider_reference = deposit.bank_txn_id[:64]
            intent.save(update_fields=['status', 'provider_reference', 'updated_at'])


@transaction.atomic
def post_deposit(deposit_id, invoice_id, user=None, how='Accounts'):
    """Credit a deposit to an invoice. Safe to call twice: a deposit is only ever posted once."""
    deposit = BankDeposit.objects.select_for_update().get(pk=deposit_id)
    if deposit.payment_id:
        return deposit
    if deposit.status == 'ignored':
        raise DepositError('This deposit was marked as not school fees.')
    invoice = Invoice.objects.select_for_update().get(pk=invoice_id)
    if invoice.currency != deposit.currency:
        raise DepositError(f'The deposit is in {deposit.currency} but the invoice is in {invoice.currency}.')
    existing = Payment.objects.filter(reference__iexact=deposit.bank_txn_id[:64], invoice=invoice, bank_deposit__isnull=True).first()
    if existing and existing.amount == deposit.amount:
        # Accounts already credited this exact transfer by hand: link it instead of paying twice.
        payment = existing
    else:
        outstanding = _outstanding(invoice)
        if outstanding <= 0:
            raise DepositError('That invoice is already fully paid.')
        if deposit.amount > outstanding:
            raise DepositError(f'The deposit is more than the invoice balance of {outstanding}.')
        payment = Payment.objects.create(
            receipt_no=f"BK-{uuid.uuid4().hex[:12].upper()}",
            invoice=invoice,
            amount=deposit.amount,
            method='Bank Deposit',
            reference=deposit.bank_txn_id[:64],
            date=deposit.value_date,
            recorded_by=user,
        )
    _close_bank_notes(invoice, deposit)
    deposit.invoice = invoice
    deposit.payment = payment
    deposit.status = 'matched'
    deposit.matched_by = user
    deposit.note = f'Matched by {how}.'[:255]
    deposit.save()
    return deposit


def try_auto_match(deposit):
    """Match a new deposit to an invoice when the bank reference makes it unambiguous."""
    invoice, why = _find_invoice(deposit)
    if invoice is None:
        BankDeposit.objects.filter(pk=deposit.pk).update(note=why[:255])
        deposit.note = why[:255]
        return deposit
    try:
        return post_deposit(deposit.pk, invoice.pk, how=why)
    except DepositError as exc:
        BankDeposit.objects.filter(pk=deposit.pk).update(note=f'{invoice.invoice_no}: {exc}'[:255])
        deposit.note = f'{invoice.invoice_no}: {exc}'[:255]
        return deposit


def _parse_amount(value):
    try:
        amount = Decimal(str(value).replace(',', '').replace(' ', '').strip()).quantize(Decimal('0.01'))
    except (InvalidOperation, ValueError):
        raise DepositError('amount is not a number')
    if not amount.is_finite() or amount > Decimal('9999999999.99'):
        raise DepositError('amount is not a number')
    return amount


def _parse_date(value):
    if isinstance(value, date):
        return value
    text = str(value or '').strip()[:32]
    for pattern in ('%Y-%m-%d', '%d/%m/%Y', '%d-%m-%Y', '%Y/%m/%d', '%d %b %Y', '%d %B %Y'):
        try:
            return datetime.strptime(text, pattern).date()
        except ValueError:
            continue
    try:
        return datetime.fromisoformat(text).date()
    except ValueError:
        raise DepositError('date is not recognised')


def normalise_row(row, default_currency='USD'):
    """Turn a bank feed entry or statement line into clean deposit fields, or raise DepositError."""
    amount = _parse_amount(row.get('amount', ''))
    if amount <= 0:
        raise DepositError('not a credit')
    currency = str(row.get('currency') or default_currency).strip().upper()
    if currency not in CURRENCIES:
        raise DepositError(f'currency {currency[:8]} is not supported')
    return {
        'bank_txn_id': str(row.get('transaction_id') or '').strip()[:64],
        'amount': amount,
        'currency': currency,
        'value_date': _parse_date(row.get('date')),
        'reference': str(row.get('reference') or '').strip()[:255],
        'payer_name': str(row.get('payer_name') or '').strip()[:128],
    }


def ingest_deposits(rows, source, default_currency='USD'):
    """Store deposits and auto-match them. Re-sending a line is harmless (it is counted as a duplicate)."""
    summary = {'created': 0, 'duplicates': 0, 'matched': 0, 'needs_review': 0, 'skipped': 0, 'errors': []}
    seen_lines = {}
    for number, row in enumerate(rows, start=1):
        try:
            fields = normalise_row(row, default_currency)
        except DepositError as exc:
            summary['skipped'] += 1
            if str(exc) != 'not a credit' and len(summary['errors']) < 20:
                summary['errors'].append(f'Line {number}: {exc}.')
            continue
        if not fields['bank_txn_id']:
            if source == 'webhook':
                summary['skipped'] += 1
                if len(summary['errors']) < 20:
                    summary['errors'].append(f'Entry {number}: transaction_id is required.')
                continue
            # Statements often have no id. Derive a stable one; identical lines in one file get distinct ids.
            line = f"{fields['value_date']}|{fields['amount']}|{fields['currency']}|{fields['reference']}|{fields['payer_name']}"
            seen_lines[line] = seen_lines.get(line, 0) + 1
            fields['bank_txn_id'] = 'CSV-' + hashlib.sha256(f'{line}|{seen_lines[line]}'.encode()).hexdigest()[:40]
        try:
            with transaction.atomic():
                deposit = BankDeposit.objects.create(source=source, **fields)
        except IntegrityError:
            summary['duplicates'] += 1
            continue
        summary['created'] += 1
        deposit = try_auto_match(deposit)
        summary['matched' if deposit.status == 'matched' else 'needs_review'] += 1
    return summary
