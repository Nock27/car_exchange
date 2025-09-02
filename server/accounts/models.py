from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    ROLE_CHOICES = (
        ('private', 'Private individual'),
        ('dealer', 'Dealer'),
    )

    email = models.EmailField(unique=True, null=False, blank=False)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='private')

    def __str__(self):
        return self.username
