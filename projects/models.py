from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Project(models.Model):
    client = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="projects"
    )
    title = models.CharField(max_length=255)
    description = models.TextField()
    budget = models.DecimalField(max_digits=12, decimal_places=2)
    duration = models.CharField(max_length=100)
    skills_required = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} - {self.client.username}"
