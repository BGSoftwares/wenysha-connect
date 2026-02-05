from django.db import models


class Bus(models.Model):
    number = models.CharField(max_length=32, unique=True)  # WEN-001
    route_name = models.CharField(max_length=128)  # Borrowdale - School
    driver = models.CharField(max_length=128)
    phone = models.CharField(max_length=32, blank=True)
    capacity = models.PositiveIntegerField(default=45)
    students = models.PositiveIntegerField(default=0)  # current count
    status = models.CharField(max_length=32, default='Active')  # Active, Maintenance

    def __str__(self):
        return f"{self.number} - {self.route_name}"


class Route(models.Model):
    name = models.CharField(max_length=128)
    bus = models.ForeignKey(Bus, on_delete=models.CASCADE, related_name='routes')
    stops = models.JSONField(default=list)  # list of stop names
    departure_am = models.TimeField(null=True, blank=True)
    departure_pm = models.TimeField(null=True, blank=True)

    def __str__(self):
        return self.name
