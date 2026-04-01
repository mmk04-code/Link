from rest_framework import generics, permissions, filters
from django.db.models import Count, Q, F
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from .models import Project
from .serializers import ProjectSerializer
from users.permissions import IsClient, IsVerifiedUser

class ProjectListCreateView(generics.ListCreateAPIView):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'skills_required']
    search_fields = ['title', 'description', 'skills_required']
    ordering_fields = ['budget_min', 'created_at', 'duration_days']

    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated(), IsClient(), IsVerifiedUser()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(client=self.request.user)

    def get_queryset(self):
        user = self.request.user
        if getattr(user, 'role', '') != 'FREELANCER':
            return Project.objects.none()
        # Browse endpoint: only projects currently accepting proposals.
        today = timezone.localdate()
        return (
            Project.objects.filter(status='open')
            .exclude(client=user)
            .annotate(
                proposals_count=Count('proposals', distinct=True),
                accepted_count=Count('proposals', filter=Q(proposals__status='accepted'), distinct=True),
            )
            .filter(accepted_count=0, proposals_count__lt=F('max_proposals'))
            .filter(Q(deadline_type='flexible') | Q(submission_deadline__isnull=True) | Q(submission_deadline__gte=today))
            .order_by('-created_at')
        )


class MyProjectListView(generics.ListAPIView):
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # My projects endpoint: only current client's projects.
        return Project.objects.filter(client=self.request.user).order_by('-created_at')

class ProjectDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer

    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [permissions.IsAuthenticated(), IsClient()]
        return [permissions.IsAuthenticated()]
