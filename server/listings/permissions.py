from rest_framework import permissions

class IsSellerOrReadOnly(permissions.BasePermission):
    # This methos is called for every request to the view set
    def has_permission(self, request, view):
        # if the method is safe (GET/HEAD/OPTIONS), the access if allowed
        if request.method in permissions.SAFE_METHODS:
            return True
        # Both 'private' and 'dealer' can create/edit their listings
        # if the method is not safe, it allows only the users with the specific role
        u = request.user
        return u.is_authenticated and getattr(u, "role", None) in ("private", "dealer")

class IsOwnerOrAdmin(permissions.BasePermission):
    # Listing operations handling
    def has_object_permission(self, request, view, obj):
        # This methos is called for every request to the view set
        if request.method in permissions.SAFE_METHODS:
            return True
        # Check if the user is logged in and if it is owner of the object or staff
        u = request.user
        return (u.is_authenticated and (obj.seller_id == u.id or u.is_staff or u.is_superuser))
