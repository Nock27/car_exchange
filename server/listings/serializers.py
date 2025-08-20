# server/listings/serializers.py
from rest_framework import serializers
from django.utils import timezone
import re

from .models import (
    Brand, CarModel, Listing, ListingImage,
    Category, FuelType, TransmissionType, BodyType, DriveType
)

# 17 chars, excludes I, O, Q (standard VIN constraint)
VIN_RE = re.compile(r'^[A-HJ-NPR-Z0-9]{17}$')

# --------- Simple enums / catalog ---------
class BrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = ["id", "name"]

class CarModelSerializer(serializers.ModelSerializer):
    class Meta:
        model = CarModel
        fields = ["id", "name", "brand"]

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name"]

class FuelTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = FuelType
        fields = ["id", "name"]

class TransmissionTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = TransmissionType
        fields = ["id", "name"]

class BodyTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = BodyType
        fields = ["id", "name"]

class DriveTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = DriveType
        fields = ["id", "name"]

# --------- Media ---------
class ListingImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ListingImage
        fields = ["id", "image", "order"]

# --------- Listing (core) ---------
class ListingSerializer(serializers.ModelSerializer):
    images = ListingImageSerializer(many=True, read_only=True)

    class Meta:
        model = Listing
        fields = [
            "id", "title", "description", "price", "year", "mileage",
            "category", "brand", "model", "city",
            "fuel_type", "transmission", "body_type", "drive_type",
            "engine_cc", "power_hp", "color", "euro_standard", "vin",
            "video_url",
            "address", "latitude", "longitude",
            "status", "is_active", "created_at", "updated_at", "expires_at",
            "images",
        ]
        # prevent clients from overriding server-managed fields
        read_only_fields = ["created_at", "updated_at", "expires_at"]

    # ----- Field-level validation -----
    def validate_year(self, v):
        current = timezone.now().year
        if v < 1950 or v > current + 1:
            raise serializers.ValidationError(f"Year must be between 1950 and {current + 1}.")
        return v

    def validate_price(self, v):
        if v is None or v <= 0:
            raise serializers.ValidationError("Price must be > 0.")
        return v

    def validate_mileage(self, v):
        if v is not None and v < 0:
            raise serializers.ValidationError("Mileage cannot be negative.")
        return v

    def validate_engine_cc(self, v):
        if v is not None and v <= 0:
            raise serializers.ValidationError("Engine displacement must be positive.")
        return v

    def validate_power_hp(self, v):
        if v is not None and v <= 0:
            raise serializers.ValidationError("Power (hp) must be positive.")
        return v

    def validate_vin(self, v):
        if not v:
            return v
        if not VIN_RE.match(v):
            raise serializers.ValidationError("VIN must be 17 chars (A–Z, 0–9) without I, O, Q.")
        return v

    # ----- Object-level validation -----
    def validate(self, attrs):
        # Ensure selected model belongs to brand
        brand_in = attrs.get("brand", getattr(self.instance, "brand", None))
        model_in = attrs.get("model", getattr(self.instance, "model", None))
        if brand_in and model_in:
            brand_id = getattr(brand_in, "id", brand_in)
            model_id = getattr(model_in, "id", model_in)
            model_obj = CarModel.objects.filter(id=model_id).first()
            if model_obj and model_obj.brand_id != brand_id:
                raise serializers.ValidationError({"model": "Selected model does not belong to the chosen brand."})

        # If address provided, require both coordinates (keeps exact pin consistent)
        addr = attrs.get("address")
        lat = attrs.get("latitude", None)
        lng = attrs.get("longitude", None)
        if addr and (lat is None or lng is None):
            raise serializers.ValidationError({"latitude": "Provide latitude and longitude when address is set."})

        return attrs
