from django.urls import path
from .views import (
    ClientDashboardView, 
    ClientProjectsView, 
    ClientProposalsView,
    FreelancerDashboardView,
    FreelancerProposalsView,
    FreelancerContractsView,
    AdminDashboardView, AdminVerificationsView, AdminClientsDemandView,
    AdminDisputedContractsView, AdminFreelancerReportActionView,
    SupportTicketListCreateView, AdminSupportTicketActionView,
    AdminFreelancerReportListView, SupportTicketReplyView,
    FreelancerReportListView, FreelancerReportReplyView
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
    path('admin/reports/', AdminFreelancerReportListView.as_view(), name='admin-report-list'),
    path('admin/reports/<int:report_id>/action/', AdminFreelancerReportActionView.as_view(), name='admin-report-action'),
    path('reports/', FreelancerReportListView.as_view(), name='report-list'),
    path('reports/<int:report_id>/reply/', FreelancerReportReplyView.as_view(), name='report-reply'),
    path('support/tickets/', SupportTicketListCreateView.as_view(), name='support-ticket-list-create'),
    path('support/tickets/<int:ticket_id>/reply/', SupportTicketReplyView.as_view(), name='support-ticket-reply'),
    path('admin/support/<int:ticket_id>/action/', AdminSupportTicketActionView.as_view(), name='admin-support-ticket-action'),
]
