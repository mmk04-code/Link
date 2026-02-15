from django.db import models

class User(models.Model):
    ROLE_CHOICES = (
        ('Client', 'Client'),
        ('Freelancer', 'Freelancer'),
    )

    email = models.EmailField(unique=True)
    password = models.CharField(max_length=255)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.email
