from django.urls import path
from .views import RegisterView, UserListCreateView, UserDetailView, CurrentUserView

urlpatterns = [
    path('register/', RegisterView.as_view()),
    path('', UserListCreateView.as_view()),
    path('<int:pk>/', UserDetailView.as_view()),
    path('me/', CurrentUserView.as_view()),  # Add this line
]