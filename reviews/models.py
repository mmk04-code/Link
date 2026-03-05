from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
from contracts.models import Contract

User = get_user_model()


class ReviewManager(models.Manager):

    def average_rating(self, user):
        reviews = self.filter(reviewee=user)
        if not reviews.exists():
            return 0
        return sum(r.rating for r in reviews) / reviews.count()


class Review(models.Model):

    contract = models.ForeignKey(
        Contract,
        on_delete=models.CASCADE,
        related_name="reviews"
    )

    reviewer = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="given_reviews"
    )

    reviewee = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="received_reviews"
    )

    rating = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )

    comment = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    objects = ReviewManager()

    class Meta:
        ordering = ["-timestamp"]

    def __str__(self):
        return f"Review {self.rating}/5"