from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count, Q, Avg
from projects.models import Project
from proposals.models import Proposal
from contracts.models import Contract
from reviews.models import Review

class ClientDashboardView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        if request.user.role != 'CLIENT':
            return Response({"error": "Only clients can access this"}, status=403)
            
        user = request.user
        
        # Overview stats
        active_projects = Project.objects.filter(
            client=user, 
            status='open'
        ).count()
        
        proposals_received = Proposal.objects.filter(
            project__client=user
        ).count()
        
        active_contracts = Contract.objects.filter(
            client=user, 
            status='active'
        ).count()
        
        completed_contracts = Contract.objects.filter(
            client=user, 
            status='completed'
        )
        
        total_spent = completed_contracts.aggregate(
            total=Sum('budget')
        )['total'] or 0
        
        return Response({
            'active_projects': active_projects,
            'proposals_received': proposals_received,
            'active_contracts': active_contracts,
            'total_spent': total_spent,
            'completed_count': completed_contracts.count(),
        })

class ClientProjectsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        if request.user.role != 'CLIENT':
            return Response({"error": "Only clients can access this"}, status=403)
            
        user = request.user
        projects = Project.objects.filter(client=user).order_by('-created_at')
        
        data = []
        for project in projects:
            data.append({
                'id': project.id,
                'title': project.title,
                'status': project.status,
                'budget': project.budget_max,  # adjusted max_budget assuming original model
                'proposals_count': project.proposals.count(),
                'created_at': project.created_at,
            })
        
        return Response(data)

class ClientProposalsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        if request.user.role != 'CLIENT':
            return Response({"error": "Only clients can access this"}, status=403)
            
        user = request.user
        proposals = Proposal.objects.filter(
            project__client=user
        ).select_related('freelancer', 'project').order_by('-created_at')
        
        data = []
        for proposal in proposals:
            data.append({
                'id': proposal.id,
                'project_title': proposal.project.title,
                'freelancer_name': proposal.freelancer.username,
                'bid_amount': proposal.bid_amount,
                'status': proposal.status,
                'created_at': proposal.created_at,
            })
        
        return Response(data)

class FreelancerDashboardView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        if request.user.role != 'FREELANCER':
            return Response({"error": "Only freelancers can access this"}, status=403)
            
        user = request.user
        
        # Overview stats
        applied_proposals = Proposal.objects.filter(
            freelancer=user
        ).count()
        
        active_contracts = Contract.objects.filter(
            freelancer=user, 
            status='active'
        ).count()
        
        completed_contracts = Contract.objects.filter(
            freelancer=user, 
            status='completed'
        )
        
        total_earned = completed_contracts.aggregate(
            total=Sum('budget')
        )['total'] or 0
        
        # Average rating from reviews
        avg_rating = Review.objects.filter(
            reviewee=user
        ).aggregate(avg=Avg('overall_rating'))['avg'] or 0
        
        return Response({
            'applied_proposals': applied_proposals,
            'active_contracts': active_contracts,
            'total_earned': total_earned,
            'completed_count': completed_contracts.count(),
            'average_rating': round(avg_rating, 2),
        })

class FreelancerProposalsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        if request.user.role != 'FREELANCER':
            return Response({"error": "Only freelancers can access this"}, status=403)
            
        user = request.user
        proposals = Proposal.objects.filter(
            freelancer=user
        ).select_related('project', 'project__client').order_by('-created_at')
        
        data = []
        for proposal in proposals:
            data.append({
                'id': proposal.id,
                'project_title': proposal.project.title,
                'client_name': proposal.project.client.username,
                'bid_amount': proposal.bid_amount,
                'status': proposal.status,
                'created_at': proposal.created_at,
            })
        
        return Response(data)

class FreelancerContractsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        if request.user.role != 'FREELANCER':
            return Response({"error": "Only freelancers can access this"}, status=403)
            
        user = request.user
        contracts = Contract.objects.filter(
            freelancer=user
        ).select_related('client').order_by('-created_at')
        
        data = []
        for contract in contracts:
            data.append({
                'id': contract.id,
                'title': contract.title,
                'client_name': contract.client.username,
                'budget': contract.budget,
                'status': contract.status,
                'created_at': contract.created_at,
                'has_review': contract.reviews.exists() if hasattr(contract, 'reviews') else False,
            })
        
        return Response(data)
from django.contrib.auth import get_user_model
from django.db.models import Count, Q, Avg, Sum, F
from datetime import timedelta
from django.utils import timezone

User = get_user_model()

