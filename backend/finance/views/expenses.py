from core.roles import portal_role
from decimal import Decimal, InvalidOperation
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView
from ..models import Expense, Payment


def _expense_payload(expense):
    return {
        'id': expense.id, 'date': expense.date.isoformat(), 'category': expense.category,
        'category_label': expense.get_category_display(), 'description': expense.description, 'paid_to': expense.paid_to,
        'amount': str(expense.amount), 'currency': expense.currency, 'method': expense.method, 'reference': expense.reference,
        'recorded_by': expense.recorded_by.get_username() if expense.recorded_by else '',
    }


def _require_expense_staff(user):
    if portal_role(user) not in {'admin', 'accounts'}:
        raise PermissionDenied('Only Accounts or Admin can work with expenses.')


class ExpenseListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        _require_expense_staff(request.user)
        queryset = Expense.objects.select_related('recorded_by')
        category = request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)
        return Response([_expense_payload(item) for item in queryset[:500]])

    def post(self, request):
        _require_expense_staff(request.user)
        data = request.data
        description = str(data.get('description', '')).strip()
        if not description:
            return Response({'detail': 'Say what the money was spent on.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            amount = Decimal(str(data.get('amount', '')))
        except InvalidOperation:
            amount = Decimal('0')
        if amount <= 0 or amount > Decimal('9999999999.99') or amount.as_tuple().exponent < -2:
            return Response({'detail': 'Enter an amount greater than zero, with at most two decimal places.'}, status=status.HTTP_400_BAD_REQUEST)
        currency = str(data.get('currency', 'USD')).upper()
        if currency not in {'USD', 'ZWG'}:
            return Response({'detail': 'Choose USD or ZWG.'}, status=status.HTTP_400_BAD_REQUEST)
        category = str(data.get('category', 'other'))
        if category not in dict(Expense.CATEGORY_CHOICES):
            return Response({'detail': 'Choose a valid category.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            spent_on = timezone.datetime.strptime(str(data.get('date', '')), '%Y-%m-%d').date()
        except ValueError:
            return Response({'detail': 'Enter the date the money was spent.'}, status=status.HTTP_400_BAD_REQUEST)
        expense = Expense.objects.create(
            date=spent_on, category=category, description=description[:255], paid_to=str(data.get('paid_to', ''))[:128],
            amount=amount, currency=currency, method=str(data.get('method', ''))[:32], reference=str(data.get('reference', ''))[:64],
            recorded_by=request.user,
        )
        return Response(_expense_payload(expense), status=status.HTTP_201_CREATED)


class ExpenseDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, pk):
        _require_expense_staff(request.user)
        deleted, _ = Expense.objects.filter(pk=pk).delete()
        if not deleted:
            return Response({'detail': 'That expense no longer exists.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)


class IncomeExpenseSummaryView(APIView):
    """Fees received against money spent, per month and per currency, plus spending by category."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        _require_expense_staff(request.user)
        year = request.query_params.get('year')
        try:
            year = int(year) if year else timezone.localdate().year
        except ValueError:
            return Response({'detail': 'Enter a valid year.'}, status=status.HTTP_400_BAD_REQUEST)
        months = {}

        def bucket(month, currency):
            return months.setdefault(f'{year}-{month:02d}', {}).setdefault(currency, {'income': Decimal('0'), 'expenses': Decimal('0')})

        for payment in Payment.objects.filter(date__year=year).select_related('invoice'):
            bucket(payment.date.month, payment.invoice.currency)['income'] += payment.amount
        by_category = {}
        for expense in Expense.objects.filter(date__year=year):
            bucket(expense.date.month, expense.currency)['expenses'] += expense.amount
            row = by_category.setdefault(expense.category, {'category': expense.category, 'label': expense.get_category_display(), 'totals': {}})
            row['totals'][expense.currency] = str(Decimal(row['totals'].get(expense.currency, '0')) + expense.amount)
        totals = {}
        for per_currency in months.values():
            for currency, values in per_currency.items():
                total = totals.setdefault(currency, {'income': Decimal('0'), 'expenses': Decimal('0')})
                total['income'] += values['income']
                total['expenses'] += values['expenses']
        def money(values):
            return {'income': str(values['income']), 'expenses': str(values['expenses']), 'net': str(values['income'] - values['expenses'])}
        return Response({
            'year': year,
            'totals': {currency: money(values) for currency, values in totals.items()},
            'months': [
                {'month': key, 'currencies': {currency: money(values) for currency, values in per_currency.items()}}
                for key, per_currency in sorted(months.items())
            ],
            'categories': sorted(by_category.values(), key=lambda row: row['label']),
        })
