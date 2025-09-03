from rest_framework import serializers
from django.utils import timezone
import re

from .models import (
    Brand, CarModel, Listing, ListingImage,
    Category, FuelType, TransmissionType, BodyType, DriveType
)

# 17 chars, excludes I, O, Q
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

    # Read-only contact surfaced from the seller's profile
    seller_contact_email = serializers.SerializerMethodField(read_only=True)
    seller_contact_phone = serializers.SerializerMethodField(read_only=True)

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
            # Read-only contact
            "seller_contact_email", "seller_contact_phone",
        ]
        read_only_fields = [
            "created_at", "updated_at", "expires_at",
            "seller_contact_email", "seller_contact_phone",
        ]

    # ----- Field-level validation -----
    def validate_year(self, v):
        current = timezone.now().year
        if v < 1950 or v > current + 1:
            raise serializers.ValidationError(f"Year must be between 1950 and {current + 1}.")
        return v

    def validate_price(self, v):
        if v is None or v <= 0:
            raise serializers.ValidationError("Price must be a positive number.")
        return v

    def validate_engine_cc(self, v):
        if v is None or v <= 0:
            raise serializers.ValidationError("Engine displacement must be positive.")
        return v

    def validate_power_hp(self, v):
        if v is None or v <= 0:
            raise serializers.ValidationError("Power must be positive.")
        return v

    def validate_vin(self, v):
        if not v:
            return v
        v = v.strip().upper()
        if not VIN_RE.match(v):
            raise serializers.ValidationError("VIN must be 17 chars (A–Z, 0–9) without I, O, Q.")
        return v

    # ----- Object-level validation -----
    def validate(self, attrs):
        # 0) Enforce: seller must have phone before creating/updating listings
        request = self.context.get("request")
        if request and request.user and request.user.is_authenticated:
            profile = getattr(request.user, "profile", None)
            phone = getattr(profile, "phone_e164", None) if profile else None
            if not phone:
                raise serializers.ValidationError({
                    "non_field_errors": ["Please add your phone number in your profile before posting a listing."]
                })

        # 1) Ensure selected model belongs to brand
        brand_in = attrs.get("brand", getattr(self.instance, "brand", None))
        model_in = attrs.get("model", getattr(self.instance, "model", None))
        if brand_in and model_in:
            brand_id = getattr(brand_in, "id", brand_in)
            model_id = getattr(model_in, "id", model_in)
            model_obj = CarModel.objects.filter(id=model_id).first()
            if model_obj and model_obj.brand_id != brand_id:
                raise serializers.ValidationError({"model": "Selected model does not belong to the chosen brand."})

        # 2) If address provided, require both coordinates (keep precise pin)
        addr = attrs.get("address")
        lat = attrs.get("latitude", None)
        lng = attrs.get("longitude", None)
        if addr and (lat is None or lng is None):
            raise serializers.ValidationError({"latitude": "Provide latitude and longitude when address is set."})

        return attrs

    # ----- Contact surface -----
    def get_seller_contact_email(self, obj: Listing):
        user = getattr(obj, "seller", None)
        return getattr(user, "email", "") if user else ""

    def get_seller_contact_phone(self, obj: Listing):
        user = getattr(obj, "seller", None)
        profile = getattr(user, "profile", None) if user else None
        return getattr(profile, "phone_e164", "") if profile else ""
