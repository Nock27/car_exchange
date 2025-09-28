from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ListingViewSet, BrandViewSet, CarModelViewSet, CategoryViewSet, FuelTypeViewSet, TransmissionTypeViewSet, BodyTypeViewSet, DriveTypeViewSet, FeatureViewSet, ColorViewSet

router = DefaultRouter()
router.register(r'listings', ListingViewSet, basename='listing')
router.register(r'brands', BrandViewSet, basename='brand')
router.register(r'models', CarModelViewSet, basename='model')
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'fueltypes', FuelTypeViewSet, basename='fueltype')
router.register(r'transmissions', TransmissionTypeViewSet, basename='transmission')
router.register(r'bodytypes', BodyTypeViewSet, basename='bodytype')
router.register(r'drivetypes', DriveTypeViewSet, basename='drivetype')
router.register(r'features', FeatureViewSet, basename='feature')
router.register(r'colors', ColorViewSet, basename='color')

urlpatterns = [
    path('', include(router.urls)),
]
