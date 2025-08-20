import django_filters as df
from .models import Listing

class ListingFilter(df.FilterSet):
    price_min = df.NumberFilter(field_name="price", lookup_expr="gte")
    price_max = df.NumberFilter(field_name="price", lookup_expr="lte")
    year_min  = df.NumberFilter(field_name="year", lookup_expr="gte")
    year_max  = df.NumberFilter(field_name="year", lookup_expr="lte")
    mileage_max = df.NumberFilter(field_name="mileage", lookup_expr="lte")
    search = df.CharFilter(method="filter_search")

    class Meta:
        model = Listing
        fields = [
            "category","brand","model","city",
            "fuel_type","transmission","body_type","drive_type",
            "status","is_active",
        ]

    def filter_search(self, queryset, name, value):
        # simple title/description icontains
        return queryset.filter(title__icontains=value) | queryset.filter(description__icontains=value)