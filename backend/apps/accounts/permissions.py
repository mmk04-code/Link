from rest_framework import permissions


class IsVerifiedUser(permissions.BasePermission):
    message = 'Your account is not verified yet. Request admin verification to continue.'

    def has_permission(self, request, view):
        return request.user.is_authenticated and getattr(request.user, 'is_verified', False)

class IsClient(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'CLIENT'

class IsFreelancer(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'FREELANCER'
