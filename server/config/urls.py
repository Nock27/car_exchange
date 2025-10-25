"""
URL configuration for config project.
"""
from django.contrib import admin
from django.urls import include, path
from django.conf import settings
from django.conf.urls.static import static
import listings.views as listings_views

# DRF router nad JWT views
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView, TokenRefreshView, TokenVerifyView
)

# Listings & Locations viewsets
from listings.views import (
    BrandViewSet, CarModelViewSet, ListingViewSet,
    CategoryViewSet, FuelTypeViewSet, TransmissionTypeViewSet,
    BodyTypeViewSet, DriveTypeViewSet
)
from locations.views import RegionViewSet, CityViewSet

# Accounts views
from accounts.views import RegisterView, MeView, ProfileView

router = DefaultRouter()
# listings domain routes, the router auto generates RESTful endpoints.
router.register(r'brands', BrandViewSet, basename='brand')
router.register(r'models', CarModelViewSet, basename='model')
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'fueltypes', FuelTypeViewSet, basename='fueltype')
router.register(r'transmissions', TransmissionTypeViewSet, basename='transmission')
router.register(r'bodytypes', BodyTypeViewSet, basename='bodytype')
router.register(r'drivetypes', DriveTypeViewSet, basename='drivetype')
router.register(r"colors", listings_views.ColorViewSet, basename="color")
router.register(r'listings', ListingViewSet, basename='listing')
router.register(r"features", listings_views.FeatureViewSet, basename="feature")
router.register(r"favorites", listings_views.FavoriteViewSet, basename="favorite")

# locations domain routes
router.register(r'regions', RegionViewSet, basename='region')
router.register(r'cities', CityViewSet, basename='city')

# URL patterns for admin, API, auth and accounts
urlpatterns = [
    path('admin/', admin.site.urls),

    # API router (catalogs, listings, locations)
    path('api/', include(router.urls)),

    # JWT and endpoints
    path('auth/login', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/verify', TokenVerifyView.as_view(), name='token_verify'),

    # Accounts endpoints
    path('auth/register', RegisterView.as_view(), name='auth_register'),
    path('auth/me', MeView.as_view(), name='auth_me'),
    path('api/profile/', ProfileView.as_view(), name='api_profile'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
