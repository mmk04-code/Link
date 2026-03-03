from django.db import models
from django.contrib.auth import get_user_model
from contracts.models import Contract

User = get_user_model()


class Notification(models.Model):

    TYPE_CHOICES = [
        ("message", "Message"),
        ("contract_review", "Contract Review"),
    ]

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="notifications"
    )

    contract = models.ForeignKey(
        Contract,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="notifications"
    )

    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    is_read = models.BooleanField(default=False)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-timestamp"]

    def __str__(self):
        return f"{self.type} notification"