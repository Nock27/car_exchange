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
    actions = ["approve_listings", "reject_listings"]

    def approve_listings(self, request, queryset):
        updated = 0
        for listing in queryset:
            listing.approve()
            updated += 1
        self.message_user(request, f"Approved {updated} listing(s).")
    approve_listings.short_description = "Approve selected listings"

    def reject_listings(self, request, queryset):
        updated = 0
        for listing in queryset:
            listing.reject()
            updated += 1
        self.message_user(request, f"Rejected {updated} listing(s).")
    reject_listings.short_description = "Reject selected listings"

    def save_model(self, request, obj, form, change):
        # keep is_active consistent when saving via the admin form
        if obj.status == obj.Status.APPROVED:
            obj.is_active = True
        else:
            obj.is_active = False
        super().save_model(request, obj, form, change)


@admin.register(ListingImage)
class ListingImageAdmin(admin.ModelAdmin):
    list_display = ("id","listing","order")