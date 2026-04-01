from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import models
from django.utils import timezone
from .models import Contract
from .serializers import ContractSerializer, ContractCreateSerializer, ContractConfirmSerializer

class ContractViewSet(viewsets.ModelViewSet):
    serializer_class = ContractSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Contract.objects.filter(
            models.Q(client=user) | models.Q(freelancer=user)
        ).order_by('-created_at')

    def get_serializer_class(self):
        if self.action == 'create':
            return ContractCreateSerializer
        return ContractSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        contract = serializer.save()
        return Response(
            ContractSerializer(contract, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )

    def perform_update(self, serializer):
        old_status = serializer.instance.status
        contract = serializer.save()

        updates = []
        if contract.status == 'active' and not contract.start_date:
            contract.start_date = timezone.localdate()
            updates.append('start_date')

        if contract.status == 'completed' and not contract.end_date:
            contract.end_date = timezone.localdate()
            updates.append('end_date')

        if updates:
            contract.save(update_fields=updates + ['updated_at'])

        if contract.proposal_id and contract.proposal.project_id:
            project = contract.proposal.project
            if old_status != contract.status:
                if contract.status == 'active' and project.status != 'in_progress':
                    project.status = 'in_progress'
                    project.save(update_fields=['status', 'updated_at'])
                elif contract.status == 'completed' and project.status != 'completed':
                    project.status = 'completed'
                    project.save(update_fields=['status', 'updated_at'])

    @action(detail=True, methods=['post'], url_path='request-completion')
    def request_completion(self, request, pk=None):
        contract = self.get_object()

        if request.user != contract.freelancer:
            return Response({'error': 'Only freelancer can request completion.'}, status=status.HTTP_403_FORBIDDEN)

        if contract.status != 'active':
            return Response({'error': 'Only active contracts can request completion.'}, status=status.HTTP_400_BAD_REQUEST)

        if contract.pending_action_by == 'CLIENT':
            return Response({'error': 'Completion is already awaiting client verification.'}, status=status.HTTP_400_BAD_REQUEST)

        contract.pending_action_by = 'CLIENT'
        contract.save(update_fields=['pending_action_by', 'updated_at'])
        return Response(ContractSerializer(contract, context={'request': request}).data)

    @action(detail=True, methods=['post'], url_path='completion-decision')
    def completion_decision(self, request, pk=None):
        contract = self.get_object()

        if request.user != contract.client:
            return Response({'error': 'Only client can verify completion.'}, status=status.HTTP_403_FORBIDDEN)

        if contract.status != 'active' or contract.pending_action_by != 'CLIENT':
            return Response({'error': 'Contract is not awaiting client completion verification.'}, status=status.HTTP_400_BAD_REQUEST)

        decision = (request.data.get('decision') or '').strip().lower()
        if decision not in {'verify', 'not_complete'}:
            return Response({'error': 'Decision must be verify or not_complete.'}, status=status.HTTP_400_BAD_REQUEST)

        if decision == 'not_complete':
            contract.pending_action_by = 'FREELANCER'
            contract.save(update_fields=['pending_action_by', 'updated_at'])
            return Response(ContractSerializer(contract, context={'request': request}).data)

        contract.status = 'completed'
        contract.pending_action_by = 'NONE'
        if not contract.end_date:
            contract.end_date = timezone.localdate()
        contract.save(update_fields=['status', 'pending_action_by', 'end_date', 'updated_at'])

        if contract.proposal_id and contract.proposal.project_id:
            project = contract.proposal.project
            if project.status != 'completed':
                project.status = 'completed'
                project.save(update_fields=['status', 'updated_at'])

        return Response(ContractSerializer(contract, context={'request': request}).data)

    @action(detail=True, methods=['post'], url_path='freelancer-review')
    def freelancer_review(self, request, pk=None):
        contract = self.get_object()

        if request.user != contract.freelancer:
            return Response({'error': 'Only freelancer can review this contract.'}, status=status.HTTP_403_FORBIDDEN)

        if contract.status != 'draft' or contract.pending_action_by not in {'FREELANCER', 'NONE'}:
            return Response({'error': 'Contract is not awaiting freelancer review.'}, status=status.HTTP_400_BAD_REQUEST)

        action_type = (request.data.get('action') or 'accept').strip().lower()
        if action_type not in {'accept', 'edit'}:
            return Response({'error': 'Action must be accept or edit.'}, status=status.HTTP_400_BAD_REQUEST)

        if action_type == 'edit':
            for field in ['budget', 'start_date', 'end_date', 'description', 'title']:
                if field in request.data:
                    setattr(contract, field, request.data.get(field))
            contract.freelancer_confirmed = True
            contract.client_confirmed = False
            contract.pending_action_by = 'CLIENT'
            contract.save()
            return Response(ContractSerializer(contract, context={'request': request}).data)

        contract.freelancer_confirmed = True
        contract.pending_action_by = 'NONE'
        contract.save(update_fields=['freelancer_confirmed', 'pending_action_by', 'updated_at'])

        if contract.can_be_activated():
            contract.activate()
            if contract.proposal_id and contract.proposal.project_id:
                project = contract.proposal.project
                if project.status != 'in_progress':
                    project.status = 'in_progress'
                    project.save(update_fields=['status', 'updated_at'])

        return Response(ContractSerializer(contract, context={'request': request}).data)

    @action(detail=True, methods=['post'], url_path='client-decision')
    def client_decision(self, request, pk=None):
        contract = self.get_object()

        if request.user != contract.client:
            return Response({'error': 'Only client can decide on this contract.'}, status=status.HTTP_403_FORBIDDEN)

        if contract.status != 'draft' or contract.pending_action_by != 'CLIENT':
            return Response({'error': 'Contract is not awaiting client decision.'}, status=status.HTTP_400_BAD_REQUEST)

        decision = (request.data.get('decision') or '').strip().lower()
        if decision not in {'accept', 'reject'}:
            return Response({'error': 'Decision must be accept or reject.'}, status=status.HTTP_400_BAD_REQUEST)

        if decision == 'reject':
            contract.status = 'cancelled'
            contract.pending_action_by = 'NONE'
            contract.save(update_fields=['status', 'pending_action_by', 'updated_at'])
            return Response(ContractSerializer(contract, context={'request': request}).data)

        contract.client_confirmed = True
        contract.pending_action_by = 'NONE'
        contract.save(update_fields=['client_confirmed', 'pending_action_by', 'updated_at'])

        if contract.can_be_activated():
            contract.activate()
            if contract.proposal_id and contract.proposal.project_id:
                project = contract.proposal.project
                if project.status != 'in_progress':
                    project.status = 'in_progress'
                    project.save(update_fields=['status', 'updated_at'])

        return Response(ContractSerializer(contract, context={'request': request}).data)

    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        contract = self.get_object()
        serializer = ContractConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        if request.user == contract.client:
            contract.client_confirmed = serializer.validated_data['confirm']
        elif request.user == contract.freelancer:
            contract.freelancer_confirmed = serializer.validated_data['confirm']
        else:
            return Response(
                {'error': 'You are not authorized to confirm this contract'},
                status=status.HTTP_403_FORBIDDEN
            )
            
        contract.save()

        if contract.can_be_activated():
            contract.activate()
            if contract.proposal_id and contract.proposal.project_id:
                project = contract.proposal.project
                if project.status != 'in_progress':
                    project.status = 'in_progress'
                    project.save(update_fields=['status', 'updated_at'])

        return Response(ContractSerializer(contract, context={'request': request}).data)