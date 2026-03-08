from django.db import models
from django.contrib.auth import get_user_model
from projects.models import Project

User = get_user_model()


class Proposal(models.Model):

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("accepted", "Accepted"),
        ("rejected", "Rejected"),
    ]

    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="proposals"
    )
    freelancer = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="proposals"
    )
    cover_letter = models.TextField()
    proposed_rate = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default="pending"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Proposal by {self.freelancer.username} for {self.project.title}"
