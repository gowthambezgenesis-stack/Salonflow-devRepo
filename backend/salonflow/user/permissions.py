from rest_framework import permissions


class IsOwner(permissions.BasePermission):
    message = "Only salon owners can perform this action."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return getattr(request.user, 'role', None) == 'owner'


class IsCustomer(permissions.BasePermission):
    message = "Only customers can perform this action."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return getattr(request.user, 'role', None) == 'customer'


class IsOwnerOrReadOnly(permissions.BasePermission):
    message = "Only salon owners can modify this resource."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.method in permissions.SAFE_METHODS:
            return True

        return getattr(request.user, 'role', None) == 'owner'

