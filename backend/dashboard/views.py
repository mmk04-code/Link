from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.db.models import Sum, Count, Q, Avg
from projects.models import Project
from proposals.models import Proposal
from contracts.models import Contract
from reviews.models import Review
from messaging.models import Message
from proposals.models import FreelancerBehaviorReport, FreelancerReportMessage

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
from users.models import VerificationRequest
from .models import SupportTicket, SupportTicketMessage
from notifications.models import Notification

User = get_user_model()


def _shift_month(anchor_dt, months_delta):
    month_index = (anchor_dt.month - 1) + months_delta
    year = anchor_dt.year + (month_index // 12)
    month = (month_index % 12) + 1
    return anchor_dt.replace(year=year, month=month, day=1)


def _build_weekly_trends(now_dt, weeks):
    points = []
    for i in range(weeks - 1, -1, -1):
        window_end = now_dt - timedelta(days=7 * i)
        window_start = window_end - timedelta(days=7)
        points.append({
            'label': window_end.strftime('%d %b'),
            'users': User.objects.filter(date_joined__gte=window_start, date_joined__lt=window_end).count(),
            'projects': Project.objects.filter(created_at__gte=window_start, created_at__lt=window_end).count(),
            'contracts': Contract.objects.filter(created_at__gte=window_start, created_at__lt=window_end).count(),
        })
    return points


def _build_monthly_trends(now_dt, months):
    month_start = now_dt.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    points = []
    for i in range(months - 1, -1, -1):
        window_start = _shift_month(month_start, -i)
        window_end = _shift_month(window_start, 1)
        points.append({
            'label': window_start.strftime('%b %Y'),
            'users': User.objects.filter(date_joined__gte=window_start, date_joined__lt=window_end).count(),
            'projects': Project.objects.filter(created_at__gte=window_start, created_at__lt=window_end).count(),
            'contracts': Contract.objects.filter(created_at__gte=window_start, created_at__lt=window_end).count(),
        })
    return points


def _profile_image_url(request, user):
    profile = getattr(user, 'profile', None)
    if not profile:
        return ''

    image_file = getattr(profile, 'profile_image', None)
    if image_file:
        try:
            return request.build_absolute_uri(image_file.url)
        except Exception:
            return image_file.url

    return (getattr(profile, 'profile_image_url', '') or '').strip()


def _user_report_details(request, user):
    profile = getattr(user, 'profile', None)
    return {
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'role': user.role,
        'is_verified': user.is_verified,
        'is_active': user.is_active,
        'full_name': (getattr(profile, 'full_name', '') or '').strip() if profile else '',
        'location': (getattr(profile, 'location', '') or '').strip() if profile else '',
        'company_name': (getattr(profile, 'company_name', '') or '').strip() if profile else '',
        'profile_image_url': _profile_image_url(request, user),
    }


def _ticket_message_payload(message):
    return {
        'id': message.id,
        'sender_id': message.sender_id,
        'sender_name': message.sender.username,
        'sender_role': message.sender.role,
        'is_admin_sender': bool(message.sender.is_staff),
        'message': message.message,
        'visible_to_reporter': message.visible_to_reporter,
        'created_at': message.created_at,
    }


def _freelancer_report_message_payload(message):
    return {
        'id': message.id,
        'sender_id': message.sender_id,
        'sender_name': message.sender.username,
        'sender_role': message.sender.role,
        'is_admin_sender': bool(message.sender.is_staff),
        'message': message.message,
        'visible_to_reporter': message.visible_to_reporter,
        'created_at': message.created_at,
    }


def _freelancer_report_payload(request, report, visible_messages=None):
    message_items = visible_messages if visible_messages is not None else report.messages.all()
    return {
        'id': report.id,
        'reporter_id': report.reporter_id,
        'reporter_name': report.reporter.username,
        'reporter': _user_report_details(request, report.reporter),
        'reported_user_id': report.reported_user_id,
        'reported_user_name': report.reported_user.username,
        'reported_user': _user_report_details(request, report.reported_user),
        'reason': report.reason,
        'details': report.details,
        'status': report.status,
        'action_note': report.action_note,
        'actioned_by_name': report.actioned_by.username if report.actioned_by else '',
        'actioned_at': report.actioned_at,
        'proposal_id': report.proposal_id,
        'proposal_cover_letter': report.proposal.cover_letter,
        'project_title': report.proposal.project.title,
        'project_id': report.proposal.project_id,
        'messages': [_freelancer_report_message_payload(m) for m in message_items],
        'created_at': report.created_at,
    }

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
        pending_verifications = VerificationRequest.objects.filter(status='pending', expires_at__gte=timezone.now()).count()
        pending_reports = FreelancerBehaviorReport.objects.filter(status='pending').count()
        pending_support_only = SupportTicket.objects.filter(status='pending').count()
        under_review_support_tickets = SupportTicket.objects.filter(status='under_review').count()
        pending_support_tickets = pending_support_only + under_review_support_tickets

        now = timezone.now()
        trend_sets = {
            '6w': _build_weekly_trends(now, 6),
            '12w': _build_weekly_trends(now, 12),
            '6m': _build_monthly_trends(now, 6),
        }

        important_reports_qs = FreelancerBehaviorReport.objects.filter(status='pending').select_related(
            'reporter', 'reporter__profile', 'reported_user', 'reported_user__profile', 'proposal', 'proposal__project'
        )[:10]
        important_reports = [
            {
                'id': r.id,
                'reason': r.reason,
                'details': r.details,
                'status': r.status,
                'reporter_name': r.reporter.username,
                'reported_user_name': r.reported_user.username,
                'reporter': _user_report_details(request, r.reporter),
                'reported_user': _user_report_details(request, r.reported_user),
                'proposal_id': r.proposal_id,
                'proposal_cover_letter': r.proposal.cover_letter,
                'project_title': r.proposal.project.title,
                'project_id': r.proposal.project_id,
                'created_at': r.created_at,
            }
            for r in important_reports_qs
        ]
        
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
            'verifications': {
                'pending': pending_verifications,
            },
            'reports': {
                'pending': pending_reports,
                'total': FreelancerBehaviorReport.objects.count(),
            },
            'support': {
                'pending': pending_support_tickets,
                'pending_only': pending_support_only,
                'under_review': under_review_support_tickets,
                'total': SupportTicket.objects.count(),
            },
            'important_reports': important_reports,
            'reviews': {
                'average_rating': round(avg_rating, 2),
                'total': Review.objects.count(),
            },
            'revenue': {
                'total': total_revenue,
            },
            'analytics': {
                'trend_sets': trend_sets,
            },
        })


class AdminProposalsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.is_staff:
            return Response({"error": "Admin access required"}, status=403)

        proposals_qs = Proposal.objects.select_related('freelancer', 'project', 'project__client').order_by('-created_at')
        status_filter = request.query_params.get('status')
        if status_filter and status_filter != 'all':
            proposals_qs = proposals_qs.filter(status=status_filter)

        proposals = []
        for proposal in proposals_qs:
            proposals.append({
                'id': proposal.id,
                'title': proposal.project.title,
                'freelancer': proposal.freelancer.username,
                'client': proposal.project.client.username,
                'bid_amount': proposal.bid_amount,
                'description': proposal.cover_letter,
                'status': proposal.status,
                'submitted_date': proposal.created_at,
            })

        return Response({
            'stats': {
                'total': Proposal.objects.count(),
                'accepted': Proposal.objects.filter(status='accepted').count(),
                'rejected': Proposal.objects.filter(status='rejected').count(),
                'pending': Proposal.objects.filter(status='pending').count(),
            },
            'results': proposals,
        })


class AdminProposalDecisionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, proposal_id):
        if not request.user.is_staff:
            return Response({"error": "Admin access required"}, status=403)

        decision = request.data.get('decision')
        if decision not in {'accepted', 'rejected', 'pending'}:
            return Response({"error": "Invalid decision"}, status=400)

        try:
            proposal = Proposal.objects.get(id=proposal_id)
        except Proposal.DoesNotExist:
            return Response({"error": "Proposal not found"}, status=404)

        proposal.status = decision
        proposal.save(update_fields=['status', 'updated_at'])
        return Response({
            'id': proposal.id,
            'status': proposal.status,
            'message': f'Proposal status updated to {proposal.status}',
        })


