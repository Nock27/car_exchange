from django.contrib import admin
from .models import (
    Category, Brand, CarModel,
    FuelType, TransmissionType, BodyType, DriveType,
    Listing, ListingImage
)

@admin.register(Brand)
class BrandAdmin(admin.ModelAdmin):
    search_fields = ("name",)

@admin.register(CarModel)
class CarModelAdmin(admin.ModelAdmin):
    search_fields = ("name", "brand__name")

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    search_fields = ("name",)

@admin.register(FuelType)
class FuelTypeAdmin(admin.ModelAdmin):
    search_fields = ("name",)

@admin.register(TransmissionType)
class TransmissionTypeAdmin(admin.ModelAdmin):
    search_fields = ("name",)

@admin.register(BodyType)
class BodyTypeAdmin(admin.ModelAdmin):
    search_fields = ("name",)

@admin.register(DriveType)
class DriveTypeAdmin(admin.ModelAdmin):
    search_fields = ("name",)

class ListingImageInline(admin.TabularInline):
    model = ListingImage
    extra = 1

@admin.register(Listing)
class ListingAdmin(admin.ModelAdmin):
    list_display = ("id","title","brand","model","city","price","year","status","is_active","created_at","expires_at")
    list_filter = ("status","is_active","brand","city","fuel_type","transmission","body_type","drive_type","year")
    search_fields = ("title","description","vin")
    autocomplete_fields = ("brand","model","city","seller")
    inlines = [ListingImageInline]
    date_hierarchy = "created_at"

@admin.register(ListingImage)
class ListingImageAdmin(admin.ModelAdmin):
    list_display = ("id","listing","order")