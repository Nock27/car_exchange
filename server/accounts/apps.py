from django.apps import AppConfig

# Tells Django how tha app is called and the default typ of auto ID fields
class AccountsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'accounts'
