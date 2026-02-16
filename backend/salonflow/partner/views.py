from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import *
from .serializers import *
from .utils import *
from user.jwt_utils import *


class PartnerSendOTP(APIView):
    def post(self, request):
        serializer = SendOTPSerializer(data=request.data)
        if serializer.is_valid():
            phone = serializer.validated_data['phone_number']

            try:
                owner = PartnerModel.objects.get(phone_number=phone)
            except PartnerModel.DoesNotExist:
                return Response({"error": "Unauthorized number"}, status=status.HTTP_401_UNAUTHORIZED)

            otp = generate_otp()
            owner.otp = otp
            owner.is_verified = False
            owner.save()

            send_otp(phone, otp)
            return Response({"message": "OTP sent successfully"}, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PartnerVerifyOTP(APIView):
    def post(self, request):
        serializer = VerifyOTPSerializer(data=request.data)

        if serializer.is_valid():
            phone = serializer.validated_data.get('phone_number')
            otp = serializer.validated_data.get('otp')
            try:
                owner = PartnerModel.objects.get(phone_number=phone)
            except PartnerModel.DoesNotExist:
                return Response({"error": "Unauthorized"}, status=status.HTTP_401_UNAUTHORIZED)
            # Bypass: accept any non-empty OTP (no Twilio; dev/login bypass)
            if otp:
                owner.is_verified = True
                owner.save()
                access_token = generate_access_token(phone, 'owner', None)
                refresh_token = generate_refresh_token(phone, 'owner')
                response = Response({
                  "message": "Login successful",
                  "access_token": access_token,
                  "role": "owner",
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

            return Response({"error": "Invalid OTP"}, status=status.HTTP_400_BAD_REQUEST)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
