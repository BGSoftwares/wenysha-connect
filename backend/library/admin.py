from django.contrib import admin
from .models import Book, Borrowing


@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    list_display = ('title', 'author', 'category', 'copies', 'available')


@admin.register(Borrowing)
class BorrowingAdmin(admin.ModelAdmin):
    list_display = ('book', 'student', 'borrow_date', 'due_date', 'status')
