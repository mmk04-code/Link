from django.db import models
from django.contrib.auth import get_user_model
from proposals.models import Proposal
from datetime import timedelta

User = get_user_model()


class ContractManager(models.Manager):

    def disputed_contracts(self):
        return self.filter(status="disputed")

    def completion_rate(self):
        total = self.count()
        completed = self.filter(status="completed").count()
        return (completed / total) * 100 if total else 0

    def average_duration(self):
        durations = [
            c.contract_duration()
            for c in self.exclude(end_date=None)
        ]
        if not durations:
            return timedelta(0)

        return sum(durations, timedelta()) / len(durations)


class Contract(models.Model):

    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("active", "Active"),
        ("completed", "Completed"),
        ("disputed", "Disputed"),
    ]

    proposal = models.OneToOneField(
        Proposal,
        on_delete=models.CASCADE,
        related_name="contract"
    )

    client = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="client_contracts"
    )

    freelancer = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="freelancer_contracts"
    )

    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default="draft"
    )

    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    objects = ContractManager()

    class Meta:
        ordering = ["-created_at"]

        # Database index for faster queries
        indexes = [
            models.Index(fields=["status"]),
        ]

    def contract_duration(self):
        if self.end_date:
            return self.end_date - self.start_date
        return timedelta(0)

    def __str__(self):
        return f"Contract #{self.id} - {self.status}"