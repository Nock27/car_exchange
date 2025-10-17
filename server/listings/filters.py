import django_filters as df
from django.db.models import Q
from .models import Listing

class ListingFilter(df.FilterSet):
    # Existing ranges
    price_min   = df.NumberFilter(field_name="price", lookup_expr="gte")
    price_max   = df.NumberFilter(field_name="price", lookup_expr="lte")
    year_min    = df.NumberFilter(field_name="year", lookup_expr="gte")
    year_max    = df.NumberFilter(field_name="year", lookup_expr="lte")
    mileage_max = df.NumberFilter(field_name="mileage", lookup_expr="lte")

    # engine cc & power hp ranges
    cc_from     = df.NumberFilter(field_name="engine_cc", lookup_expr="gte")
    cc_to       = df.NumberFilter(field_name="engine_cc", lookup_expr="lte")
    power_from  = df.NumberFilter(field_name="power_hp", lookup_expr="gte")
    power_to    = df.NumberFilter(field_name="power_hp", lookup_expr="lte")

    # region (through city)
    region      = df.NumberFilter(method="filter_region")

    # euro standard (substring, case-insensitive; matches "Euro 6", "Euro 6d", etc.)
    euro        = df.CharFilter(field_name="euro_standard", lookup_expr="icontains")

    # Simple full-text over title and description
    search      = df.CharFilter(method="filter_search")

    extra       = df.CharFilter(method="filter_extras_any")
    features    = df.CharFilter(method="filter_extras_any")

    class Meta:
        model = Listing
        fields = [
            # direct FKs/exacts
            "category","brand","model","city",
            "fuel_type","transmission","body_type","drive_type",
            "color",
            # moderation flags
            "status","is_active",
            "extra","features",
        ]

    def filter_region(self, queryset, name, value):
        return queryset.filter(city__region_id=value)

    def filter_search(self, queryset, name, value):
        return queryset.filter(title__icontains=value) | queryset.filter(description__icontains=value)

    def _parse_values(self):
        vals = []
        for pname in ("extra", "features"):
            for raw in self.data.getlist(pname):
                for token in raw.split(","):
                    t = token.strip().strip(",")
                    if t:
                        vals.append(t)
        return vals

    def filter_extras_any(self, qs, name, value):
        values = self._parse_values()
        if not values:
            return qs
        q = Q()
        for v in values:
            q |= Q(features__name__iexact=v)
        return qs.filter(q).distinct()