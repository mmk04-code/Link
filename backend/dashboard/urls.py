from django.urls import path
from .views import (
    ClientDashboardView, 
    ClientProjectsView, 
    ClientProposalsView,
    FreelancerDashboardView,
    FreelancerProposalsView,
    FreelancerContractsView,
    AdminDashboardView, AdminVerificationsView, AdminClientsDemandView,
    AdminDisputedContractsView
)

urlpatterns = [
    path('client/', ClientDashboardView.as_view(), name='client-dashboard'),
    path('client/projects/', ClientProjectsView.as_view(), name='client-projects'),
    path('client/proposals/', ClientProposalsView.as_view(), name='client-proposals'),
    
    path('freelancer/', FreelancerDashboardView.as_view(), name='freelancer-dashboard'),
    path('freelancer/proposals/', FreelancerProposalsView.as_view(), name='freelancer-proposals'),
    path('freelancer/contracts/', FreelancerContractsView.as_view(), name='freelancer-contracts'),
    
    # Admin URLs
    path('admin/', AdminDashboardView.as_view(), name='admin-dashboard'),
    path('admin/verifications/', AdminVerificationsView.as_view(), name='admin-verifications'),
    path('admin/clients/demand/', AdminClientsDemandView.as_view(), name='admin-demand'),
    path('admin/contracts/disputed/', AdminDisputedContractsView.as_view(), name='admin-disputed'),
]
