from django.contrib import admin
from .models import User

# Register the User model in the admin panel
@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ("id","username","email","role","is_staff","is_superuser")
    search_fields = ("username","email")