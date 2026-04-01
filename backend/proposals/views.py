from rest_framework import viewsets, permissions
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Avg, Count, Q
from django.utils import timezone
from decimal import Decimal, InvalidOperation
from contracts.models import Contract
from projects.models import Project
from reviews.models import Review
from datetime import timedelta
from .models import Proposal, FreelancerBehaviorReport
from .serializers import ProposalSerializer

class ProposalViewSet(viewsets.ModelViewSet):
    queryset = Proposal.objects.all()
    serializer_class = ProposalSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(freelancer=self.request.user)

    def _profile_display_name(self, user):
        profile = getattr(user, 'profile', None)
        full_name = (getattr(profile, 'full_name', '') or '').strip() if profile else ''
        return full_name or user.username

    def _profile_image_url(self, user):
        profile = getattr(user, 'profile', None)
        if not profile:
            return ''

        if getattr(profile, 'profile_image', None):
            try:
                return self.request.build_absolute_uri(profile.profile_image.url)
            except Exception:
                return profile.profile_image.url

        return (getattr(profile, 'profile_image_url', '') or '').strip()

    def _build_reputation_snapshot(self, reviewee_id, reviewer_role=None, limit=3):
        reviews_qs = Review.objects.filter(reviewee_id=reviewee_id, flagged=False)
        if reviewer_role:
            reviews_qs = reviews_qs.filter(reviewer__role=reviewer_role)

        totals = reviews_qs.aggregate(
            avg_overall=Avg('overall_rating'),
            total_reviews=Count('id'),
            recommend_count=Count('id', filter=Q(would_recommend=True)),
        )
        total_reviews = int(totals.get('total_reviews') or 0)
        recommend_count = int(totals.get('recommend_count') or 0)
        recommendation_rate = round((recommend_count / total_reviews) * 100, 1) if total_reviews else 0.0

        recent_reviews = []
        for review in reviews_qs.select_related('reviewer', 'contract')[:limit]:
            recent_reviews.append({
                'id': review.id,
                'reviewer_name': self._profile_display_name(review.reviewer),
                'contract_title': review.contract.title,
                'rating': round(float(review.overall_rating or 0), 1),
                'title': review.title,
                'comment': (review.comment or '')[:220],
                'created_at': review.created_at,
            })

        return {
            'average_rating': round(float(totals.get('avg_overall') or 0), 2),
            'total_reviews': total_reviews,
            'recommendation_rate': recommendation_rate,
            'recent_reviews': recent_reviews,
        }

    def _validate_create(self, request):
        if getattr(request.user, 'role', '') != 'FREELANCER':
            return None, Response({'error': 'Only freelancers can submit proposals.'}, status=status.HTTP_403_FORBIDDEN)

        if not getattr(request.user, 'is_verified', False):
            return None, Response({'error': 'Your account is not verified yet. Request admin verification to submit proposals.'}, status=status.HTTP_403_FORBIDDEN)

        project_id = request.data.get('project')
        if not project_id:
            return None, Response({'error': 'Project is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            project = Project.objects.get(id=project_id)
        except Project.DoesNotExist:
            return None, Response({'error': 'Project not found.'}, status=status.HTTP_404_NOT_FOUND)

        if project.status != 'open':
            return None, Response(
                {'error': 'This project is no longer accepting proposals'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if Proposal.objects.filter(project=project, status='accepted').exists():
            return None, Response(
                {'error': 'A proposal has already been accepted for this project'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if getattr(project, 'deadline_type', 'flexible') == 'fixed':
            submission_deadline = getattr(project, 'submission_deadline', None)
            if submission_deadline and submission_deadline < timezone.localdate():
                return None, Response(
                    {'error': 'The submission deadline has passed for this project'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        if project.client_id == request.user.id:
            return None, Response(
                {'error': 'You cannot apply to your own project.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if Proposal.objects.filter(project=project, freelancer=request.user).exists():
            return None, Response(
                {'error': 'You have already applied to this project'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        max_proposals = getattr(project, 'max_proposals', 50)
        proposals_count = Proposal.objects.filter(project=project).count()
        if proposals_count >= max_proposals:
            return None, Response(
                {'error': 'This project is no longer accepting proposals'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return project, None

    def _build_contract_payload(self, proposal, request):
        budget = request.data.get('budget', proposal.bid_amount)
        start_date = timezone.localdate()
        end_date = request.data.get('end_date')
        duration_days = request.data.get('duration_days')

        has_end_date = end_date not in (None, '')
        has_duration = duration_days not in (None, '')

        if has_end_date and has_duration:
            raise ValueError('Choose either end date or duration days, not both.')

        if not has_end_date and not has_duration:
            raise ValueError('Please provide either an end date or duration days.')

        if has_duration:
            try:
                duration_value = int(duration_days)
            except (TypeError, ValueError):
                raise ValueError('Duration days must be a valid number.')

            if duration_value <= 0:
                raise ValueError('Duration days must be greater than zero.')

            end_date = start_date + timedelta(days=duration_value)
        else:
            try:
                end_date = timezone.datetime.strptime(str(end_date), '%Y-%m-%d').date()
            except Exception:
                raise ValueError('End date must be a valid date.')

            if end_date < start_date:
                raise ValueError('End date cannot be earlier than start date.')

        title = (request.data.get('title') or '').strip() or f"Contract for {proposal.project.title}"
        # Keep freelancer proposal text immutable during client contract drafting.
        description = proposal.cover_letter or proposal.project.description
        terms = request.data.get('terms') or {}
        if not isinstance(terms, dict):
            terms = {}

        terms.update({
            'project_title': proposal.project.title,
            'project_description': proposal.project.description,
            'client_name': proposal.project.client.username,
            'freelancer_name': proposal.freelancer.username,
            'proposal_cover_letter': proposal.cover_letter,
            'project_duration_days': proposal.project.duration_days,
            'project_deadline_type': proposal.project.deadline_type,
            'project_submission_deadline': str(proposal.project.submission_deadline or ''),
        })

        payload = {
            'proposal': proposal,
            'client': proposal.project.client,
            'freelancer': proposal.freelancer,
            'title': title,
            'description': description,
            'terms': terms,
            'budget': budget,
            'currency': request.data.get('currency') or 'USD',
            'start_date': start_date,
            'end_date': end_date,
            'status': 'draft',
            'client_confirmed': True,
            'freelancer_confirmed': False,
            'pending_action_by': 'FREELANCER',
        }
        return payload

    def create(self, request, *args, **kwargs):
        _, error_response = self._validate_create(request)
        if error_response:
            return error_response

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(freelancer=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def get_queryset(self):
        queryset = super().get_queryset().select_related('project', 'project__client', 'freelancer')
        project_id = self.request.query_params.get('project')
        user = self.request.user

        if project_id:
            scoped = queryset.filter(project_id=project_id)
            if getattr(user, 'role', '') == 'CLIENT':
                return scoped.filter(project__client=user).order_by('-created_at')
            if getattr(user, 'role', '') == 'FREELANCER':
                return scoped.filter(freelancer=user).order_by('-created_at')
            return queryset.none()

        if getattr(user, 'role', '') == 'CLIENT':
            return queryset.filter(project__client=user).order_by('-created_at')
        if getattr(user, 'role', '') == 'FREELANCER':
            return queryset.filter(freelancer=user).order_by('-created_at')
        return queryset.none()

    @action(detail=False, methods=['get'], url_path='received')
    def received(self, request):
        proposals = Proposal.objects.filter(project__client=request.user).select_related('freelancer', 'project').order_by('-created_at')
        freelancer_ids = {p.freelancer_id for p in proposals}
        freelancer_reputation = {
            freelancer_id: self._build_reputation_snapshot(freelancer_id, reviewer_role='CLIENT')
            for freelancer_id in freelancer_ids
        }

        data = [
            {
                'id': p.id,
                'project': p.project_id,
                'project_title': p.project.title,
                'freelancer': p.freelancer_id,
                'freelancer_name': self._profile_display_name(p.freelancer),
                'freelancer_profile_image': self._profile_image_url(p.freelancer),
                'bid_amount': p.bid_amount,
                'estimated_days': p.estimated_days,
                'cover_letter': p.cover_letter,
                'status': p.status,
                'contract_id': getattr(getattr(p, 'contract', None), 'id', None),
                'contract_status': getattr(getattr(p, 'contract', None), 'status', None),
                'freelancer_reputation': freelancer_reputation.get(p.freelancer_id, {
                    'average_rating': 0,
                    'total_reviews': 0,
                    'recommendation_rate': 0,
                    'recent_reviews': [],
                }),
                'created_at': p.created_at,
            }
            for p in proposals
        ]
        return Response(data)

    @action(detail=False, methods=['get'], url_path='my')
    def my(self, request):
        proposals = Proposal.objects.filter(freelancer=request.user).select_related('project', 'project__client').order_by('-created_at')
        data = [
            {
                'id': p.id,
                'project': p.project_id,
                'project_title': p.project.title,
                'client': p.project.client_id,
                'client_name': self._profile_display_name(p.project.client),
                'client_profile_image': self._profile_image_url(p.project.client),
                'bid_amount': p.bid_amount,
                'estimated_days': p.estimated_days,
                'cover_letter': p.cover_letter,
                'status': p.status,
                'contract_id': getattr(getattr(p, 'contract', None), 'id', None),
                'contract_status': getattr(getattr(p, 'contract', None), 'status', None),
                'created_at': p.created_at,
            }
            for p in proposals
        ]
        return Response(data)

    @action(detail=False, methods=['post'], url_path='create')
    def create_proposal(self, request):
        _, error_response = self._validate_create(request)
        if error_response:
            return error_response

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(freelancer=request.user)
        return Response(serializer.data, status=201)

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        proposal = self.get_object()

        # Verify user is project owner
        if request.user != proposal.project.client:
            return Response({"error": "Only project owner can accept"}, status=403)

        if proposal.status != 'pending':
            return Response({"error": "Only pending proposals can be accepted"}, status=400)

        # Update proposal status and build contract draft for freelancer verification.
        negotiated_amount = request.data.get('bid_amount', None)
        if negotiated_amount not in (None, ''):
            try:
                final_amount = Decimal(str(negotiated_amount))
            except (InvalidOperation, TypeError):
                return Response({"error": "Invalid bid amount"}, status=400)
            if final_amount <= 0:
                return Response({"error": "Bid amount must be greater than 0"}, status=400)
            proposal.bid_amount = final_amount

        try:
            payload = self._build_contract_payload(proposal, request)
        except ValueError as exc:
            return Response({"error": str(exc)}, status=400)

        proposal.status = 'accepted'
        proposal.save()
        project = proposal.project
        Proposal.objects.filter(project=project, status='pending').exclude(id=proposal.id).update(status='rejected')

        contract, created = Contract.objects.get_or_create(
            proposal=proposal,
            defaults=payload,
        )
        if not created:
            for key, value in payload.items():
                setattr(contract, key, value)
            contract.save()
        
        return Response({
            "proposal": self.get_serializer(proposal).data,
            "contract_id": contract.id,
            "message": "Proposal accepted and contract draft sent to freelancer"
        })

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        proposal = self.get_object()
        
        if request.user != proposal.project.client:
            return Response({"error": "Only project owner can reject"}, status=403)
        
        proposal.status = 'rejected'
        proposal.save()
        
        return Response({"message": "Proposal rejected"})

    @action(detail=True, methods=['post'])
    def report(self, request, pk=None):
        proposal = self.get_object()

        if request.user.role != 'CLIENT' or request.user != proposal.project.client:
            return Response({'error': 'Only project client can report this freelancer.'}, status=403)

        reason = (request.data.get('reason') or '').strip().lower()
        if reason not in {'misbehavior', 'fake_company'}:
            return Response({'error': 'Reason must be misbehavior or fake_company.'}, status=400)

        details = (request.data.get('details') or '').strip()

        existing = FreelancerBehaviorReport.objects.filter(
            reporter=request.user,
            proposal=proposal,
            reported_user=proposal.freelancer,
            reason=reason,
            status='pending',
        ).first()
        if existing:
            return Response({'message': 'Report already submitted and pending admin review.', 'report_id': existing.id})

        report = FreelancerBehaviorReport.objects.create(
            reporter=request.user,
            reported_user=proposal.freelancer,
            proposal=proposal,
            reason=reason,
            details=details,
        )

        return Response({'message': 'Report submitted to admin.', 'report_id': report.id}, status=201)
