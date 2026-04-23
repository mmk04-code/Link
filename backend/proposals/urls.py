from django.urls import path
from .views import ProposalViewSet

proposal_list_view = ProposalViewSet.as_view({'get': 'list', 'post': 'create'})
proposal_create_view = ProposalViewSet.as_view({'post': 'create_proposal'})
proposal_detail_view = ProposalViewSet.as_view({'get': 'retrieve'})
proposal_received_view = ProposalViewSet.as_view({'get': 'received'})
proposal_my_view = ProposalViewSet.as_view({'get': 'my'})
proposal_accept_view = ProposalViewSet.as_view({'post': 'accept'})
proposal_reject_view = ProposalViewSet.as_view({'post': 'reject'})

urlpatterns = [
    path('', proposal_list_view),
    path('received/', proposal_received_view),
    path('my/', proposal_my_view),
    path('create/', proposal_create_view),
    path('<int:pk>/', proposal_detail_view),
    path('<int:pk>/accept/', proposal_accept_view),
    path('<int:pk>/reject/', proposal_reject_view),
]
