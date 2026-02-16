from rest_framework import authentication
from rest_framework.exceptions import AuthenticationFailed
from user.jwt_utils import verify_access_token


class JWTAuthentication(authentication.BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')

        if not auth_header:
            return None
        try:
            parts = auth_header.split()
            if len(parts) != 2 or parts[0].lower() != 'bearer':
                return None

            token = parts[1]
            payload = verify_access_token(token)

            if not payload:
                raise AuthenticationFailed('Invalid or expired token')

            user = type('User', (), {
                'phone_number': payload.get('phone_number'),
                'role': payload.get('role'),
                'name': payload.get('name'),
                'is_authenticated': True,
            })()

            return (user, token)

        except Exception as e:
            raise AuthenticationFailed(f'Authentication failed: {str(e)}')
