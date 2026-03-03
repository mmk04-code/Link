from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import models
from .models import Contract
from .serializers import ContractSerializer, ContractCreateSerializer, ContractConfirmSerializer

class ContractViewSet(viewsets.ModelViewSet):
    serializer_class = ContractSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Contract.objects.filter(
            models.Q(client=user) | models.Q(freelancer=user)
        )

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

        return Response(ContractSerializer(contract, context={'request': request}).data)