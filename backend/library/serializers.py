from pathlib import Path

from rest_framework import serializers
from core.upload_validation import validate_upload
from .models import Book, Borrowing


class BookSerializer(serializers.ModelSerializer):
    digital_file = serializers.FileField(required=False, allow_null=True, write_only=True)
    digital_file_url = serializers.SerializerMethodField()

    class Meta:
        model = Book
        fields = ['id', 'title', 'author', 'isbn', 'category', 'copies', 'available', 'digital_file', 'digital_file_url']
        read_only_fields = ['available']

    def get_digital_file_url(self, book):
        if not book.digital_file:
            return None
        request = self.context.get('request')
        url = book.digital_file.url
        return request.build_absolute_uri(url) if request else url

    def validate_digital_file(self, uploaded_file):
        if uploaded_file is None:
            return uploaded_file
        validate_upload(uploaded_file, {'.pdf', '.epub', '.docx'}, 'book file')
        if uploaded_file.size > 20 * 1024 * 1024:
            raise serializers.ValidationError('Book files must be 20 MB or smaller.')
        return uploaded_file


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
