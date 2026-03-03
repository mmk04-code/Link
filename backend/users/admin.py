from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import models
from django.utils import timezone
from contracts.models import Contract
from reviews.models import Review
from contracts.serializers import ContractSerializer
from reviews.serializers import ReviewSerializer

class AdminContractViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ContractSerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = Contract.objects.all().select_related('client', 'freelancer', 'proposal')

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        total_contracts = Contract.objects.count()
        contracts_by_status = Contract.objects.values('status').annotate(count=models.Count('id'))
        recent_contracts = Contract.objects.filter(
            created_at__gte=timezone.now() - timezone.timedelta(days=30)
        ).count()
        total_value = Contract.objects.filter(
            status__in=['active', 'completed']
        ).aggregate(total=models.Sum('budget'))['total'] or 0
        return Response({
            'total_contracts': total_contracts,
            'contracts_by_status': contracts_by_status,
            'recent_contracts_30days': recent_contracts,
            'total_value_active_completed': total_value
        })

class AdminReviewViewSet(viewsets.ModelViewSet):
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = Review.objects.all().select_related('reviewer', 'reviewee', 'contract')

    @action(detail=True, methods=['post'])
    def moderate(self, request, pk=None):
        review = self.get_object()
        action_type = request.data.get('action')
        if action_type == 'hide':
            review.is_public = False
            review.flagged = True
            review.flag_reason = request.data.get('reason', 'Hidden by admin')
        elif action_type == 'show':
            review.is_public = True
            review.flagged = False
            review.flag_reason = ''
        else:
            return Response({'error': 'Invalid action. Use "hide" or "show"'},
                            status=status.HTTP_400_BAD_REQUEST)
        review.save()
        return Response(ReviewSerializer(review).data)

    @action(detail=False, methods=['get'])
    def flagged(self, request):
        flagged_reviews = self.queryset.filter(flagged=True)
        serializer = self.get_serializer(flagged_reviews, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        total_reviews = Review.objects.count()
        average_rating = Review.objects.aggregate(avg=models.Avg('overall_rating'))['avg']
        flagged_count = Review.objects.filter(flagged=True).count()
        rating_distribution = Review.objects.values('overall_rating').annotate(
            count=models.Count('id')).order_by('overall_rating')
        return Response({
            'total_reviews': total_reviews,
            'average_rating': average_rating,
            'flagged_count': flagged_count,
            'rating_distribution': rating_distribution
        })