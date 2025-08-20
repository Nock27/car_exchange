# server/listings/serializers.py
from rest_framework import serializers
from .models import Brand, CarModel, Listing, ListingImage, Category, FuelType, TransmissionType, BodyType, DriveType

class BrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = ["id", "name"]

class CarModelSerializer(serializers.ModelSerializer):
    class Meta:
        model = CarModel
        fields = ["id", "name", "brand"]

class ListingImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ListingImage
        fields = ["id", "image", "order"]

class ListingSerializer(serializers.ModelSerializer):
    images = ListingImageSerializer(many=True, read_only=True)

    class Meta:
        model = Listing
        fields = [
            "id","title","description","price","year","mileage",
            "category","brand","model","city",
            "fuel_type","transmission","body_type","drive_type",
            "engine_cc","power_hp","color","euro_standard","vin",
            "video_url",
            "address","latitude","longitude",  # <-- interactive map fields
            "status","is_active","created_at","updated_at","expires_at",
            "images",
        ]

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