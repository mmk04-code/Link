from rest_framework import viewsets, permissions
from .models import Proposal
from .serializers import ProposalSerializer

class ProposalViewSet(viewsets.ModelViewSet):
    queryset = Proposal.objects.all()
    serializer_class = ProposalSerializer
    permission_classes = [permissions.IsAuthenticated]
