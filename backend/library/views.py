from datetime import date, timedelta

from django.db import transaction
from django.db.models import F, Q
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response

from school.models import Student
from .models import Book, Borrowing
from .serializers import BookSerializer, BorrowingSerializer

LOAN_DAYS = 14
MAX_ACTIVE_LOANS = 3
STAFF_ROLES = {'admin', 'teacher', 'librarian', 'accounts'}


def user_role(user):
    if user.is_superuser or user.is_staff:
        return 'admin'
    profile = getattr(user, 'profile', None)
    if profile and profile.role:
        return profile.role.name.lower()
    return ''


def is_library_staff(user):
    return user_role(user) in STAFF_ROLES


def student_for(user):
    return Student.objects.filter(user=user).first()


class IsStaffOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        return is_library_staff(request.user)


def refresh_overdue(qs):
    qs.filter(status='Borrowed', due_date__lt=date.today()).update(status='Overdue')


class BookViewSet(viewsets.ModelViewSet):
    queryset = Book.objects.all().order_by('title')
    serializer_class = BookSerializer
    permission_classes = [IsStaffOrReadOnly]
    filterset_fields = ['category']

    def get_queryset(self):
        qs = super().get_queryset()
        q = self.request.query_params.get('search')
        if q:
            qs = qs.filter(Q(title__icontains=q) | Q(author__icontains=q) | Q(isbn__icontains=q))
        return qs

    def perform_create(self, serializer):
        copies = serializer.validated_data.get('copies', 1)
        serializer.save(available=copies)

    def perform_update(self, serializer):
        book = self.get_object()
        on_loan = book.copies - book.available
        copies = serializer.validated_data.get('copies', book.copies)
        if copies < on_loan:
            raise ValidationError({'copies': f'{on_loan} copies are on loan; total cannot be lower.'})
        serializer.save(available=copies - on_loan)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def borrow(self, request, pk=None):
        """Student borrows a book for themselves; staff may pass student id."""
        if is_library_staff(request.user) and request.data.get('student'):
            student = Student.objects.filter(pk=request.data['student']).first()
        else:
            student = student_for(request.user)
        if not student:
            raise ValidationError({'detail': 'No student profile linked to this account.'})

        with transaction.atomic():
            book = Book.objects.select_for_update().get(pk=pk)
            if book.available < 1:
                raise ValidationError({'detail': 'No copies available right now.'})
            active = Borrowing.objects.filter(student=student, status__in=['Borrowed', 'Overdue'])
            if active.filter(book=book).exists():
                raise ValidationError({'detail': 'You already have this book.'})
            if active.count() >= MAX_ACTIVE_LOANS:
                raise ValidationError({'detail': f'Limit of {MAX_ACTIVE_LOANS} books reached. Return one first.'})
            if active.filter(status='Overdue').exists() or active.filter(due_date__lt=date.today()).exists():
                raise ValidationError({'detail': 'Please return overdue books before borrowing more.'})
            Book.objects.filter(pk=book.pk).update(available=F('available') - 1)
            loan = Borrowing.objects.create(
                book=book, student=student, borrow_date=date.today(),
                due_date=date.today() + timedelta(days=LOAN_DAYS), status='Borrowed',
            )
        return Response(BorrowingSerializer(loan).data, status=status.HTTP_201_CREATED)


class BorrowingViewSet(viewsets.ModelViewSet):
    queryset = Borrowing.objects.select_related('book', 'student', 'student__school_class').all()
    serializer_class = BorrowingSerializer
    filterset_fields = ['book', 'student', 'status']
    http_method_names = ['get', 'post', 'patch', 'delete', 'head', 'options']

    def get_queryset(self):
        refresh_overdue(Borrowing.objects.all())
        qs = super().get_queryset()
        if is_library_staff(self.request.user):
            return qs
        student = student_for(self.request.user)
        return qs.filter(student=student) if student else qs.none()

    def create(self, request, *args, **kwargs):
        raise PermissionDenied('Use the borrow action on a book.')

    def update(self, request, *args, **kwargs):
        if not is_library_staff(request.user):
            raise PermissionDenied()
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        if not is_library_staff(request.user):
            raise PermissionDenied()
        return super().destroy(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def mine(self, request):
        student = student_for(request.user)
        qs = self.get_queryset().filter(student=student) if student else Borrowing.objects.none()
        return Response(BorrowingSerializer(qs, many=True).data)

    @action(detail=True, methods=['post'])
    def return_book(self, request, pk=None):
        if not is_library_staff(request.user):
            raise PermissionDenied('Only library staff can check books in.')
        with transaction.atomic():
            loan = Borrowing.objects.select_for_update().get(pk=pk)
            if loan.status == 'Returned':
                raise ValidationError({'detail': 'Already returned.'})
            loan.status = 'Returned'
            loan.return_date = date.today()
            loan.save()
            Book.objects.filter(pk=loan.book_id).update(available=F('available') + 1)
        return Response(BorrowingSerializer(loan).data)

    @action(detail=True, methods=['post'])
    def renew(self, request, pk=None):
        loan = self.get_queryset().filter(pk=pk).first()
        if not loan or loan.status != 'Borrowed':
            raise ValidationError({'detail': 'Only active, non-overdue loans can be renewed.'})
        loan.due_date = loan.due_date + timedelta(days=7)
        loan.save()
        return Response(BorrowingSerializer(loan).data)
