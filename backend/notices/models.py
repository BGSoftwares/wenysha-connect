from django.db import models


class Notice(models.Model):
    title = models.CharField(max_length=255)
    content = models.TextField()
    author = models.CharField(max_length=128)
    date = models.DateField()
    audience = models.CharField(max_length=64)  # All, All Students, Staff Only, etc.
    priority = models.CharField(max_length=16, default='Medium')  # High, Medium, Low
    pinned = models.BooleanField(default=False)
    views = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['-pinned', '-date']

    def __str__(self):
        return self.title
