from django.db import models
from django.utils import timezone
from .user import User

class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ('message', 'New Message'),
        ('contract_status', 'Contract Status Change'),
        ('contract_created', 'Contract Created'),
        ('review_received', 'Review Received'),
        ('payment_received', 'Payment Received'),
        ('system', 'System Notification'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=255)
    message = models.TextField()
    
    # Related objects (optional)
    related_contract = models.ForeignKey('Contract', on_delete=models.CASCADE, null=True, blank=True)
    related_message = models.ForeignKey('Message', on_delete=models.CASCADE, null=True, blank=True)
    related_review = models.ForeignKey('Review', on_delete=models.CASCADE, null=True, blank=True)
    
    # Metadata
    data = models.JSONField(default=dict, blank=True)  # Additional data
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['user', 'is_read']),
        ]

    def __str__(self):
        return f"Notification for {self.user.email}: {self.title}"

    def mark_as_read(self):
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save()