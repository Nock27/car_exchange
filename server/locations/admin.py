from django.contrib import admin
from .models import Region, City

# Register your models here.

# Register the region model to be searched by name
@admin.register(Region)
class RegionAdmin(admin.ModelAdmin):
    search_fields = ("name",)

# Register City model to be searched by name and region
@admin.register(City)
class CityAdmin(admin.ModelAdmin):
    search_fields = ("name", "region__name")
