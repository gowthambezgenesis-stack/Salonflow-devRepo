import random

def generate_otp():
    return str(random.randint(1000, 9999))

def send_otp(phone, otp):
  # Twilio bypass: no SMS sent; any OTP will be accepted at verify
  return None
