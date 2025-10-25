from django.apps import AppConfig

# Tells Django how tha app is called and the default typ of auto ID fields
class LocationsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'locations'
