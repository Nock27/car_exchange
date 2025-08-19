"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from listings.views import BrandViewSet, CarModelViewSet, ListingViewSet
from locations.views import RegionViewSet, CityViewSet
from django.conf import settings
from django.conf.urls.static import static
from accounts.views import RegisterView, MeView

from rest_framework_simplejwt.views import (
    TokenObtainPairView,  # /auth/login
    TokenRefreshView,     # /auth/refresh
    TokenVerifyView,      # /auth/verify (optional)
)

router = DefaultRouter()
router.register(r'brands', BrandViewSet, basename='brand')
router.register(r'models', CarModelViewSet, basename='model')
router.register(r'listings', ListingViewSet, basename='listing')
router.register(r'regions', RegionViewSet, basename='region')
router.register(r'cities', CityViewSet, basename='city')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    # JWT
    path('auth/login', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/verify', TokenVerifyView.as_view(), name='token_verify'),

    path('auth/register', RegisterView.as_view(), name='auth_register'),
    path('auth/me', MeView.as_view(), name='auth_me'),
    
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
