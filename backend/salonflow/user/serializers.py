from rest_framework import serializers
from .models import UserOTP

class UserOTPSerializer(serializers.ModelSerializer):
  class Meta:
    model = UserOTP
    fields = ['name','phone_number','otp']
    read_only_fields = ['otp']
