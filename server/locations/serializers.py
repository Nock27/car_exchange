from rest_framework import serializers
from .models import Region, City

class RegionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Region
        fields = ["id","name"]

class CitySerializer(serializers.ModelSerializer):
    class Meta:
        model = City
        fields = ["id","name","region","latitude","longitude"]