from rest_framework import viewsets
from .models import Book, Borrowing
from .serializers import BookSerializer, BorrowingSerializer


class BookViewSet(viewsets.ModelViewSet):
    queryset = Book.objects.all()
    serializer_class = BookSerializer
    filterset_fields = ['category']


class BorrowingViewSet(viewsets.ModelViewSet):
    queryset = Borrowing.objects.select_related('book', 'student', 'student__school_class').all()
    serializer_class = BorrowingSerializer
    filterset_fields = ['book', 'student', 'status']
