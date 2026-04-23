from django.contrib import admin

from .models import Profile, User, VerificationRequest


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('id', 'email', 'username', 'role', 'is_verified', 'is_staff', 'is_active')
    list_filter = ('role', 'is_verified', 'is_staff', 'is_active')
    search_fields = ('email', 'username')


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'full_name', 'location', 'created_at')
    search_fields = ('full_name', 'user__email', 'user__username')


@admin.register(VerificationRequest)
class VerificationRequestAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'status', 'requested_at', 'reviewed_at')
    list_filter = ('status',)
    search_fields = ('user__email',)