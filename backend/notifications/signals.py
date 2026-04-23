from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from proposals.models import Proposal
from contracts.models import Contract
from messaging.models import Message
from .models import Notification


@receiver(post_save, sender=Proposal)
def proposal_created_notify_client(sender, instance, created, **kwargs):
    """Signal 1: When a new Proposal is created, notify the project's client."""
    if not created:
        return
    try:
        client = instance.project.client
        freelancer_name = instance.freelancer.get_full_name() or instance.freelancer.username
        project_title = instance.project.title
        Notification.objects.create(
            user=client,
            type='message',  # Using 'message' since model lacks 'proposal' type
            title='New Proposal Received',
            message=f"{freelancer_name} submitted a proposal on your project '{project_title}'",
            data={'proposal_id': instance.id, 'notification_subtype': 'proposal', 'link': '/proposals'},
        )
    except Exception as e:
        # Non-fatal — never block proposal creation
        import logging
        logging.getLogger(__name__).warning(f'proposal_created_notify_client failed: {e}')


@receiver(post_save, sender=Contract)
def contract_status_changed_notify(sender, instance, created, **kwargs):
    """Signal 2: When Contract.status changes, notify both client and freelancer."""
    if created:
        return  # Only act on updates
    try:
        prev_status = getattr(instance, '_prev_status', None)
        if prev_status is None:
            return
        if prev_status == instance.status:
            return  # Status did not change

        link = f'/contracts/{instance.id}'
        project_title = instance.proposal.project.title if instance.proposal else instance.title

        if instance.status == 'active':
            Notification.objects.create(
                user=instance.freelancer,
                type='contract_status',
                title='Contract is Now Active',
                message=f"Your contract for '{project_title}' is now active",
                data={'contract_id': instance.id, 'link': link},
            )
            Notification.objects.create(
                user=instance.client,
                type='contract_status',
                title='Contract Started',
                message=f"Contract for '{project_title}' has started",
                data={'contract_id': instance.id, 'link': link},
            )
        elif instance.status == 'completed':
            Notification.objects.create(
                user=instance.freelancer,
                type='contract_status',
                title='Contract Completed',
                message=f"Contract '{project_title}' marked as completed",
                data={'contract_id': instance.id, 'link': link},
            )
            Notification.objects.create(
                user=instance.client,
                type='contract_status',
                title='Contract Completed',
                message=f"Contract '{project_title}' has been completed",
                data={'contract_id': instance.id, 'link': link},
            )
    except Exception as e:
        import logging
        logging.getLogger(__name__).warning(f'contract_status_changed_notify failed: {e}')


@receiver(pre_save, sender=Contract)
def contract_store_previous_status(sender, instance, **kwargs):
    if not instance.pk:
        instance._prev_status = None
        return
    try:
        previous = Contract.objects.filter(pk=instance.pk).only('status').first()
        instance._prev_status = previous.status if previous else None
    except Exception:
        instance._prev_status = None


@receiver(post_save, sender=Message)
def message_created_notify_recipient(sender, instance, created, **kwargs):
    """Message notifications are created in messaging.views to avoid duplicates."""
    return


from projects.models import Project

@receiver(post_save, sender=Project)
def project_created_notify_past_freelancers(sender, instance, created, **kwargs):
    """Signal 4: When a new project is created, notify freelancers who have completed a contract with this client."""
    if not created:
        return
    try:
        # Find all completed contracts for this client
        completed_contracts = Contract.objects.filter(client=instance.client, status='completed').select_related('freelancer')
        
        # Get distinct freelancers from these contracts
        freelancers = {contract.freelancer for contract in completed_contracts}
        
        client_name = instance.client.get_full_name() or instance.client.username
        
        for freelancer in freelancers:
            Notification.objects.create(
                user=freelancer,
                type='system',
                title='New Project from Past Client',
                message=f"Your past client '{client_name}' posted a new project: '{instance.title}'",
                data={'project_id': instance.id, 'notification_subtype': 'proposal', 'link': f'/projects/{instance.id}'},
            )
    except Exception as e:
        import logging
        logging.getLogger(__name__).warning(f'project_created_notify_past_freelancers failed: {e}')