class AdminUsersView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.is_staff:
            return Response({"error": "Admin access required"}, status=403)

        users_qs = User.objects.all().order_by('-date_joined')

        role_filter = (request.query_params.get('role') or 'all').strip().lower()
        role_map = {
            'client': 'CLIENT',
            'freelancer': 'FREELANCER',
            'clients': 'CLIENT',
            'freelancers': 'FREELANCER',
            'all': None,
        }
        resolved_role = role_map.get(role_filter)
        if resolved_role:
            users_qs = users_qs.filter(role=resolved_role)

        search_query = (request.query_params.get('search') or '').strip()
        if search_query:
            users_qs = users_qs.filter(
                Q(username__icontains=search_query) | Q(email__icontains=search_query)
            )

        users = []
        for user in users_qs:
            users.append({
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'role': user.role,
                'is_verified': user.is_verified,
                'is_active': user.is_active,
                'joined_at': user.date_joined,
            })

        return Response({
            'stats': {
                'total': User.objects.count(),
                'clients': User.objects.filter(role='CLIENT').count(),
                'freelancers': User.objects.filter(role='FREELANCER').count(),
                'verified': User.objects.filter(is_verified=True).count(),
            },
            'results': users,
        })


class AdminUsersStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.is_staff:
            return Response({"error": "Admin access required"}, status=403)

        return Response({
            'total': User.objects.count(),
            'clients': User.objects.filter(role='CLIENT').count(),
            'freelancers': User.objects.filter(role='FREELANCER').count(),
            'verified': User.objects.filter(is_verified=True).count(),
        })


class AdminUserActionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, user_id):
        if not request.user.is_staff:
            return Response({"error": "Admin access required"}, status=403)

        action = (request.data.get('action') or '').strip().lower()
        if action != 'remove':
            return Response({'error': 'Action must be remove.'}, status=400)

        try:
            target_user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=404)

        if target_user.id == request.user.id:
            return Response({'error': 'Admin cannot remove their own account.'}, status=400)

        if target_user.is_staff:
            return Response({'error': 'Admin accounts cannot be removed from this action.'}, status=400)

        if target_user.role not in {'CLIENT', 'FREELANCER'}:
            return Response({'error': 'Only client and freelancer accounts can be removed.'}, status=400)

        if not target_user.is_active:
            return Response({
                'message': 'User is already inactive.',
                'id': target_user.id,
                'is_active': target_user.is_active,
            })

        target_user.is_active = False
        target_user.save(update_fields=['is_active'])

        return Response({
            'message': f'{target_user.username} has been removed (deactivated).',
            'id': target_user.id,
            'is_active': target_user.is_active,
        })


class AdminContractsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.is_staff:
            return Response({"error": "Admin access required"}, status=403)

        contracts_qs = Contract.objects.select_related('client', 'freelancer', 'proposal').order_by('-created_at')
        status_filter = request.query_params.get('status')
        if status_filter and status_filter != 'all':
            contracts_qs = contracts_qs.filter(status=status_filter)

        contracts = []
        for contract in contracts_qs:
            contracts.append({
                'id': contract.id,
                'title': contract.title,
                'client': contract.client.username,
                'freelancer': contract.freelancer.username,
                'budget': contract.budget,
                'status': contract.status,
                'created_at': contract.created_at,
            })

        return Response({
            'stats': {
                'total': Contract.objects.count(),
                'active': Contract.objects.filter(status='active').count(),
                'completed': Contract.objects.filter(status='completed').count(),
                'disputed': Contract.objects.filter(status='disputed').count(),
            },
            'results': contracts,
        })


class AdminReviewsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.is_staff:
            return Response({"error": "Admin access required"}, status=403)

        reviews_qs = Review.objects.select_related('reviewer', 'reviewee', 'contract').order_by('-created_at')
        visibility_filter = request.query_params.get('visibility')
        if visibility_filter == 'public':
            reviews_qs = reviews_qs.filter(is_public=True)
        elif visibility_filter == 'hidden':
            reviews_qs = reviews_qs.filter(is_public=False)

        reviews = []
        for review in reviews_qs:
            reviews.append({
                'id': review.id,
                'contract_title': review.contract.title,
                'reviewer': review.reviewer.username,
                'reviewee': review.reviewee.username,
                'overall_rating': review.overall_rating,
                'title': review.title,
                'comment': review.comment,
                'is_public': review.is_public,
                'flagged': review.flagged,
                'created_at': review.created_at,
            })

        return Response({
            'stats': {
                'total': Review.objects.count(),
                'public': Review.objects.filter(is_public=True).count(),
                'hidden': Review.objects.filter(is_public=False).count(),
                'flagged': Review.objects.filter(flagged=True).count(),
                'average_rating': round(Review.objects.aggregate(avg=Avg('overall_rating'))['avg'] or 0, 2),
            },
            'results': reviews,
        })


class AdminReviewActionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, review_id):
        if not request.user.is_staff:
            return Response({"error": "Admin access required"}, status=403)

        action_type = (request.data.get('action') or '').strip().lower()
        if action_type not in {'hide', 'show', 'flag', 'unflag'}:
            return Response(
                {"error": "Invalid action. Use hide, show, flag, or unflag."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        review = Review.objects.filter(id=review_id).first()
        if not review:
            return Response({"error": "Review not found"}, status=status.HTTP_404_NOT_FOUND)

        reason = (request.data.get('reason') or '').strip()

        if action_type == 'hide':
            review.is_public = False
            if reason:
                review.flag_reason = reason
        elif action_type == 'show':
            review.is_public = True
        elif action_type == 'flag':
            review.flagged = True
            review.flag_reason = reason or review.flag_reason or 'Flagged by admin'
        elif action_type == 'unflag':
            review.flagged = False
            review.flag_reason = reason

        review.save(update_fields=['is_public', 'flagged', 'flag_reason', 'updated_at'])

        return Response({
            'id': review.id,
            'is_public': review.is_public,
            'flagged': review.flagged,
            'flag_reason': review.flag_reason,
        })


class AdminMessagesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.is_staff:
            return Response({"error": "Admin access required"}, status=403)

        messages_qs = Message.objects.select_related('sender', 'receiver', 'contract').order_by('-created_at')

        contract_id = (request.query_params.get('contract_id') or '').strip()
        if contract_id:
            messages_qs = messages_qs.filter(contract_id=contract_id)

        search_query = (request.query_params.get('search') or '').strip()
        if search_query:
            messages_qs = messages_qs.filter(
                Q(content__icontains=search_query)
                | Q(sender__username__icontains=search_query)
                | Q(sender__email__icontains=search_query)
                | Q(receiver__username__icontains=search_query)
                | Q(receiver__email__icontains=search_query)
                | Q(contract__title__icontains=search_query)
            )

        results = []
        for message in messages_qs[:300]:
            results.append({
                'id': message.id,
                'contract_id': message.contract_id,
                'contract_title': message.contract.title,
                'sender_id': message.sender_id,
                'sender_name': message.sender.username,
                'receiver_id': message.receiver_id,
                'receiver_name': message.receiver.username,
                'content': message.content,
                'is_read': message.is_read,
                'created_at': message.created_at,
            })

        return Response({
            'stats': {
                'total': Message.objects.count(),
                'unread': Message.objects.filter(is_read=False).count(),
                'contracts_with_messages': Message.objects.values('contract_id').distinct().count(),
            },
            'results': results,
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


class AdminFreelancerReportActionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, report_id):
        if not request.user.is_staff:
            return Response({"error": "Admin access required"}, status=403)

        try:
            report = FreelancerBehaviorReport.objects.select_related('reported_user', 'reporter').get(id=report_id)
        except FreelancerBehaviorReport.DoesNotExist:
            return Response({'error': 'Report not found.'}, status=404)

        action = (request.data.get('action') or '').strip().lower()
        note = (request.data.get('note') or '').strip()

        if action not in {'warning', 'remove', 'dismiss'}:
            return Response({'error': 'Action must be warning, remove, or dismiss.'}, status=400)

        if action == 'warning':
            report.status = 'warning_issued'
        elif action == 'remove':
            report.status = 'user_removed'
            report.reported_user.is_active = False
            report.reported_user.save(update_fields=['is_active'])
        else:
            report.status = 'dismissed'

        report.action_note = note
        report.actioned_by = request.user
        report.actioned_at = timezone.now()
        report.save(update_fields=['status', 'action_note', 'actioned_by', 'actioned_at', 'updated_at'])

        if note:
            FreelancerReportMessage.objects.create(
                report=report,
                sender=request.user,
                message=note,
                visible_to_reporter=True,
            )

        # Notify the reported user when admin takes an action that impacts them.
        if action in {'warning', 'remove'}:
            Notification.objects.create(
                user=report.reported_user,
                type='system',
                title='Admin Action on Your Account',
                message=(
                    'An admin has issued a warning on your account based on a complaint.'
                    if action == 'warning'
                    else 'Your account has been hidden by admin after complaint review.'
                ),
                data={
                    'report_id': report.id,
                    'action': action,
                    'reason': report.reason,
                },
            )

        # Notify the reporter that admin has reviewed their complaint.
        Notification.objects.create(
            user=report.reporter,
            type='system',
            title='Complaint Reviewed by Admin',
            message=f"Your complaint has been reviewed. Current outcome: {report.status}.",
            data={
                'report_id': report.id,
                'status': report.status,
            },
        )

        return Response({'message': f'Report action applied: {action}', 'status': report.status})


class AdminFreelancerReportListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.is_staff:
            return Response({'error': 'Admin access required'}, status=403)

        status_filter = (request.query_params.get('status') or '').strip().lower()
        queryset = FreelancerBehaviorReport.objects.select_related(
            'reporter',
            'reporter__profile',
            'reported_user',
            'reported_user__profile',
            'proposal',
            'proposal__project',
            'actioned_by',
        ).prefetch_related('messages__sender').all()

        if status_filter and status_filter != 'all':
            queryset = queryset.filter(status=status_filter)

        return Response([_freelancer_report_payload(request, report) for report in queryset[:300]])


class FreelancerReportListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        status_filter = (request.query_params.get('status') or '').strip().lower()
        scope = (request.query_params.get('scope') or 'created').strip().lower()

        queryset = FreelancerBehaviorReport.objects.select_related(
            'reporter',
            'reporter__profile',
            'reported_user',
            'reported_user__profile',
            'proposal',
            'proposal__project',
            'actioned_by',
        ).prefetch_related('messages__sender')

        if scope == 'against_me':
            queryset = queryset.filter(reported_user=request.user)
        else:
            queryset = queryset.filter(reporter=request.user)

        if status_filter and status_filter != 'all':
            queryset = queryset.filter(status=status_filter)

        payload = []
        for report in queryset[:300]:
            if scope == 'against_me':
                visible_messages = report.messages.filter(Q(sender=request.user) | Q(sender__is_staff=True))
            else:
                visible_messages = report.messages.filter(visible_to_reporter=True)
            payload.append(_freelancer_report_payload(request, report, visible_messages=visible_messages))

        return Response(payload)


class FreelancerReportReplyView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, report_id):
        try:
            report = FreelancerBehaviorReport.objects.select_related('reporter', 'reported_user').get(id=report_id)
        except FreelancerBehaviorReport.DoesNotExist:
            return Response({'error': 'Report not found.'}, status=404)

        if report.reported_user_id != request.user.id:
            return Response({'error': 'Only the reported user can reply on this report.'}, status=403)

        message = (request.data.get('message') or '').strip()
        if not message:
            return Response({'error': 'Reply message is required.'}, status=400)

        send_to_reporter = bool(request.data.get('send_to_reporter', False))

        reply = FreelancerReportMessage.objects.create(
            report=report,
            sender=request.user,
            message=message,
            visible_to_reporter=send_to_reporter,
        )

        if send_to_reporter:
            Notification.objects.create(
                user=report.reporter,
                type='system',
                title='Reply Added on Your Proposal Report',
                message=f"{request.user.username} replied on report #{report.id}.",
                data={
                    'report_id': report.id,
                    'reply_id': reply.id,
                    'visible_to_reporter': True,
                },
            )

        return Response({
            'message': 'Reply submitted successfully.',
            'reply': _freelancer_report_message_payload(reply),
        }, status=201)


class SupportTicketListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        status_filter = (request.query_params.get('status') or '').strip().lower()
        scope = (request.query_params.get('scope') or 'created').strip().lower()

        if request.user.is_staff:
            queryset = SupportTicket.objects.select_related(
                'reporter', 'reporter__profile', 'reported_user', 'reported_user__profile', 'actioned_by'
            ).prefetch_related('messages__sender').all()
            if status_filter and status_filter != 'all':
                queryset = queryset.filter(status=status_filter)
        else:
            queryset = SupportTicket.objects.select_related(
                'reporter', 'reporter__profile', 'reported_user', 'reported_user__profile', 'actioned_by'
            ).prefetch_related('messages__sender')
            if scope == 'against_me':
                queryset = queryset.filter(reported_user=request.user)
            else:
                queryset = queryset.filter(reporter=request.user)

        data = []
        for t in queryset[:300]:
            if request.user.is_staff:
                visible_messages = t.messages.all()
            elif scope == 'against_me':
                visible_messages = t.messages.filter(Q(sender=request.user) | Q(sender__is_staff=True))
            else:
                visible_messages = t.messages.filter(visible_to_reporter=True)

            data.append({
                'id': t.id,
                'reporter_id': t.reporter_id,
                'reporter_name': t.reporter.username,
                'reporter': _user_report_details(request, t.reporter),
                'reported_user_id': t.reported_user_id,
                'reported_user_name': t.reported_user.username if t.reported_user else '',
                'reported_user': _user_report_details(request, t.reported_user) if t.reported_user else None,
                'target_role': t.target_role,
                'category': t.category,
                'subject': t.subject,
                'description': t.description,
                'status': t.status,
                'admin_note': t.admin_note,
                'messages': [_ticket_message_payload(m) for m in visible_messages],
                'actioned_by_name': t.actioned_by.username if t.actioned_by else '',
                'actioned_at': t.actioned_at,
                'created_at': t.created_at,
            })
        return Response(data)

    def post(self, request):
        user = request.user
        if getattr(user, 'role', '') not in {'CLIENT', 'FREELANCER'}:
            return Response({'error': 'Only clients and freelancers can create support tickets.'}, status=403)
        reporter_role = user.role
        expected_target_role = 'FREELANCER' if reporter_role == 'CLIENT' else 'CLIENT'

        category = (request.data.get('category') or '').strip().lower()
        subject = (request.data.get('subject') or '').strip()
        description = (request.data.get('description') or '').strip()
        reported_user_id = request.data.get('reported_user_id')
        reported_username = (request.data.get('reported_username') or '').strip()
        reported_email = (request.data.get('reported_email') or '').strip()

        if reported_user_id in (None, '') and not reported_username and not reported_email:
            return Response({'error': 'Provide reported username or reported email.'}, status=400)

        valid_categories = {choice[0] for choice in SupportTicket.CATEGORY_CHOICES}
        if category not in valid_categories:
            return Response({'error': 'Invalid support category.'}, status=400)

        if not subject:
            return Response({'error': 'Subject is required.'}, status=400)
        if not description:
            return Response({'error': 'Description is required.'}, status=400)

        try:
            if reported_user_id not in (None, ''):
                reported_user = User.objects.get(id=reported_user_id)
            else:
                lookup = Q()
                if reported_username:
                    lookup &= Q(username=reported_username)
                if reported_email:
                    lookup &= Q(email__iexact=reported_email)
                reported_user = User.objects.get(lookup)
        except User.DoesNotExist:
            return Response({'error': 'Reported user not found. Check username or email.'}, status=404)
        except User.MultipleObjectsReturned:
            return Response({'error': 'Multiple users matched. Provide both username and email.'}, status=400)

        if reported_user.id == user.id:
            return Response({'error': 'You cannot report yourself.'}, status=400)

        if reported_user.role not in {'CLIENT', 'FREELANCER'}:
            return Response({'error': 'Reported user must be a client or freelancer.'}, status=400)

        if reported_user.role != expected_target_role:
            return Response(
                {
                    'error': (
                        'Freelancers can report only clients.'
                        if reporter_role == 'FREELANCER'
                        else 'Clients can report only freelancers.'
                    )
                },
                status=400,
            )

        target_role = reported_user.role

        ticket = SupportTicket.objects.create(
            reporter=user,
            reported_user=reported_user,
            target_role=target_role,
            category=category,
            subject=subject,
            description=description,
            status='pending',
        )

        return Response({
            'id': ticket.id,
            'message': 'Support ticket submitted to admin successfully.',
            'status': ticket.status,
        }, status=201)


class AdminSupportTicketActionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, ticket_id):
        if not request.user.is_staff:
            return Response({'error': 'Admin access required'}, status=403)

        try:
            ticket = SupportTicket.objects.select_related('reported_user', 'reporter').get(id=ticket_id)
        except SupportTicket.DoesNotExist:
            return Response({'error': 'Support ticket not found.'}, status=404)

        action = (request.data.get('action') or '').strip().lower()
        note = (request.data.get('note') or '').strip()

        if action not in {'review', 'warning', 'hide', 'resolve', 'dismiss'}:
            return Response({'error': 'Action must be review, warning, hide, resolve, or dismiss.'}, status=400)

        if action in {'warning', 'hide'} and not ticket.reported_user:
            return Response({'error': 'Cannot apply warning/hide when no reported user is attached to this ticket.'}, status=400)

        if action == 'review':
            ticket.status = 'under_review'
        elif action == 'warning':
            ticket.status = 'warning_issued'
        elif action == 'hide':
            ticket.status = 'user_hidden'
            if ticket.reported_user:
                ticket.reported_user.is_active = False
                ticket.reported_user.save(update_fields=['is_active'])
        elif action == 'resolve':
            ticket.status = 'resolved'
        else:
            ticket.status = 'dismissed'

        ticket.admin_note = note
        ticket.actioned_by = request.user
        ticket.actioned_at = timezone.now()
        ticket.save(update_fields=['status', 'admin_note', 'actioned_by', 'actioned_at', 'updated_at'])

        # Notify reported user for direct account-impacting actions.
        if ticket.reported_user and action in {'warning', 'hide'}:
            Notification.objects.create(
                user=ticket.reported_user,
                type='system',
                title='Admin Action on Support Complaint',
                message=(
                    'Admin has issued a warning after reviewing a support complaint against your account.'
                    if action == 'warning'
                    else 'Your account has been hidden by admin after support complaint review.'
                ),
                data={
                    'ticket_id': ticket.id,
                    'action': action,
                    'category': ticket.category,
                },
            )

        # Notify reporter that admin has taken action.
        Notification.objects.create(
            user=ticket.reporter,
            type='system',
            title='Support Ticket Updated',
            message=f"Admin updated your support ticket status to: {ticket.status}.",
            data={
                'ticket_id': ticket.id,
                'status': ticket.status,
            },
        )

        return Response({'message': f'Support action applied: {action}', 'status': ticket.status})


class SupportTicketReplyView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, ticket_id):
        try:
            ticket = SupportTicket.objects.select_related('reporter', 'reported_user').get(id=ticket_id)
        except SupportTicket.DoesNotExist:
            return Response({'error': 'Support ticket not found.'}, status=404)

        if not ticket.reported_user or ticket.reported_user_id != request.user.id:
            return Response({'error': 'Only the reported user can reply on this ticket.'}, status=403)

        message = (request.data.get('message') or '').strip()
        if not message:
            return Response({'error': 'Reply message is required.'}, status=400)

        send_to_reporter = bool(request.data.get('send_to_reporter', False))

        reply = SupportTicketMessage.objects.create(
            ticket=ticket,
            sender=request.user,
            message=message,
            visible_to_reporter=send_to_reporter,
        )

        if send_to_reporter:
            Notification.objects.create(
                user=ticket.reporter,
                type='system',
                title='Reply Added on Your Support Ticket',
                message=f"{request.user.username} replied on ticket #{ticket.id}.",
                data={
                    'ticket_id': ticket.id,
                    'reply_id': reply.id,
                    'visible_to_reporter': True,
                },
            )

        return Response({
            'message': 'Reply submitted successfully.',
            'reply': _ticket_message_payload(reply),
        }, status=201)
