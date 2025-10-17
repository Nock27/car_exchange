from django.contrib import admin, messages
from .models import (
    Category, Brand, CarModel,
    FuelType, TransmissionType, BodyType, DriveType,
    Listing, ListingImage, FeatureGroup, Feature, Color, Favorite
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

@admin.register(Color)
class ColorAdmin(admin.ModelAdmin):
    search_fields = ("name",)

class ListingImageInline(admin.TabularInline):
    model = ListingImage
    extra = 1

@admin.register(Listing)
class ListingAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "brand", "model", "price", "status", "is_active", "created_at")
    list_filter = ("status", "is_active", "brand", "model", "city", "fuel_type", "transmission")
    search_fields = ("title", "description", "vin")
    ordering = ("-id",)
    actions = ["approve_listings", "reject_listings", "mark_expired"]
    filter_horizontal = ("features",)

    list_editable = ("status", "is_active")

    def approve_listings(self, request, queryset):
        updated = queryset.update(status="approved", is_active=True)
        self.message_user(request, f"Approved {updated} listing(s).", level=messages.SUCCESS)
    approve_listings.short_description = "Approve selected listings"

    def reject_listings(self, request, queryset):
        updated = queryset.update(status="rejected", is_active=False)
        self.message_user(request, f"Rejected {updated} listing(s).", level=messages.WARNING)
    reject_listings.short_description = "Reject selected listings"

    def mark_expired(self, request, queryset):
        updated = queryset.update(status="expired", is_active=False)
        self.message_user(request, f"Marked {updated} listing(s) as expired.", level=messages.INFO)
    mark_expired.short_description = "Mark selected as expired"


@admin.register(ListingImage)
class ListingImageAdmin(admin.ModelAdmin):
    list_display = ("id","listing","order")

@admin.register(FeatureGroup)
class FeatureGroupAdmin(admin.ModelAdmin):
    list_display = ("id", "name")
    search_fields = ("name",)

@admin.register(Feature)
class FeatureAdmin(admin.ModelAdmin):
    list_display = ("id", "group", "name")
    list_filter = ("group",)
    search_fields = ("name",)

@admin.register(Favorite)
class FavoriteAdmin(admin.ModelAdmin):
    list_display = ("user", "listing", "created_at")
    search_fields = ("user__username", "listing__title", "listing__id")
    autocomplete_fields = ("user", "listing")