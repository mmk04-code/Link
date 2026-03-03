from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from contracts.views import ContractViewSet
from messaging.views import MessageViewSet
from notifications.views import NotificationViewSet
from reviews.views import ReviewViewSet
# from users.admin_views import AdminContractViewSet, AdminReviewViewSet  # TEMPORARILY COMMENTED

router = DefaultRouter()
router.register(r'contracts', ContractViewSet, basename='contract')
router.register(r'messages', MessageViewSet, basename='message')
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'reviews', ReviewViewSet, basename='review')
# router.register(r'admin/contracts', AdminContractViewSet, basename='admin-contract')
# router.register(r'admin/reviews', AdminReviewViewSet, basename='admin-review')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/users/', include('users.urls')),
    path('api/projects/', include('projects.urls')),
    path('api/proposals/', include('proposals.urls')),
    path('api/', include(router.urls)),
]