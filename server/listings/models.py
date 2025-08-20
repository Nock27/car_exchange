from django.db import models
from django.conf import settings
from locations.models import City
from django.utils import timezone
from datetime import timedelta

# Create your models here.
# Here are my models of the Listings table of the db


class Category(models.Model):
    name = models.CharField(max_length=50, unique=True)  # e.g., Car, Motorcycle, Truck
    def __str__(self): return self.name

class Brand(models.Model):
    name = models.CharField(max_length=80, unique=True)
    def __str__(self): return self.name

class CarModel(models.Model):
    brand = models.ForeignKey(Brand, on_delete=models.CASCADE, related_name="models")
    name = models.CharField(max_length=80)
    class Meta:
        unique_together = ("brand", "name")
        indexes = [models.Index(fields=["brand", "name"])]
    def __str__(self): return f"{self.brand} {self.name}"

# Normalized enums (good for filters & consistency)
class FuelType(models.Model):
    name = models.CharField(max_length=40, unique=True)  # Petrol, Diesel, Electric, Hybrid...
    def __str__(self): return self.name

class TransmissionType(models.Model):
    name = models.CharField(max_length=40, unique=True)  # Manual, Automatic, CVT, DSG...
    def __str__(self): return self.name

class BodyType(models.Model):
    name = models.CharField(max_length=40, unique=True)  # Sedan, Hatchback, SUV, Coupe...
    def __str__(self): return self.name

class DriveType(models.Model):
    name = models.CharField(max_length=40, unique=True)  # FWD, RWD, AWD/4x4...
    def __str__(self): return self.name

def listing_image_path(instance, filename):
    return f"listings/{instance.listing_id}/{filename}"

def default_expires():
    return timezone.now() + timedelta(days=45)

class Listing(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"
        EXPIRED  = "expired", "Expired"

    # Ownership & categorization
    seller = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="listings")
    category = models.ForeignKey(Category, on_delete=models.PROTECT)

    # Make / model / location
    brand = models.ForeignKey(Brand, on_delete=models.PROTECT)
    model = models.ForeignKey(CarModel, on_delete=models.PROTECT)
    city  = models.ForeignKey(City, on_delete=models.PROTECT)

    # Headline & description
    title = models.CharField(max_length=120)
    description = models.TextField(blank=True)

    # Key numbers
    price   = models.DecimalField(max_digits=10, decimal_places=2)  # e.g. 12345.00
    year    = models.PositiveSmallIntegerField()
    mileage = models.PositiveIntegerField(default=0)  # in km

    # Technicals
    fuel_type      = models.ForeignKey(FuelType, on_delete=models.PROTECT)
    transmission   = models.ForeignKey(TransmissionType, on_delete=models.PROTECT)
    body_type      = models.ForeignKey(BodyType, on_delete=models.PROTECT, null=True, blank=True)
    drive_type     = models.ForeignKey(DriveType, on_delete=models.PROTECT, null=True, blank=True)
    engine_cc      = models.PositiveIntegerField(null=True, blank=True)  # engine displacement in cc
    power_hp       = models.PositiveIntegerField(null=True, blank=True)  # horsepower
    color          = models.CharField(max_length=40, blank=True)

    # Compliance
    euro_standard  = models.CharField(max_length=10, blank=True)  # e.g. "Euro 6d"

    # Media
    video_url = models.URLField(blank=True)

    # Moderation & lifecycle
    status      = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    is_active   = models.BooleanField(default=True)
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)
    expires_at  = models.DateTimeField(null=True, blank=True, default=default_expires, editable=False)

    # Optional ID (privacy-aware): allow null/blank; unique True allows multiple NULLs in Postgres
    vin = models.CharField(max_length=20, null=True, blank=True, unique=True)

    # Location
    address   = models.CharField(max_length=255, blank=True)
    latitude  = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["status", "is_active"]),
            models.Index(fields=["brand", "model"]),
            models.Index(fields=["city"]),
            models.Index(fields=["price"]),
            models.Index(fields=["year"]),
            models.Index(fields=["latitude", "longitude"]),
        ]

    def __str__(self): return self.title

class ListingImage(models.Model):
    listing = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name="images")
    image   = models.ImageField(upload_to=listing_image_path)
    order   = models.PositiveSmallIntegerField(default=0)
