import jwt
import time
from datetime import datetime, timedelta
from django.conf import settings
from typing import Dict, Optional, Tuple


JWT_SECRET_KEY = getattr(settings, 'SECRET_KEY', 'django-insecure-wrd--!580!=my791d^feyrfjybqs(lqp#im4b)*fo+-$l=!)@$')
JWT_ALGORITHM = 'HS256'


ACCESS_TOKEN_EXPIRY = timedelta(minutes=15)
REFRESH_TOKEN_EXPIRY = timedelta(days=7)


def generate_access_token(phone_number: str, role: str, name: str = None) -> str:
    payload = {
        'phone_number': phone_number,
        'role': role,
        'name': name,
        'type': 'access',
        'exp': datetime.utcnow() + ACCESS_TOKEN_EXPIRY,
        'iat': datetime.utcnow()
    }

    token = jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return token


def generate_refresh_token(phone_number: str, role: str) -> str:
    payload = {
        'phone_number': phone_number,
        'role': role,
        'type': 'refresh',
        'exp': datetime.utcnow() + REFRESH_TOKEN_EXPIRY,
        'iat': datetime.utcnow()
    }

    token = jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return token


def decode_token(token: str) -> Optional[Dict]:
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def verify_access_token(token: str) -> Optional[Dict]:
    payload = decode_token(token)
    if payload and payload.get('type') == 'access':
        return payload
    return None


def verify_refresh_token(token: str) -> Optional[Dict]:

    payload = decode_token(token)
    if payload and payload.get('type') == 'refresh':
        return payload
    return None


def refresh_access_token(refresh_token: str) -> Optional[Tuple[str, str]]:

    payload = verify_refresh_token(refresh_token)
    if not payload:
        return None

    phone_number = payload.get('phone_number')
    role = payload.get('role')

    from .models import UserOTP
    try:
        user = UserOTP.objects.filter(phone_number=phone_number).latest('created_at')
        name = user.name
    except UserOTP.DoesNotExist:
        name = None

    new_access_token = generate_access_token(phone_number, role, name)
    new_refresh_token = generate_refresh_token(phone_number, role)

    return (new_access_token, new_refresh_token)
