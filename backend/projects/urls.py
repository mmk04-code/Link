from django.urls import path
from .views import ProjectListCreateView, ProjectDetailView, MyProjectListView

urlpatterns = [
    path('', ProjectListCreateView.as_view()),
    path('my/', MyProjectListView.as_view()),
    path('<int:pk>/', ProjectDetailView.as_view()),
]
