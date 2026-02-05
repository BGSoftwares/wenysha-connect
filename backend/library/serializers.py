from rest_framework import serializers
from .models import Book, Borrowing


class BookSerializer(serializers.ModelSerializer):
    class Meta:
        model = Book
        fields = ['id', 'title', 'author', 'isbn', 'category', 'copies', 'available']


class BorrowingSerializer(serializers.ModelSerializer):
    book_title = serializers.CharField(source='book.title', read_only=True)
    student_name = serializers.CharField(source='student.name', read_only=True)
    class_name = serializers.CharField(source='student.school_class.name', read_only=True)

    class Meta:
        model = Borrowing
        fields = [
            'id', 'book', 'book_title', 'student', 'student_name', 'class_name',
            'borrow_date', 'due_date', 'return_date', 'status'
        ]
