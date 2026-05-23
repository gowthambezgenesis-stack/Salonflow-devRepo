import random
from django.conf import settings
from twilio.rest import Client

def generate_otp():
    return str(random.randint(1000, 9999))

def send_otp(phone: str, otp: str):
    sid = getattr(settings, 'TWILIO_ACCOUNT_SID', '')
    token = getattr(settings, 'TWILIO_AUTH_TOKEN', '')
    from_number = getattr(settings, 'TWILIO_PHONE_NUMBER', '')
    if not (sid and token and from_number):
        return  # Bypass if not configured
    client = Client(sid, token)
    client.messages.create(
        body=f"Your Salon Flow OTP is: {otp}",
        from_=from_number,
        to=phone,
    )
