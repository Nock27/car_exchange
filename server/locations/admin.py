from django.contrib import admin
from .models import Region, City

# Register your models here.

@admin.register(Region)
class RegionAdmin(admin.ModelAdmin):
    search_fields = ("name",)

@admin.register(City)
class CityAdmin(admin.ModelAdmin):
    search_fields = ("name", "region__name")
