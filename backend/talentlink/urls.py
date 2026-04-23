from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from contracts.views import ContractViewSet
from messaging.views import MessageViewSet
from notifications.views import NotificationViewSet
from reviews.views import ReviewViewSet
from proposals.views import ProposalViewSet
from dashboard.views import (
    AdminContractsView,
    AdminDashboardView,
    AdminMessagesView,
    AdminProposalDecisionView,
    AdminProposalsView,
    AdminReviewActionView,
    AdminReviewsView,
    AdminUsersView,
    AdminUserActionView,
    AdminUsersStatsView,
)
from talentlink.views import IntroPageView
# from users.admin_views import AdminContractViewSet, AdminReviewViewSet  # TEMPORARILY COMMENTED

router = DefaultRouter()
router.register(r'contracts', ContractViewSet, basename='contract')
router.register(r'messages', MessageViewSet, basename='message')
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'reviews', ReviewViewSet, basename='review')
router.register(r'proposals', ProposalViewSet, basename='proposal')
# router.register(r'admin/contracts', AdminContractViewSet, basename='admin-contract')
# router.register(r'admin/reviews', AdminReviewViewSet, basename='admin-review')

urlpatterns = [
    path('', IntroPageView.as_view(), name='intro'),
    path('admin/', admin.site.urls),
    path('api/admin/dashboard/', AdminDashboardView.as_view(), name='admin-dashboard'),
    path('api/admin/proposals/', AdminProposalsView.as_view(), name='admin-proposals'),
    path('api/admin/proposals/<int:proposal_id>/decision/', AdminProposalDecisionView.as_view(), name='admin-proposal-decision'),
    path('api/admin/users/', AdminUsersView.as_view(), name='admin-users'),
    path('api/admin/users/<int:user_id>/action/', AdminUserActionView.as_view(), name='admin-user-action'),
    path('api/admin/users/stats/', AdminUsersStatsView.as_view(), name='admin-users-stats'),
    path('api/admin/contracts/', AdminContractsView.as_view(), name='admin-contracts'),
    path('api/admin/reviews/', AdminReviewsView.as_view(), name='admin-reviews'),
    path('api/admin/reviews/<int:review_id>/action/', AdminReviewActionView.as_view(), name='admin-review-action'),
    path('api/admin/messages/', AdminMessagesView.as_view(), name='admin-messages'),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/users/', include('users.urls')),
    path('api/projects/', include('projects.urls')),
    path('api/dashboard/', include('dashboard.urls')),
    path('api/', include(router.urls)),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)