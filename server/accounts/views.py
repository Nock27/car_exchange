from rest_framework import generics, permissions
from django.contrib.auth import get_user_model
from .serializers import RegisterSerializer, MeSerializer, UserProfileSerializer
from .models import UserProfile

# Get the current user
User = get_user_model()

# handles POST request for creating user
class RegisterView(generics.CreateAPIView):
    # Gets all the fields of the user model
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    # public access for registration
    permission_classes = [permissions.AllowAny]

# Returns the current user
class MeView(generics.RetrieveAPIView):
    serializer_class = MeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

# Returns profile and handles PUT request
class ProfileView(generics.RetrieveUpdateAPIView):
    """
    Current user's contact defaults (email + phone).
    Ensures a profile exists even for legacy users.
    """
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    # Another ensurement that every user has profile
    def get_object(self):
        profile, _ = UserProfile.objects.get_or_create(user=self.request.user)
        return profile
