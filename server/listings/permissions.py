from rest_framework import permissions

class IsSellerOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        # SAFE methods are read-only
        if request.method in permissions.SAFE_METHODS:
            return True
        # Both 'private' and 'dealer' can create/edit their listings
        u = request.user
        return u.is_authenticated and getattr(u, "role", None) in ("private", "dealer")

class IsOwnerOrAdmin(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        u = request.user
        return (u.is_authenticated and (obj.seller_id == u.id or u.is_staff or u.is_superuser))
