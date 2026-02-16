from django.db import models
from django.utils import timezone


class UserOTP(models.Model):
  name = models.CharField(max_length=100)
  phone_number = models.CharField(max_length=15)
  otp = models.CharField(max_length=4)
  created_at = models.DateTimeField(default=timezone.now)

  class Meta:
        ordering = ['-created_at']

  def __str__(self):
    return self.phone_number



