from rest_framework import serializers
from django.utils import timezone
from django.db.models import Avg, Count, Q
from decimal import Decimal, InvalidOperation
from .models import Project
from users.models import Profile
from contracts.models import Contract
from reviews.models import Review

class ProjectSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='client.username', read_only=True)
    client_profile_image = serializers.SerializerMethodField()
    proposals_count = serializers.SerializerMethodField()
    has_accepted_proposal = serializers.SerializerMethodField()
    can_accept_proposals = serializers.SerializerMethodField()
    proposal_block_reason = serializers.SerializerMethodField()
    client_reputation = serializers.SerializerMethodField()
    client_recent_reviews = serializers.SerializerMethodField()
    client_recent_completed_projects = serializers.SerializerMethodField()

    def validate(self, attrs):
        bid_type = attrs.get('bid_type', getattr(self.instance, 'bid_type', 'flexible'))
        budget_min = attrs.get('budget_min', getattr(self.instance, 'budget_min', None))
        budget_max = attrs.get('budget_max', getattr(self.instance, 'budget_max', None))
        deadline_type = attrs.get('deadline_type', getattr(self.instance, 'deadline_type', 'flexible'))
        submission_deadline = attrs.get('submission_deadline', getattr(self.instance, 'submission_deadline', None))
        max_proposals = attrs.get('max_proposals', getattr(self.instance, 'max_proposals', 50))

        try:
            dec_min = Decimal(str(budget_min)) if budget_min is not None else None
            dec_max = Decimal(str(budget_max)) if budget_max is not None else None
        except (InvalidOperation, TypeError):
            raise serializers.ValidationError({'budget_max': 'Invalid budget value.'})

        if bid_type == 'fixed':
            fixed_budget = dec_max if dec_max is not None else dec_min
            if fixed_budget is None:
                raise serializers.ValidationError({'budget_max': 'Budget is required for fixed bid type.'})
            if fixed_budget <= 0:
                raise serializers.ValidationError({'budget_max': 'Budget must be greater than zero.'})
            attrs['budget_min'] = fixed_budget
            attrs['budget_max'] = fixed_budget
        else:
            if dec_min is None or dec_max is None:
                raise serializers.ValidationError({'budget_max': 'Both minimum and maximum budgets are required for flexible bid type.'})
            if dec_min <= 0 or dec_max <= 0:
                raise serializers.ValidationError({'budget_max': 'Budget values must be greater than zero.'})
            if dec_min > dec_max:
                raise serializers.ValidationError({'budget_max': 'Maximum budget must be greater than or equal to minimum budget.'})

        if max_proposals is not None and int(max_proposals) < 1:
            raise serializers.ValidationError({'max_proposals': 'Proposal limit must be at least 1.'})

        if deadline_type == 'fixed' and not submission_deadline:
            raise serializers.ValidationError({'submission_deadline': 'Submission deadline is required for fixed deadline type.'})

        if deadline_type == 'flexible':
            attrs['submission_deadline'] = None

        return attrs

    def get_client_profile_image(self, obj):
        request = self.context.get('request')
        try:
            profile = Profile.objects.filter(user=obj.client).first()
            if not profile:
                return ''
            if profile.profile_image:
                image_url = profile.profile_image.url
                return request.build_absolute_uri(image_url) if request else image_url
            return profile.profile_image_url or ''
        except Exception:
            return ''

    def get_proposals_count(self, obj):
        return obj.proposals.count()

    def get_has_accepted_proposal(self, obj):
        return obj.proposals.filter(status='accepted').exists()

    def _proposal_block_reason(self, obj):
        if obj.status != 'open':
            return 'Project is no longer open for proposals.'

        if obj.proposals.filter(status='accepted').exists():
            return 'A proposal has already been accepted for this project.'

        if obj.proposals.count() >= obj.max_proposals:
            return f'Proposal limit reached ({obj.max_proposals}).'

        if obj.deadline_type == 'fixed' and obj.submission_deadline and obj.submission_deadline < timezone.localdate():
            return 'Submission deadline has passed.'

        return ''

    def get_can_accept_proposals(self, obj):
        return self._proposal_block_reason(obj) == ''

    def get_proposal_block_reason(self, obj):
        return self._proposal_block_reason(obj)

    def get_client_reputation(self, obj):
        reviews_qs = Review.objects.filter(
            reviewee=obj.client,
            reviewer__role='FREELANCER',
            flagged=False,
        )
        agg = reviews_qs.aggregate(
            avg_overall=Avg('overall_rating'),
            total_reviews=Count('id'),
            recommend_count=Count('id', filter=Q(would_recommend=True)),
        )
        total_reviews = int(agg.get('total_reviews') or 0)
        recommend_count = int(agg.get('recommend_count') or 0)
        recommendation_rate = round((recommend_count / total_reviews) * 100, 1) if total_reviews else 0.0

        return {
            'average_rating': round(float(agg.get('avg_overall') or 0), 2),
            'total_reviews': total_reviews,
            'recommendation_rate': recommendation_rate,
        }

    def get_client_recent_reviews(self, obj):
        reviews = Review.objects.filter(
            reviewee=obj.client,
            reviewer__role='FREELANCER',
            flagged=False,
        ).select_related('reviewer', 'contract')[:3]

        return [
            {
                'id': review.id,
                'reviewer_name': review.reviewer.username,
                'contract_title': review.contract.title,
                'rating': round(float(review.overall_rating or 0), 1),
                'title': review.title,
                'comment': (review.comment or '')[:220],
                'created_at': review.created_at,
            }
            for review in reviews
        ]

    def get_client_recent_completed_projects(self, obj):
        contracts = Contract.objects.filter(
            client=obj.client,
            status='completed',
        ).select_related('freelancer', 'proposal', 'proposal__project').order_by('-updated_at')[:3]

        summaries = []
        for contract in contracts:
            summaries.append({
                'contract_id': contract.id,
                'project_title': getattr(getattr(contract, 'proposal', None), 'project', None).title
                if getattr(getattr(contract, 'proposal', None), 'project', None)
                else contract.title,
                'freelancer_name': contract.freelancer.username,
                'budget': contract.budget,
                'completed_on': contract.end_date or contract.updated_at,
            })
        return summaries
    
    class Meta:
        model = Project
        fields = ['id', 'client', 'client_name', 'client_profile_image', 'title', 'description', 
                 'skills_required', 'bid_type', 'budget_min', 'budget_max', 
                 'duration_days', 'deadline_type', 'submission_deadline', 'max_proposals',
                 'proposals_count', 'has_accepted_proposal', 'can_accept_proposals', 'proposal_block_reason',
                 'client_reputation', 'client_recent_reviews', 'client_recent_completed_projects',
                 'status', 'created_at', 'updated_at']
        read_only_fields = ['client', 'created_at', 'updated_at']
