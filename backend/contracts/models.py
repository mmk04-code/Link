from django.db import models
from users.models import User
from proposals.models import Proposal

class Contract(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('disputed', 'Disputed'),
    ]

    proposal = models.OneToOneField(Proposal, on_delete=models.CASCADE, related_name='contract')
    client = models.ForeignKey(User, on_delete=models.CASCADE, related_name='client_contracts')
    freelancer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='freelancer_contracts')
    
    title = models.CharField(max_length=255)
    description = models.TextField()
    terms = models.JSONField(default=dict)
    
    budget = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='USD')
    
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    client_confirmed = models.BooleanField(default=False)
    freelancer_confirmed = models.BooleanField(default=False)
    
    contract_document = models.FileField(upload_to='contracts/', null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['client', 'status']),
            models.Index(fields=['freelancer', 'status']),
            models.Index(fields=['status', 'created_at']),
        ]

    def __str__(self):
        return f"Contract {self.id}: {self.title} - {self.status}"

    def can_be_activated(self):
        return self.client_confirmed and self.freelancer_confirmed and self.status == 'draft'

    def activate(self):
        if self.can_be_activated():
            self.status = 'active'
            self.save()
            return True
        return False

    def complete(self):
        if self.status == 'active':
            self.status = 'completed'
            self.save()
            return True
        return False