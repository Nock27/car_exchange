from django.shortcuts import render
from rest_framework import viewsets, permissions
from .models import Region, City
from .serializers import RegionSerializer, CitySerializer

# Create your views here.



class RegionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Region.objects.all().order_by("name")
    serializer_class = RegionSerializer
    permission_classes = [permissions.AllowAny]

class CityViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = CitySerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        qs = City.objects.select_related("region").order_by("name")
        region = self.request.query_params.get("region")
        return qs.filter(region_id=region) if region else qs