class AdminDashboardView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        if not request.user.is_staff:
            return Response({"error": "Admin access required"}, status=403)
        
        # Platform stats
        total_users = User.objects.count()
        total_clients = User.objects.filter(role='CLIENT').count()
        total_freelancers = User.objects.filter(role='FREELANCER').count()
        
        total_projects = Project.objects.count()
        open_projects = Project.objects.filter(status='open').count()
        
        total_contracts = Contract.objects.count()
        active_contracts = Contract.objects.filter(status='active').count()
        completed_contracts = Contract.objects.filter(status='completed').count()
        
        # Average rating across all reviews
        avg_rating = Review.objects.aggregate(avg=Avg('overall_rating'))['avg'] or 0
        
        # Total platform revenue (sum of completed contracts)
        total_revenue = Contract.objects.filter(
            status='completed'
        ).aggregate(total=Sum('budget'))['total'] or 0
        
        # Recent activity (last 7 days)
        week_ago = timezone.now() - timedelta(days=7)
        new_users_week = User.objects.filter(date_joined__gte=week_ago).count()
        new_projects_week = Project.objects.filter(created_at__gte=week_ago).count()
        new_contracts_week = Contract.objects.filter(created_at__gte=week_ago).count()
        
        return Response({
            'users': {
                'total': total_users,
                'clients': total_clients,
                'freelancers': total_freelancers,
                'new_this_week': new_users_week,
            },
            'projects': {
                'total': total_projects,
                'open': open_projects,
                'new_this_week': new_projects_week,
            },
            'contracts': {
                'total': total_contracts,
                'active': active_contracts,
                'completed': completed_contracts,
                'new_this_week': new_contracts_week,
            },
            'reviews': {
                'average_rating': round(avg_rating, 2),
                'total': Review.objects.count(),
            },
            'revenue': {
                'total': total_revenue,
            }
        })

class AdminVerificationsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        if not request.user.is_staff:
            return Response({"error": "Admin access required"}, status=403)
        
        # Pending verifications (users with is_verified=False)
        pending_clients = User.objects.filter(
            role='CLIENT', 
            is_verified=False
        ).values('id', 'username', 'email', 'date_joined')
        
        pending_freelancers = User.objects.filter(
            role='FREELANCER', 
            is_verified=False
        ).values('id', 'username', 'email', 'date_joined')
        
        return Response({
            'pending_clients': list(pending_clients),
            'pending_freelancers': list(pending_freelancers),
            'total_pending': pending_clients.count() + pending_freelancers.count(),
        })

class AdminClientsDemandView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        if not request.user.is_staff:
            return Response({"error": "Admin access required"}, status=403)
        
        # Clients ranked by number of projects and proposals received
        clients = User.objects.filter(role='CLIENT').annotate(
            project_count=Count('client_projects'),
            proposal_count=Count('client_projects__proposals'),
            contract_count=Count('client_contracts')
        ).order_by('-proposal_count').values(
            'id', 'username', 'email', 
            'project_count', 'proposal_count', 'contract_count'
        )[:10]  # Top 10
        
        return Response({
            'high_demand_clients': list(clients),
            'total_clients': User.objects.filter(role='CLIENT').count(),
        })

class AdminDisputedContractsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        if not request.user.is_staff:
            return Response({"error": "Admin access required"}, status=403)
        
        # Contracts with issues (disputed, inactive for long)
        disputed = Contract.objects.filter(
            status='disputed'
        ).select_related('client', 'freelancer').order_by('-updated_at')
        
        # Contracts inactive for > 30 days
        month_ago = timezone.now() - timedelta(days=30)
        inactive = Contract.objects.filter(
            status='active',
            updated_at__lt=month_ago
        ).select_related('client', 'freelancer')
        
        disputed_data = []
        for contract in disputed:
            disputed_data.append({
                'id': contract.id,
                'title': contract.title,
                'client': contract.client.username,
                'freelancer': contract.freelancer.username,
                'budget': contract.budget,
                'created_at': contract.created_at,
                'updated_at': contract.updated_at,
            })
        
        inactive_data = []
        for contract in inactive:
            inactive_data.append({
                'id': contract.id,
                'title': contract.title,
                'client': contract.client.username,
                'freelancer': contract.freelancer.username,
                'budget': contract.budget,
                'days_inactive': (timezone.now() - contract.updated_at).days,
            })
        
        return Response({
            'disputed_contracts': disputed_data,
            'inactive_contracts': inactive_data,
            'total_issues': len(disputed_data) + len(inactive_data),
        })
