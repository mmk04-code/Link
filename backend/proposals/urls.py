from django.urls import path
from .views import ProposalCreateView, ProposalListView, ProposalDetailView

urlpatterns = [
    path('', ProposalListView.as_view()),
    path('create/', ProposalCreateView.as_view()),
    path('<int:pk>/', ProposalDetailView.as_view()),
]
