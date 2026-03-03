from rest_framework import generics, permissions
from .models import Proposal
from .serializers import ProposalSerializer
from users.permissions import IsFreelancer, IsClient

class ProposalCreateView(generics.CreateAPIView):
    queryset = Proposal.objects.all()
    serializer_class = ProposalSerializer
    permission_classes = [permissions.IsAuthenticated, IsFreelancer]

    def perform_create(self, serializer):
        serializer.save(freelancer=self.request.user)

class ProposalListView(generics.ListAPIView):
    serializer_class = ProposalSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'CLIENT':
            return Proposal.objects.filter(project__client=user)
        return Proposal.objects.filter(freelancer=user)

class ProposalDetailView(generics.RetrieveUpdateAPIView):
    queryset = Proposal.objects.all()
    serializer_class = ProposalSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_update(self, serializer):
        if 'status' in self.request.data and self.request.user.role == 'CLIENT':
            instance = serializer.save()
            
            # If a proposal is accepted, reject other pending proposals and mark project as in_progress
            if instance.status == 'accepted':
                # Reject other pending proposals for the same project
                Proposal.objects.filter(project=instance.project, status='pending').exclude(id=instance.id).update(status='rejected')
                
                # Update the project status to in_progress
                instance.project.status = 'in_progress'
                instance.project.save()
