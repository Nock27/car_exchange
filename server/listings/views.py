from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Prefetch, Q
from .permissions import IsSellerOrReadOnly, IsOwnerOrAdmin
from .filters import ListingFilter

from .models import (
    Brand, CarModel, Category, FuelType, TransmissionType, BodyType, DriveType,
    Listing, ListingImage
)
from .serializers import (
    BrandSerializer, CarModelSerializer,
    ListingSerializer, ListingImageSerializer, CategorySerializer, FuelTypeSerializer, TransmissionTypeSerializer,
    BodyTypeSerializer, DriveTypeSerializer
)

# Create your views here.

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

    filter_backends = [DjangoFilterBackend]
    filterset_fields = [
        "brand", "model", "city", "fuel_type", "transmission",
        "body_type", "drive_type", "year", "status", "is_active",
    ]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_class = ListingFilter
    ordering_fields = ["created_at", "price", "year", "mileage"]
    ordering = ["-created_at"]  # default

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
        qs = (
            Listing.objects
            .select_related("brand","model","city","fuel_type","transmission","body_type","drive_type","seller")
            .prefetch_related(Prefetch("images", queryset=ListingImage.objects.order_by("order")))
            .order_by("-created_at")
        )
        u = self.request.user
        if not u.is_authenticated:
            return qs.filter(status="approved", is_active=True)
        if u.is_staff or u.is_superuser:
            return qs
        return qs.filter(Q(status="approved", is_active=True) | Q(seller=u))

    # Upload a single image (multipart/form-data: image=<file>)
    @action(detail=True, methods=["post"], url_path="upload_image")
    def upload_image(self, request, pk=None):
        listing = self.get_object()
        if listing.images.count() >= 15:
            return Response({"detail":"Max 15 images per listing."}, status=status.HTTP_400_BAD_REQUEST)

        file = request.FILES.get("image")
        if not file:
            return Response({"detail":"No image uploaded."}, status=status.HTTP_400_BAD_REQUEST)

        if not file.content_type.startswith("image/"):
            return Response({"detail":"Only image files allowed."}, status=status.HTTP_400_BAD_REQUEST)
        
        # optional: size guard (e.g., 8MB)
        MAX_MB = 8
        if file.size > MAX_MB * 1024 * 1024:
            return Response({"detail": f"Max image size is {MAX_MB}MB."}, status=status.HTTP_400_BAD_REQUEST)

        img = ListingImage.objects.create(listing=listing, image=file, order=listing.images.count())
        return Response(ListingImageSerializer(img).data, status=status.HTTP_201_CREATED)

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