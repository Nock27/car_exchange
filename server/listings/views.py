from rest_framework import viewsets, permissions, status, decorators, response, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Prefetch, Q

from .permissions import IsSellerOrReadOnly, IsOwnerOrAdmin
from .filters import ListingFilter

from .models import (
    Brand, CarModel, Category, FuelType, TransmissionType, BodyType, DriveType,
    Listing, ListingImage, FeatureGroup, Feature, Color, Favorite
)
from .serializers import (
    BrandSerializer, CarModelSerializer,
    ListingSerializer, ListingImageSerializer, CategorySerializer, FuelTypeSerializer, TransmissionTypeSerializer,
    BodyTypeSerializer, DriveTypeSerializer, FeatureSerializer, ColorSerializer, FavoriteSerializer,
)


class BrandViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Brand.objects.all().order_by("name")
    serializer_class = BrandSerializer
    permission_classes = [permissions.AllowAny]


class CarModelViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = CarModelSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        qs = CarModel.objects.select_related("brand").order_by("name")
        brand = self.request.query_params.get("brand")
        return qs.filter(brand_id=brand) if brand else qs


class ListingViewSet(viewsets.ModelViewSet):
    serializer_class = ListingSerializer
    permission_classes = [IsSellerOrReadOnly, IsOwnerOrAdmin]

    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = ListingFilter
    ordering_fields = ["created_at", "price", "year", "mileage"]
    ordering = ["-created_at"]

    def perform_create(self, serializer):
        # Assign logged-in user as seller and set initial status to 'pending'
        serializer.save(seller=self.request.user, status="pending")

    def perform_update(self, serializer):
        instance = self.get_object()
        # sellers cannot self-approve and cannot change seller
        if not (self.request.user.is_staff or self.request.user.is_superuser):
            serializer.save(status=instance.status, seller=instance.seller)
        else:
            serializer.save()

    def get_queryset(self):
        """
        Base queryset used by list/detail **and** the map action.
        Important: we prefetch images in a single, consistent way so we can
        safely take the first one without the "lookup seen with a different queryset" error.
        """
        qs = (
            Listing.objects
            .select_related(
                "brand", "model", "city", "city__region", "fuel_type", "transmission",
                "body_type", "drive_type", "seller"
            )
            .prefetch_related("features")
            .prefetch_related(Prefetch("images", queryset=ListingImage.objects.order_by("order")))
            .order_by("-created_at")
        )
        u = self.request.user
        if not u.is_authenticated:
            return qs.filter(status="approved", is_active=True)
        if u.is_staff or u.is_superuser:
            return qs
        return qs.filter(Q(status="approved", is_active=True) | Q(seller=u))

    @action(detail=True, methods=["post"], url_path="upload_image")
    def upload_image(self, request, pk=None):
        listing = self.get_object()
        if listing.images.count() >= 15:
            return Response({"detail": "Max 15 images per listing."}, status=status.HTTP_400_BAD_REQUEST)

        file = request.FILES.get("image")
        if not file:
            return Response({"detail": "No image uploaded."}, status=status.HTTP_400_BAD_REQUEST)

        if not file.content_type.startswith("image/"):
            return Response({"detail": "Only image files allowed."}, status=status.HTTP_400_BAD_REQUEST)

        MAX_MB = 8
        if file.size > MAX_MB * 1024 * 1024:
            return Response({"detail": f"Max image size is {MAX_MB}MB."}, status=status.HTTP_400_BAD_REQUEST)

        img = ListingImage.objects.create(
            listing=listing,
            image=file,
            order=listing.images.count()
        )
        return Response(ListingImageSerializer(img).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["delete"], url_path=r"images/(?P<image_id>\d+)")
    def delete_image(self, request, pk=None, image_id=None):
        listing = self.get_object()

        try:
            img = listing.images.get(pk=image_id)
        except ListingImage.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        if not (request.user.is_staff or request.user.is_superuser or listing.seller_id == request.user.id):
            return Response({"detail": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)

        img.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=["get"], url_path="map")
    def map_points(self, request, *args, **kwargs):
        """
        Minimal dataset for the map. Includes:
        id, title, price, lat, lng, region/city names, and **thumbnail** (first image URL if present).
        Applies same public-vs-owner visibility as get_queryset(), then extra filters below.
        """
        qs = self.get_queryset().filter(latitude__isnull=False, longitude__isnull=False)

        p = request.query_params

        # numeric FK filters
        for key in [
            "brand", "model", "fuel_type", "transmission",
            "body_type", "drive_type", "color", "category", "city"
        ]:
            v = p.get(key)
            if v and v.isdigit():
                qs = qs.filter(**{f"{key}_id": int(v)})

        # region via city.region
        region = p.get("region")
        if region and region.isdigit():
            qs = qs.filter(city__region_id=int(region))

        # ranges
        t = p.get("price_min")
        if t and t.isdigit():
            qs = qs.filter(price__gte=int(t))
        t = p.get("price_max")
        if t and t.isdigit():
            qs = qs.filter(price__lte=int(t))

        t = p.get("year_min")
        if t and t.isdigit():
            qs = qs.filter(year__gte=int(t))
        t = p.get("year_max")
        if t and t.isdigit():
            qs = qs.filter(year__lte=int(t))

        t = p.get("mileage_max")
        if t and t.isdigit():
            qs = qs.filter(mileage__lte=int(t))

        # text search
        search = p.get("search")
        if search:
            qs = qs.filter(Q(title__icontains=search) | Q(description__icontains=search))

        qs = qs.select_related("brand", "model", "city", "city__region").order_by("-created_at")[:2000]

        # Build payload
        data = []
        build_abs = request.build_absolute_uri
        for x in qs:
            #  because of Prefetch in get_queryset(), x.images is ordered by "order"
            first_img = x.images.first() if hasattr(x, "images") else None
            thumbnail = build_abs(first_img.image.url) if (first_img and getattr(first_img, "image", None)) else None

            data.append({
                "id": x.id,
                "title": x.title or f"{getattr(x.brand, 'name', '')} {getattr(x.model, 'name', '')}".strip() or "Listing",
                "price": x.price,
                "lat": x.latitude,
                "lng": x.longitude,
                "region_name": getattr(getattr(x.city, "region", None), "name", None),
                "city_name": getattr(x.city, "name", None),
                "thumbnail": thumbnail,
            })

        return Response({"results": data})

    @action(detail=True, methods=["post", "delete", "get"], permission_classes=[permissions.IsAuthenticated])
    def favorite(self, request, pk=None):
        listing = self.get_object()
        user = request.user
        if request.method == "POST":
            Favorite.objects.get_or_create(user=user, listing=listing)
            return Response({"favorited": True}, status=status.HTTP_201_CREATED)
        if request.method == "DELETE":
            Favorite.objects.filter(user=user, listing=listing).delete()
            return Response({"favorited": False}, status=status.HTTP_204_NO_CONTENT)
        exists = Favorite.objects.filter(user=user, listing=listing).exists()
        return Response({"favorited": exists})
    
    @action(detail=False, methods=["get"], permission_classes=[permissions.IsAuthenticated])
    def mine(self, request):
        qs = self.get_queryset().filter(seller=request.user)
        page = self.paginate_queryset(qs)
        if page is not None:
            ser = self.get_serializer(page, many=True)
            return self.get_paginated_response(ser.data)
        ser = self.get_serializer(qs, many=True)
        return Response(ser.data)


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all().order_by("name")
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]


class FuelTypeViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = FuelType.objects.all().order_by("name")
    serializer_class = FuelTypeSerializer
    permission_classes = [permissions.AllowAny]


class TransmissionTypeViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = TransmissionType.objects.all().order_by("name")
    serializer_class = TransmissionTypeSerializer
    permission_classes = [permissions.AllowAny]


class BodyTypeViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = BodyType.objects.all().order_by("name")
    serializer_class = BodyTypeSerializer
    permission_classes = [permissions.AllowAny]


class DriveTypeViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = DriveType.objects.all().order_by("name")
    serializer_class = DriveTypeSerializer
    permission_classes = [permissions.AllowAny]


class FeatureViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Feature.objects.select_related("group").order_by("group__name", "name")
    serializer_class = FeatureSerializer
    permission_classes = [permissions.AllowAny]


class ColorViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Color.objects.all().order_by("name")
    serializer_class = ColorSerializer
    permission_classes = [permissions.AllowAny]

class FavoriteViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = FavoriteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            Favorite.objects.filter(user=self.request.user)
            .select_related(
                "listing",
                "listing__brand",
                "listing__model",
                "listing__city", "listing__city__region",
                "listing__fuel_type",
                "listing__transmission",
                "listing__body_type",
            )
            .prefetch_related("listing__images")
        )