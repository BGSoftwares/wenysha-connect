from django.contrib import admin
from .models import Bus, Route


@admin.register(Bus)
class BusAdmin(admin.ModelAdmin):
    list_display = ('number', 'route_name', 'driver', 'status')


@admin.register(Route)
class RouteAdmin(admin.ModelAdmin):
    list_display = ('name', 'bus')
