from django.db import IntegrityError
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import UserProfile
# get the user model
User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    # It is write only since it's not sent back after creation
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        # Force the exact fields to return or to accept
        fields = ["id", "username", "email", "password", "role"]

    # Method to create a new user
    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user

# Method returns info for the current user and also the user phone
class MeSerializer(serializers.ModelSerializer):
    phone_e164 = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "email", "role", "is_staff", "is_superuser", "phone_e164"]

    def get_phone_e164(self, obj):
        prof = getattr(obj, 'profile', None)
        return getattr(prof, 'phone_e164', None) or ""

# update phone and email of the user
class UserProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField()

    class Meta:
        model = UserProfile
        fields = ["email", "phone_e164"]
        extra_kwargs = {
            "phone_e164": {"validators": []},
        }

    def validate_phone_e164(self, value):
        # Normalize empties
        if value in (None, ""):
            return None
        v = value.strip()

        import re
        # check for valid phone number format
        if not re.fullmatch(r"\+?\d{6,15}", v):
            raise serializers.ValidationError(
                "Enter a valid phone number in international format (e.g. +35988XXXXXXX)."
            )
        # Check for phone uniqueness
        qs = UserProfile.objects.filter(phone_e164=v)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("This phone number is already used by another user.")
        return v

    def update(self, instance, validated_data):
        # Update phone (None if blank)
        phone = validated_data.get("phone_e164", None)
        instance.phone_e164 = None if (phone in (None, "")) else phone

        # Update email on User
        email = validated_data.get("email", None)
        if email is not None and email != instance.user.email:
            instance.user.email = email
            instance.user.save(update_fields=["email"])

        try:
            instance.save(update_fields=["phone_e164"])
        except IntegrityError:
            # Safety net if DB uniqueness still triggers
            raise serializers.ValidationError(
                {"phone_e164": "This phone number is already used by another user."}
            )

        return instance
