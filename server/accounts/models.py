from django.contrib.auth.models import AbstractUser
from django.db import models
from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver


class User(AbstractUser):
    ROLE_CHOICES = (
        ('private', 'Private individual'),
        ('dealer', 'Dealer'),
    )

    email = models.EmailField(unique=True, null=False, blank=False)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='private')

    def __str__(self):
        return self.username


class UserProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='profile')
    # enforce uniqueness at DB level
    phone_e164 = models.CharField(max_length=20, unique=True, null=True, blank=True, default=None)

    def __str__(self):
        return f"Profile<{self.user_id}>"

    @property
    def email(self):
        return getattr(self.user, 'email', '') or ''


@receiver(post_save, sender=User)
def ensure_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)
    else:
        UserProfile.objects.get_or_create(user=instance)
