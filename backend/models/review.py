from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from .user import User
from .contract import Contract

class Review(models.Model):
    contract = models.ForeignKey(Contract, on_delete=models.CASCADE, related_name='reviews')
    reviewer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='written_reviews')
    reviewee = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_reviews')
    
    # Ratings (1-5)
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
    
    # Review content
    title = models.CharField(max_length=255)
    comment = models.TextField()
    pros = models.TextField(blank=True)
    cons = models.TextField(blank=True)
    
    # Would you recommend?
    would_recommend = models.BooleanField(default=True)
    
    # Admin moderation
    is_public = models.BooleanField(default=True)
    flagged = models.BooleanField(default=False)
    flag_reason = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = ['contract', 'reviewer']  # One review per user per contract
        indexes = [
            models.Index(fields=['reviewee', '-created_at']),
            models.Index(fields=['contract']),
        ]

    def __str__(self):
        return f"Review by {self.reviewer.email} for {self.reviewee.email}"

    def save(self, *args, **kwargs):
        # Calculate overall rating
        self.overall_rating = (
            self.communication_rating + 
            self.quality_rating + 
            self.professionalism_rating
        ) / 3.0
        super().save(*args, **kwargs)