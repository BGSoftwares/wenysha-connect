from django.db import models


class GalleryItem(models.Model):
    title = models.CharField(max_length=255)
    category = models.CharField(max_length=64)  # Sports, Academics, Arts, Events, Campus
    item_type = models.CharField(max_length=16, default='image')  # image, video
    image_url = models.URLField(max_length=512, blank=True)
    date = models.DateField(null=True, blank=True)

    class Meta:
        ordering = ['-date', '-id']

    def __str__(self):
        return self.title


class Announcement(models.Model):
    category = models.CharField(max_length=64)  # Academic, Events, Sports, Administrative
    title = models.CharField(max_length=255)
    content = models.TextField()
    date = models.CharField(max_length=32)  # or DateField
    important = models.BooleanField(default=False)

    class Meta:
        ordering = ['-id']

    def __str__(self):
        return self.title


class ContactMessage(models.Model):
    name = models.CharField(max_length=128)
    email = models.EmailField()
    phone = models.CharField(max_length=32, blank=True)
    subject = models.CharField(max_length=64)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} - {self.subject}"


class StaffMember(models.Model):
    name = models.CharField(max_length=128)
    role = models.CharField(max_length=64)
    department = models.CharField(max_length=64)
    bio = models.TextField(blank=True)
    image_url = models.URLField(max_length=512, blank=True)
    email = models.EmailField(blank=True)

    def __str__(self):
        return f"{self.name} - {self.role}"
