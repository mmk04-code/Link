from django.db import models
from django.db.models import Avg, F, ExpressionWrapper
from django.utils import timezone
from users.models import User
from proposals.models import Proposal

class ContractManager(models.Manager):
    def disputed_contracts(self):
        return self.filter(status='disputed')

    def completion_rate(self):
        total = self.exclude(status='draft').count()
        if not total:
            return 0.0
        completed = self.filter(status='completed').count()
        return (completed / total) * 100.0

    def average_duration(self):
        completed = self.filter(status='completed', start_date__isnull=False, end_date__isnull=False)
        if not completed.exists():
            return None
        duration = ExpressionWrapper(F('end_date') - F('start_date'), output_field=models.DurationField())
        return completed.annotate(duration=duration).aggregate(Avg('duration'))['duration__avg']

class Contract(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('disputed', 'Disputed'),
    ]

    PENDING_ACTION_CHOICES = [
        ('NONE', 'None'),
        ('CLIENT', 'Client'),
        ('FREELANCER', 'Freelancer'),
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
    pending_action_by = models.CharField(max_length=20, choices=PENDING_ACTION_CHOICES, default='NONE')
    
    contract_document = models.FileField(upload_to='contracts/', null=True, blank=True)

    objects = ContractManager()

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
            if not self.start_date:
                self.start_date = timezone.localdate()
            self.save()
            return True
        return False

    def complete(self):
        if self.status == 'active':
            self.status = 'completed'
            if not self.end_date:
                self.end_date = timezone.localdate()
            self.save()
            return True
        return False

    @property
    def contract_duration(self):
        if self.start_date and self.end_date:
            return (self.end_date - self.start_date).days
        return None