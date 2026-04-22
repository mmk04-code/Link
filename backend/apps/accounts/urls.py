from django.urls import path
from .views import (
    RegisterView,
    UserListCreateView,
    UserDetailView,
    CurrentUserView,
    ProfileView,
    VerificationStatusView,
    VerificationRequestCreateView,
    VerificationRequestDecisionView,
    AdminVerificationRequestListView,
    AdminVerificationRequestDetailView,
)

urlpatterns = [
    path('register/', RegisterView.as_view()),
    path('', UserListCreateView.as_view()),
    path('<int:pk>/', UserDetailView.as_view()),
    path('me/', CurrentUserView.as_view()),  # Add this line
    path('profile/', ProfileView.as_view()),
    path('verification/status/', VerificationStatusView.as_view()),
    path('verification/request/', VerificationRequestCreateView.as_view()),
    path('verification/admin/requests/', AdminVerificationRequestListView.as_view()),
    path('verification/admin/requests/<int:request_id>/', AdminVerificationRequestDetailView.as_view()),
    path('verification/requests/<int:request_id>/decision/', VerificationRequestDecisionView.as_view()),
]