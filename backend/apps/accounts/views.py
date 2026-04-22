from rest_framework import generics, permissions
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from datetime import timedelta

from .models import User, Profile, VerificationRequest
from .serializers import (
    UserSerializer,
    RegisterSerializer,
    ProfileSerializer,
    VerificationRequestSerializer,
    AdminVerificationRequestSerializer,
)


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class UserListCreateView(generics.ListCreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]  # Changed from AllowAny


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]


class CurrentUserView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = ProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_object(self):
        profile, _ = Profile.objects.get_or_create(
            user=self.request.user,
            defaults={'full_name': self.request.user.username}
        )
        return profile


class VerificationStatusView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        now = timezone.now()
        VerificationRequest.objects.filter(
            user=request.user,
            status='pending',
            expires_at__lt=now,
        ).update(status='expired')

        active_req = VerificationRequest.objects.filter(
            user=request.user,
            status='pending',
            expires_at__gte=now,
        ).order_by('-requested_at').first()

        payload = {
            'is_verified': bool(request.user.is_verified),
            'has_pending_request': bool(active_req),
            'request': VerificationRequestSerializer(active_req).data if active_req else None,
        }
        return Response(payload)


class VerificationRequestCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if request.user.is_verified:
            return Response({'detail': 'Your account is already verified.'}, status=status.HTTP_200_OK)

        now = timezone.now()
        VerificationRequest.objects.filter(
            user=request.user,
            status='pending',
            expires_at__lt=now,
        ).update(status='expired')

        existing = VerificationRequest.objects.filter(
            user=request.user,
            status='pending',
            expires_at__gte=now,
        ).order_by('-requested_at').first()

        if existing:
            return Response({
                'detail': 'Verification request already pending.',
                'request': VerificationRequestSerializer(existing).data,
            }, status=status.HTTP_200_OK)

        req = VerificationRequest.objects.create(
            user=request.user,
            expires_at=now + timedelta(minutes=20),
        )
        return Response({
            'detail': 'Verification request submitted.',
            'request': VerificationRequestSerializer(req).data,
        }, status=status.HTTP_201_CREATED)


class VerificationRequestDecisionView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, request_id):
        decision = (request.data.get('decision') or '').strip().lower()
        if decision not in {'approve', 'reject'}:
            return Response({'detail': 'Decision must be approve or reject.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            verification_req = VerificationRequest.objects.select_related('user').get(id=request_id)
        except VerificationRequest.DoesNotExist:
            return Response({'detail': 'Verification request not found.'}, status=status.HTTP_404_NOT_FOUND)

        if verification_req.status != 'pending':
            return Response({'detail': f'Request already {verification_req.status}.'}, status=status.HTTP_400_BAD_REQUEST)

        verification_req.status = 'approved' if decision == 'approve' else 'rejected'
        verification_req.reviewed_by = request.user
        verification_req.reviewed_at = timezone.now()
        verification_req.save(update_fields=['status', 'reviewed_by', 'reviewed_at'])

        if decision == 'approve':
            verification_req.user.is_verified = True
            verification_req.user.save(update_fields=['is_verified'])

        return Response({
            'detail': f'Verification request {verification_req.status}.',
            'request': VerificationRequestSerializer(verification_req).data,
        })


class AdminVerificationRequestListView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        status_filter = (request.query_params.get('status') or 'pending').strip().lower()

        now = timezone.now()
        VerificationRequest.objects.filter(
            status='pending',
            expires_at__lt=now,
        ).update(status='expired')

        queryset = VerificationRequest.objects.select_related('user').all().order_by('-requested_at')
        if status_filter in {'pending', 'approved', 'rejected', 'expired'}:
            queryset = queryset.filter(status=status_filter)

        serializer = AdminVerificationRequestSerializer(queryset, many=True)
        return Response({'results': serializer.data})


class AdminVerificationRequestDetailView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request, request_id):
        now = timezone.now()
        VerificationRequest.objects.filter(
            status='pending',
            expires_at__lt=now,
        ).update(status='expired')

        try:
            verification_req = VerificationRequest.objects.select_related('user').get(id=request_id)
        except VerificationRequest.DoesNotExist:
            return Response({'detail': 'Verification request not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = AdminVerificationRequestSerializer(verification_req)
        return Response(serializer.data)
