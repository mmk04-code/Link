from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import models
from .models import Message
from contracts.models import Contract
from notifications.models import Notification
from .serializers import MessageSerializer

class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Message.objects.filter(
            models.Q(contract__client=user) | models.Q(contract__freelancer=user)
        ).select_related('sender', 'receiver', 'contract')

    def create(self, request, *args, **kwargs):
        contract_id = request.data.get('contract')
        try:
            contract = Contract.objects.get(id=contract_id)
            if request.user not in [contract.client, contract.freelancer]:
                return Response(
                    {'error': 'You are not authorized to send messages in this contract'},
                    status=status.HTTP_403_FORBIDDEN
                )

            receiver = contract.freelancer if request.user == contract.client else contract.client
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            message = serializer.save(receiver=receiver)

            sender_name = request.user.get_full_name() or request.user.username

            Notification.objects.create(
                user=receiver,
                type='message',
                title='New Message',
                message=f'You have a new message from {sender_name} in contract "{contract.title}"',
                related_contract=contract,
                related_message=message,
                data={
                    'sender_id': request.user.id,
                    'sender_name': sender_name,
                    'contract_id': contract.id,
                    'message_id': message.id,
                    'link': f'/messages?contract={contract.id}&open=unread&source=notification',
                }
            )

            return Response(
                MessageSerializer(message, context={'request': request}).data,
                status=status.HTTP_201_CREATED
            )
        except Contract.DoesNotExist:
            return Response({'error': 'Contract not found'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['get'])
    def contract(self, request):
        contract_id = request.query_params.get('contract_id')
        if not contract_id:
            return Response({'error': 'contract_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        messages = self.get_queryset().filter(contract_id=contract_id)

        # Opening a conversation counts as reading incoming messages.
        unread_incoming = messages.filter(receiver=request.user, is_read=False)
        unread_ids = list(unread_incoming.values_list('id', flat=True))
        if unread_ids:
            unread_incoming.update(is_read=True, read_at=models.functions.Now())
            Notification.objects.filter(
                user=request.user,
                type='message',
                related_message_id__in=unread_ids,
                is_read=False,
            ).update(is_read=True, read_at=models.functions.Now())
            Notification.objects.filter(
                user=request.user,
                type='message',
                related_contract_id=contract_id,
                is_read=False,
            ).filter(
                models.Q(data__message_id__in=unread_ids) |
                models.Q(related_message_id__in=unread_ids)
            ).update(is_read=True, read_at=models.functions.Now())

        serializer = self.get_serializer(messages, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['patch'])
    def read(self, request, pk=None):
        message = self.get_object()
        if request.user != message.receiver:
            return Response({'error': 'Only the receiver can mark messages as read'}, status=status.HTTP_403_FORBIDDEN)
        message.mark_as_read()

        Notification.objects.filter(
            user=request.user,
            type='message',
            related_message=message,
            is_read=False,
        ).update(is_read=True, read_at=models.functions.Now())

        Notification.objects.filter(
            user=request.user,
            type='message',
            related_contract=message.contract,
            is_read=False,
        ).filter(
            models.Q(data__message_id=message.id) |
            models.Q(related_message=message)
        ).update(is_read=True, read_at=models.functions.Now())

        return Response(MessageSerializer(message, context={'request': request}).data)