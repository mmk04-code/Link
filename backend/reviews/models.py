from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from users.models import User
from contracts.models import Contract

class Review(models.Model):
    contract = models.ForeignKey(Contract, on_delete=models.CASCADE, related_name='reviews')
    reviewer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='written_reviews')
    reviewee = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_reviews')
    
    communication_rating = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    quality_rating = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    professionalism_rating = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    overall_rating = models.FloatField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    
    title = models.CharField(max_length=255)
    comment = models.TextField()
    pros = models.TextField(blank=True)
    cons = models.TextField(blank=True)
    
    would_recommend = models.BooleanField(default=True)
    
    is_public = models.BooleanField(default=False)
    flagged = models.BooleanField(default=False)
    flag_reason = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = ['contract', 'reviewer']
        indexes = [
            models.Index(fields=['reviewee', '-created_at']),
            models.Index(fields=['contract']),
        ]

    def __str__(self):
        return f"Review by {self.reviewer.email} for {self.reviewee.email}"

    def save(self, *args, **kwargs):
        self.overall_rating = (
            self.communication_rating + self.quality_rating + self.professionalism_rating
        ) / 3.0
        super().save(*args, **kwargs)