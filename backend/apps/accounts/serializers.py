from rest_framework import serializers
from django.db import transaction
from django.db.models import Q
from .models import User, Profile, VerificationRequest

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'role']

    def validate_username(self, value):
        if User.objects.filter(username__iexact=value, is_active=True).exists():
            raise serializers.ValidationError('A user with that username already exists.')
        return value

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value, is_active=True).exists():
            raise serializers.ValidationError('A user with that email already exists.')
        return value

    def _archived_username(self, user_id):
        base = f"deleted_user_{user_id}"
        candidate = base
        suffix = 1
        while User.objects.filter(username__iexact=candidate).exists():
            candidate = f"{base}_{suffix}"
            suffix += 1
        return candidate

    def _archived_email(self, user_id):
        base = f"deleted+{user_id}@talentlink.local"
        candidate = base
        suffix = 1
        while User.objects.filter(email__iexact=candidate).exists():
            candidate = f"deleted+{user_id}_{suffix}@talentlink.local"
            suffix += 1
        return candidate

    def _release_inactive_conflicts(self, username, email):
        inactive_conflicts = User.objects.select_for_update().filter(
            is_active=False,
        ).filter(
            Q(username__iexact=username) | Q(email__iexact=email)
        )

        for existing in inactive_conflicts:
            updates = {}
            if (existing.username or '').lower() == username.lower():
                updates['username'] = self._archived_username(existing.id)
            if (existing.email or '').lower() == email.lower():
                updates['email'] = self._archived_email(existing.id)

            if updates:
                for key, value in updates.items():
                    setattr(existing, key, value)
                existing.save(update_fields=list(updates.keys()))

    def create(self, validated_data):
        with transaction.atomic():
            self._release_inactive_conflicts(validated_data['username'], validated_data['email'])

            user = User.objects.create_user(
                username=validated_data['username'],
                email=validated_data['email'],
                password=validated_data['password'],
                role=validated_data['role']
            )
            Profile.objects.create(
                user=user,
                full_name=validated_data['username']
            )
            return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'is_verified']


class VerificationRequestSerializer(serializers.ModelSerializer):
    remaining_seconds = serializers.SerializerMethodField()

    class Meta:
        model = VerificationRequest
        fields = ['id', 'status', 'requested_at', 'expires_at', 'remaining_seconds']

    def get_remaining_seconds(self, obj):
        from django.utils import timezone
        delta = int((obj.expires_at - timezone.now()).total_seconds())
        return max(delta, 0)


class VerificationUserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = [
            'full_name',
            'bio',
            'skills',
            'location',
            'profile_image_url',
            'github_url',
            'linkedin_url',
            'company_name',
            'company_website',
            'company_description',
            'company_social_links',
        ]


class AdminVerificationRequestSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    role = serializers.CharField(source='user.role', read_only=True)
    is_user_verified = serializers.BooleanField(source='user.is_verified', read_only=True)
    profile = serializers.SerializerMethodField()
    remaining_seconds = serializers.SerializerMethodField()

    class Meta:
        model = VerificationRequest
        fields = [
            'id',
            'status',
            'requested_at',
            'expires_at',
            'reviewed_at',
            'user_id',
            'user_email',
            'username',
            'role',
            'is_user_verified',
            'remaining_seconds',
            'profile',
        ]

    def get_profile(self, obj):
        profile = Profile.objects.filter(user=obj.user).first()
        if not profile:
            return None
        return VerificationUserProfileSerializer(profile, context=self.context).data

    def get_remaining_seconds(self, obj):
        from django.utils import timezone
        delta = int((obj.expires_at - timezone.now()).total_seconds())
        return max(delta, 0)

class ProfileSerializer(serializers.ModelSerializer):
    profile_image = serializers.FileField(required=False, allow_null=True)

    class Meta:
        model = Profile
        fields = [
            'id',
            'full_name',
            'bio',
            'skills',
            'location',
            'profile_image',
            'profile_image_url',
            'github_url',
            'linkedin_url',
            'company_name',
            'company_logo_url',
            'company_website',
            'company_description',
            'company_social_links',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        if instance.profile_image:
            image_url = instance.profile_image.url
            data['profile_image'] = request.build_absolute_uri(image_url) if request else image_url
        return data
