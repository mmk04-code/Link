from django.urls import path
from .views import RegisterView, UserListView, UserDetailView

urlpatterns = [
    path('register/', RegisterView.as_view()),
    path('', UserListView.as_view()),
    path('<int:pk>/', UserDetailView.as_view()),
]
