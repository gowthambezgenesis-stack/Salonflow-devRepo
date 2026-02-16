from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.http import HttpResponse
from .serializers import UserOTPSerializer
from .utils import *
from .jwt_utils import *
from .models import *

class SendOTPVIEW(APIView):
  def post(self,request):
    serializer = UserOTPSerializer(data = request.data)

    if serializer.is_valid():
      otp = generate_otp()
      phone = serializer.validated_data.get('phone_number')
      name = serializer.validated_data.get('name')

      user, created = UserOTP.objects.get_or_create(phone_number = phone, defaults ={
        'name':name,
        'otp':otp})

      if not created:
            user.otp = otp
            user.name = name
            user.save()

      send_otp(phone,otp)

      return Response({"message":"OTP sent successfully"},status=status.HTTP_200_OK)
    return Response(serializer.errors,)

class VerifyOTPView(APIView):
  def post(self,request):
    phone = request.data.get('phone_number')
    otp = request.data.get('otp')
    try:
      user = UserOTP.objects.filter(phone_number = phone ).latest('created_at')
    except UserOTP.DoesNotExist:
      return Response({"message":"user not found"},status=status.HTTP_404_NOT_FOUND)

    # Bypass: accept any non-empty OTP (no Twilio; dev/login bypass)
    if otp:
      access_token = generate_access_token(phone, 'customer', user.name)
      refresh_token = generate_refresh_token(phone, 'customer')

      response = Response({
        "message": "OTP verified successfully",
        "access_token": access_token,
        "role": "customer",
        "name": user.name,
        "phone_number": phone
      }, status=status.HTTP_200_OK)

      response.set_cookie(
        key='refresh_token',
        value=refresh_token,
        httponly=True,
        secure=False,
        samesite='Lax',
        max_age=7*24*60*60,
        path='/',
      )

      return response
    else:
      return Response({"error":"Invalid OTP"},status=status.HTTP_400_BAD_REQUEST)


class RefreshTokenView(APIView):
  """
  Endpoint to refresh access token using refresh token from cookie.
  """
  def post(self, request):
    refresh_token = request.COOKIES.get('refresh_token')

    if not refresh_token:
      refresh_token = request.data.get('refresh_token')

    if not refresh_token:
      return Response(
        {"error": "Refresh token not found"},
        status=status.HTTP_401_UNAUTHORIZED
      )

    tokens = refresh_access_token(refresh_token)

    if not tokens:
      response = Response(
        {"error": "Invalid or expired refresh token"},
        status=status.HTTP_401_UNAUTHORIZED
      )
      response.delete_cookie('refresh_token')
      return response

    new_access_token, new_refresh_token = tokens

    old_payload = verify_refresh_token(refresh_token)
    new_payload = verify_access_token(new_access_token)

    response = Response({
      "access_token": new_access_token,
      "role": old_payload.get('role') if old_payload else None,
      "name": new_payload.get('name') if new_payload else None,
      "phone_number": old_payload.get('phone_number') if old_payload else None
    }, status=status.HTTP_200_OK)

    response.set_cookie(
      key='refresh_token',
      value=new_refresh_token,
      httponly=True,
      secure=False,
      samesite='Lax',
      max_age=7*24*60*60,
      path='/',
    )

    return response


class LogoutView(APIView):
  def post(self, request):
    response = Response(
      {"message": "Logged out successfully"},
      status=status.HTTP_200_OK
    )
    response.delete_cookie('refresh_token')
    return response


