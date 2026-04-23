from django.apps import AppConfig


class ContractsConfig(AppConfig):
    name = 'contracts'

    def ready(self):
        # Attach pre-save hook to capture _prev_status for signal comparison
        from django.db.models.signals import pre_save
        from contracts.models import Contract

        def _store_prev_status(sender, instance, **kwargs):
            if instance.pk:
                try:
                    old = Contract.objects.get(pk=instance.pk)
                    instance._prev_status = old.status
                except Contract.DoesNotExist:
                    instance._prev_status = None
            else:
                instance._prev_status = None

        pre_save.connect(_store_prev_status, sender=Contract, weak=False)
