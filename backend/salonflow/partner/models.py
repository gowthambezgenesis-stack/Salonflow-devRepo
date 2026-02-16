from django.db import models
from django.utils import timezone


class PartnerModel(models.Model):
   phone_number = models.CharField(max_length=15)
   otp = models.CharField(max_length=6,null=True, blank=True)
   created_at = models.DateTimeField(default = timezone.now)
   is_verified = models.BooleanField(default=False)


