from rest_framework import serializers
from .models import Bus, Route


class BusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bus
        fields = ['id', 'number', 'route_name', 'driver', 'phone', 'capacity', 'students', 'status']


class RouteSerializer(serializers.ModelSerializer):
    bus_number = serializers.CharField(source='bus.number', read_only=True)

    class Meta:
        model = Route
        fields = ['id', 'name', 'bus', 'bus_number', 'stops', 'departure_am', 'departure_pm']
