import csv
import hashlib
import hmac
import io
import json
import os
from core.roles import portal_role
from rest_framework import permissions, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView
from ..models import BankDeposit, Invoice
from ..services import DepositError, ingest_deposits, post_deposit


def _require_finance_staff(user):
    if portal_role(user) not in {'admin', 'accounts'}:
        raise PermissionDenied('Only Accounts or Admin can work with bank deposits.')


def _deposit_payload(deposit):
    return {
        'id': deposit.id,
        'bank_txn_id': deposit.bank_txn_id,
        'amount': str(deposit.amount),
        'currency': deposit.currency,
        'value_date': deposit.value_date.isoformat(),
        'reference': deposit.reference,
        'payer_name': deposit.payer_name,
        'source': deposit.source,
        'status': deposit.status,
        'note': deposit.note,
        'invoice': deposit.invoice_id,
        'invoice_no': deposit.invoice.invoice_no if deposit.invoice_id else '',
        'student_name': deposit.invoice.student.name if deposit.invoice_id else '',
        'receipt_no': deposit.payment.receipt_no if deposit.payment_id else '',
        'created_at': deposit.created_at.isoformat(),
    }


class BankDepositListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        _require_finance_staff(request.user)
        queryset = BankDeposit.objects.select_related('invoice__student', 'payment')
        wanted = request.query_params.get('status')
        if wanted in {'matched', 'unmatched', 'ignored'}:
            queryset = queryset.filter(status=wanted)
        return Response([_deposit_payload(item) for item in queryset[:300]])


class BankDepositImportView(APIView):
    """Accounts uploads the bank's CSV statement; credits are matched to invoices automatically."""
    permission_classes = [permissions.IsAuthenticated]
    MAX_BYTES = 2 * 1024 * 1024
    MAX_ROWS = 5000
    ALIASES = {
        'transaction_id': {'transaction id', 'txn id', 'transaction reference', 'transaction ref', 'bank reference', 'ref no', 'id'},
        'date': {'date', 'value date', 'transaction date', 'posting date'},
        'reference': {'reference', 'description', 'narrative', 'details', 'particulars', 'remarks'},
        'amount': {'credit', 'credit amount', 'amount', 'deposit', 'deposits'},
        'debit': {'debit', 'debit amount', 'withdrawal', 'withdrawals'},
        'currency': {'currency', 'ccy'},
        'payer_name': {'payer', 'payer name', 'sender', 'account name', 'name'},
    }

    def post(self, request):
        _require_finance_staff(request.user)
        upload = request.FILES.get('file')
        if not upload:
            return Response({'detail': 'Choose the bank statement CSV file to import.'}, status=status.HTTP_400_BAD_REQUEST)
        if upload.size > self.MAX_BYTES:
            return Response({'detail': 'That file is too large. Import statements of up to 2 MB.'}, status=status.HTTP_400_BAD_REQUEST)
        currency = str(request.data.get('currency', 'USD')).strip().upper()
        if currency not in {'USD', 'ZWG'}:
            return Response({'detail': 'Choose USD or ZWG for statements that have no currency column.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            text = upload.read().decode('utf-8-sig')
        except UnicodeDecodeError:
            return Response({'detail': 'Save the statement as a CSV (UTF-8) file and try again.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            dialect = csv.Sniffer().sniff(text[:2048], delimiters=',;\t')
        except csv.Error:
            dialect = csv.excel
        reader = csv.DictReader(io.StringIO(text), dialect=dialect)
        if not reader.fieldnames:
            return Response({'detail': 'The file has no header row.'}, status=status.HTTP_400_BAD_REQUEST)
        columns = {}
        for name in reader.fieldnames:
            key = (name or '').strip().lower()
            for field, names in self.ALIASES.items():
                if key in names and field not in columns:
                    columns[field] = name
        missing = [label for field, label in (('date', 'date'), ('amount', 'credit or amount'), ('reference', 'reference or description')) if field not in columns]
        if missing:
            return Response({'detail': f"The statement needs these columns: {', '.join(missing)}."}, status=status.HTTP_400_BAD_REQUEST)

        rows = []
        for raw in reader:
            if len(rows) >= self.MAX_ROWS:
                return Response({'detail': f'Import at most {self.MAX_ROWS} lines at a time.'}, status=status.HTTP_400_BAD_REQUEST)
            row = {field: (raw.get(name) or '').strip() for field, name in columns.items()}
            if not row.get('amount') and row.get('debit'):
                continue  # money leaving the account is not a fee payment
            rows.append(row)
        summary = ingest_deposits(rows, 'csv', default_currency=currency)
        return Response(summary, status=status.HTTP_200_OK)


class BankDepositAssignView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        _require_finance_staff(request.user)
        try:
            deposit = BankDeposit.objects.get(pk=pk)
            invoice = Invoice.objects.get(pk=request.data.get('invoice'))
        except (BankDeposit.DoesNotExist, Invoice.DoesNotExist, TypeError, ValueError):
            return Response({'detail': 'Choose a valid deposit and invoice.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            deposit = post_deposit(deposit.pk, invoice.pk, user=request.user, how=f'{request.user.get_username()}')
        except DepositError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_409_CONFLICT)
        deposit = BankDeposit.objects.select_related('invoice__student', 'payment').get(pk=deposit.pk)
        return Response(_deposit_payload(deposit))


class BankDepositIgnoreView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        _require_finance_staff(request.user)
        updated = BankDeposit.objects.filter(pk=pk, status='unmatched').update(
            status='ignored', note=f"Marked as not school fees by {request.user.get_username()}."[:255], matched_by=request.user,
        )
        if not updated:
            return Response({'detail': 'Only deposits that need review can be ignored.'}, status=status.HTTP_409_CONFLICT)
        return Response(_deposit_payload(BankDeposit.objects.select_related('invoice__student', 'payment').get(pk=pk)))


class BankWebhookView(APIView):
    """Receives credits pushed by the bank. The body must be signed with the shared secret."""
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        secret = os.environ.get('BANK_WEBHOOK_SECRET', '').strip()
        if len(secret) < 16:
            return Response({'detail': 'Bank feed is not configured.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        raw = request.body
        expected = hmac.new(secret.encode('utf-8'), raw, hashlib.sha256).hexdigest()
        supplied = request.headers.get('X-Bank-Signature', '').strip().lower().removeprefix('sha256=')
        if not hmac.compare_digest(expected.encode('ascii'), supplied.encode('utf-8')):
            return Response({'detail': 'Invalid signature.'}, status=status.HTTP_401_UNAUTHORIZED)
        try:
            payload = json.loads(raw.decode('utf-8'))
        except (ValueError, UnicodeDecodeError):
            return Response({'detail': 'Body must be JSON.'}, status=status.HTTP_400_BAD_REQUEST)
        entries = payload.get('transactions') if isinstance(payload, dict) and 'transactions' in payload else [payload]
        if not isinstance(entries, list) or len(entries) > 500 or not all(isinstance(item, dict) for item in entries):
            return Response({'detail': 'Send one transaction or {"transactions": [...]} (up to 500).'}, status=status.HTTP_400_BAD_REQUEST)
        # Always answer 200 once the signature is good so the bank stops retrying; duplicates are harmless.
        return Response(ingest_deposits(entries, 'webhook'))
