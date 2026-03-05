from django.db import models
from django.contrib.auth import get_user_model
from contracts.models import Contract

User = get_user_model()


class MessageManager(models.Manager):

    def unread_count(self, user):
        return self.filter(receiver=user, is_read=False).count()


class Message(models.Model):

    contract = models.ForeignKey(
        Contract,
        on_delete=models.CASCADE,
        related_name="messages"
    )

    sender = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="sent_messages"
    )

    receiver = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="received_messages"
    )

    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    objects = MessageManager()

    class Meta:
        ordering = ["timestamp"]

    def __str__(self):
        return f"Message from {self.sender}"