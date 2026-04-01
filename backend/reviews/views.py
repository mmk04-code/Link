from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import models
from django.db.models import Q
from .models import Review
from notifications.models import Notification
from .serializers import ReviewSerializer

class ReviewViewSet(viewsets.ModelViewSet):
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Review.objects.all()
        contract_id = self.request.query_params.get('contract')
        if contract_id:
            queryset = queryset.filter(contract_id=contract_id)
        if not self.request.user.is_staff:
            queryset = queryset.filter(Q(reviewer=self.request.user) | Q(reviewee=self.request.user))
        return queryset.select_related('reviewer', 'reviewee', 'contract')

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        review = serializer.save(reviewer=request.user)

        Notification.objects.create(
            user=review.reviewee,
            type='review_received',
            title='New Review Received',
            message=f'{request.user.get_full_name()} has left you a review for contract "{review.contract.title}"',
            related_contract=review.contract,
            related_review=review,
            data={'rating': review.overall_rating}
        )

        return Response(ReviewSerializer(review, context={'request': request}).data,
                        status=201)

    @action(detail=False, methods=['get'])
    def user(self, request):
        user_id = request.query_params.get('user_id', request.user.id)
        if not request.user.is_staff and str(user_id) != str(request.user.id):
            return Response({'error': 'You can only access your own review summary.'}, status=403)
        reviews = self.get_queryset().filter(reviewee_id=user_id)
        serializer = self.get_serializer(reviews, many=True)
        if reviews.exists():
            avg_ratings = reviews.aggregate(
                avg_communication=models.Avg('communication_rating'),
                avg_quality=models.Avg('quality_rating'),
                avg_professionalism=models.Avg('professionalism_rating'),
                avg_overall=models.Avg('overall_rating'),
                total_reviews=models.Count('id')
            )
        else:
            avg_ratings = {k: 0 for k in ['avg_communication', 'avg_quality', 
                                         'avg_professionalism', 'avg_overall', 'total_reviews']}
        return Response({'reviews': serializer.data, 'averages': avg_ratings})