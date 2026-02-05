from django.db import models
from school.models import Student


class Book(models.Model):
    title = models.CharField(max_length=255)
    author = models.CharField(max_length=255)
    isbn = models.CharField(max_length=32, blank=True)
    category = models.CharField(max_length=64, blank=True)
    copies = models.PositiveIntegerField(default=1)
    available = models.PositiveIntegerField(default=1)  # denormalized

    def __str__(self):
        return self.title


class Borrowing(models.Model):
    STATUS_CHOICES = [('Borrowed', 'Borrowed'), ('Returned', 'Returned'), ('Overdue', 'Overdue')]
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='borrowings')
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='library_borrowings')
    borrow_date = models.DateField()
    due_date = models.DateField()
    return_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Borrowed')

    class Meta:
        ordering = ['-borrow_date']

    def __str__(self):
        return f"{self.book.title} - {self.student.name}"
