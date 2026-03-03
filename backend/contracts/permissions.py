from rest_framework import permissions

class IsClientOrFreelancer(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return request.user in [obj.client, obj.freelancer]

class IsOwner(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.user == request.user