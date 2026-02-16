from django.shortcuts import render
from django.utils import timezone
from django.db.models import Q
from django.db import IntegrityError
from django.conf import settings
from datetime import timedelta, time as dt_time, datetime
import logging
from zoneinfo import ZoneInfo
from rest_framework import generics, views
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from user.authentication import JWTAuthentication
from user.permissions import IsOwner, IsOwnerOrReadOnly, IsCustomer
from .models import Offer, Service, Booking, StaffAvailability, BlockedSlot
from .serializers import (
    OfferSerializer, ServiceSerializer, BookingSerializer, BookingStatusUpdateSerializer,
    StaffAvailabilitySerializer, BlockedSlotSerializer
)


try:
    logger = logging.getLogger(__name__)
except Exception:
    logger = None

def safe_log_error(message, exc_info=False):

    if logger:
        try:
            logger.error(message, exc_info=exc_info)
        except Exception:
            print(f"Error: {message}")
    else:
        print(f"Error: {message}")


class OfferCreateView(generics.CreateAPIView):
    queryset = Offer.objects.all()
    serializer_class = OfferSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsOwner]


class OfferListView(generics.ListAPIView):
    queryset = Offer.objects.order_by("-valid_from")
    serializer_class = OfferSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]


class OfferDeleteView(generics.DestroyAPIView):
    queryset = Offer.objects.all()
    serializer_class = OfferSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsOwner]

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)


class ServiceListCreateView(generics.ListCreateAPIView):
    queryset = Service.objects.order_by("id")
    serializer_class = ServiceSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]


class ServiceRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]


class BookingListView(generics.ListAPIView):
    serializer_class = BookingSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        now = timezone.now()

        if hasattr(user, 'role') and user.role == 'owner':
            queryset = Booking.objects.all()
        elif hasattr(user, 'role') and user.role == 'customer' and hasattr(user, 'phone_number') and user.phone_number:
            queryset = Booking.objects.filter(customer_id=user.phone_number)
        else:
            return Booking.objects.none()

        expired_bookings = queryset.filter(
            start_time__lt=now,
            status__in=['requested', 'accepted']
        )
        expired_bookings.update(status='declined')

        return queryset.order_by('start_time', 'created_at')


class BookingCreateView(generics.CreateAPIView):
    serializer_class = BookingSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsCustomer]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        booking = serializer.save(
            customer_id=user.phone_number,
            customer_name=user.name or 'Customer',
            customer_phone=user.phone_number
        )

        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)


def normalize_to_slot_time(dt):

    minutes = (dt.minute // 30) * 30
    return dt.replace(minute=minutes, second=0, microsecond=0)


def get_slot_capacity(booking_start_time, staff_count):
    slot_start = normalize_to_slot_time(booking_start_time)
    slot_end = slot_start + timedelta(minutes=30)

    accepted_bookings = Booking.objects.filter(
        start_time__gte=slot_start,
        start_time__lt=slot_end,
        status='accepted'
    ).order_by('created_at', 'id')

    total_capacity = staff_count * 30
    booked_minutes = sum(b.service.duration_minutes for b in accepted_bookings)
    remaining_minutes = total_capacity - booked_minutes

    return {
        'total_capacity': total_capacity,
        'booked_minutes': booked_minutes,
        'remaining_minutes': remaining_minutes,
        'accepted_bookings': accepted_bookings
    }


def assign_staff_to_booking(booking, staff_count):
    slot_start = normalize_to_slot_time(booking.start_time)
    slot_end = slot_start + timedelta(minutes=30)

    accepted_bookings = Booking.objects.filter(
        start_time__gte=slot_start,
        start_time__lt=slot_end,
        status='accepted'
    ).exclude(id=booking.id).order_by('created_at', 'id')

    staff_usage = {}

    for accepted_booking in accepted_bookings:
        if accepted_booking.staff_assignment:
            staff_num = accepted_booking.staff_assignment
            if staff_num not in staff_usage:
                staff_usage[staff_num] = 0
            staff_usage[staff_num] += accepted_booking.service.duration_minutes


    service_duration = booking.service.duration_minutes

    for staff_num in range(1, staff_count + 1):
        used_minutes = staff_usage.get(staff_num, 0)
        if used_minutes + service_duration <= 30:
            return staff_num

    if staff_usage:
        least_used_staff = min(staff_usage.items(), key=lambda x: x[1])[0]
        return least_used_staff

    return 1


def move_pending_bookings_to_next_slot(slot_start_time, booking_date):
    slot_start = normalize_to_slot_time(slot_start_time)
    slot_end = slot_start + timedelta(minutes=30)

    pending_bookings = Booking.objects.filter(
        start_time__gte=slot_start,
        start_time__lt=slot_end,
        status='requested'
    ).order_by('created_at', 'id')

    moved_bookings = []
    current_time = slot_end

    for booking in pending_bookings:
        next_slot = find_next_available_slot(current_time, booking.service.duration_minutes, booking_date)

        if next_slot:
            booking.start_time = next_slot
            booking.end_time = next_slot + timedelta(minutes=booking.service.duration_minutes)
            booking.save()
            moved_bookings.append(BookingSerializer(booking).data)
            current_time = next_slot + timedelta(minutes=booking.service.duration_minutes)
        else:
            booking.status = 'declined'
            booking.save()

    return moved_bookings


def find_next_available_slot(from_time, service_duration, booking_date):
    current_time = from_time
    max_time = current_time + timedelta(days=7)

    while current_time < max_time:
        slot_start = normalize_to_slot_time(current_time)
        slot_end = slot_start + timedelta(minutes=30)

        is_blocked = BlockedSlot.objects.filter(
            date=slot_start.date(),
            start_time__lte=slot_start.time(),
            end_time__gt=slot_start.time()
        ).exists()

        if not is_blocked:
            try:
                staff_avail = StaffAvailability.objects.get(date=slot_start.date())
                staff_count = staff_avail.staff_count
            except StaffAvailability.DoesNotExist:
                staff_count = 1

            capacity_info = get_slot_capacity(slot_start, staff_count)

            if capacity_info['remaining_minutes'] >= service_duration:
                return slot_start

        current_time = slot_end

    return None


class BookingUpdateStatusView(generics.UpdateAPIView):
    queryset = Booking.objects.all()
    serializer_class = BookingStatusUpdateSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsOwner]

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = BookingStatusUpdateSerializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        new_status = serializer.validated_data['status']

        if new_status == 'accepted' and instance.status != 'accepted':
            booking_date = instance.start_time.date()
            try:
                staff_avail = StaffAvailability.objects.get(date=booking_date)
                staff_count = staff_avail.staff_count
            except StaffAvailability.DoesNotExist:
                staff_count = 1

            staff_assignment = assign_staff_to_booking(instance, staff_count)
            instance.staff_assignment = staff_assignment

            capacity_info = get_slot_capacity(instance.start_time, staff_count)
            remaining_after = capacity_info['remaining_minutes'] - instance.service.duration_minutes

            instance.status = new_status
            instance.save()


            slot_start = normalize_to_slot_time(instance.start_time)
            should_block = remaining_after <= 0

            booking_serializer = BookingSerializer(instance)
            response_data = booking_serializer.data
            response_data['capacity_info'] = {
                'remaining_minutes': remaining_after,
                'total_capacity': capacity_info['total_capacity'],
                'should_block': should_block
            }
            response_data['moved_bookings'] = []

            return Response(response_data, status=status.HTTP_200_OK)
        else:
            instance.status = new_status
            instance.save()

            booking_serializer = BookingSerializer(instance)
            return Response(booking_serializer.data, status=status.HTTP_200_OK)


class BookingCancelView(views.APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsCustomer]

    def post(self, request, pk):
        try:
            booking = Booking.objects.get(pk=pk)
        except Booking.DoesNotExist:
            return Response(
                {'error': 'Booking not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        if booking.customer_id != request.user.phone_number:
            return Response(
                {'error': 'You do not have permission to cancel this booking.'},
                status=status.HTTP_403_FORBIDDEN
            )

        if booking.status == 'completed':
            return Response(
                {'error': 'Cannot cancel a completed booking.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if booking.status == 'cancelled':
            return Response(
                {'error': 'This booking is already cancelled.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        booking.status = 'cancelled'
        booking.save()

        booking_serializer = BookingSerializer(booking)
        return Response(booking_serializer.data, status=status.HTTP_200_OK)


class StaffAvailabilityListView(generics.ListCreateAPIView):
    serializer_class = StaffAvailabilitySerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsOwner]

    def get_queryset(self):
        date_str = self.request.query_params.get('date')
        if date_str:
            try:
                date = datetime.strptime(date_str, '%Y-%m-%d').date()
                return StaffAvailability.objects.filter(date=date)
            except ValueError:
                pass
        return StaffAvailability.objects.all()


class StaffAvailabilityUpdateView(views.APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsOwner]

    def post(self, request):
        date_str = request.data.get('date')
        staff_count = request.data.get('staff_count')

        if not date_str or staff_count is None:
            return Response(
                {'error': 'date and staff_count are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            date = datetime.strptime(date_str, '%Y-%m-%d').date()
            staff_count = int(staff_count)
            if staff_count < 1:
                return Response(
                    {'error': 'staff_count must be at least 1'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except (ValueError, TypeError) as e:
            safe_log_error(f'Invalid date or staff_count format: {e}')
            return Response(
                {'error': 'Invalid date or staff_count format'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            availability, created = StaffAvailability.objects.get_or_create(
                date=date,
                defaults={'staff_count': staff_count}
            )

            if not created:
                availability.staff_count = staff_count
                availability.save()

            serializer = StaffAvailabilitySerializer(availability)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except IntegrityError as e:
            try:
                safe_log_error(f'Database integrity error updating staff availability: {e}')
                availability = StaffAvailability.objects.get(date=date)
                availability.staff_count = staff_count
                availability.save()
                serializer = StaffAvailabilitySerializer(availability)
                return Response(serializer.data, status=status.HTTP_200_OK)
            except StaffAvailability.DoesNotExist:
                safe_log_error('StaffAvailability not found after IntegrityError')
                return Response(
                    {'error': 'Failed to update staff availability due to database conflict'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            except Exception as e:
                safe_log_error(f'Error in IntegrityError handler: {str(e)}', exc_info=True)
                return Response(
                    {'error': f'Failed to update staff availability: {str(e)}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        except Exception as e:
            import traceback
            error_trace = traceback.format_exc()
            safe_log_error(f'Error updating staff availability: {str(e)}\n{error_trace}')
            return Response(
                {'error': f'Failed to update staff availability: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class BlockedSlotListView(generics.ListAPIView):
    serializer_class = BlockedSlotSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsOwner]

    def get_queryset(self):
        date_str = self.request.query_params.get('date')
        if date_str:
            try:
                date = datetime.strptime(date_str, '%Y-%m-%d').date()
                return BlockedSlot.objects.filter(date=date)
            except ValueError:
                pass
        return BlockedSlot.objects.all().order_by('date', 'start_time')


class BlockedSlotCustomerListView(generics.ListAPIView):
    """Customer-accessible endpoint to view blocked slots for booking purposes"""
    serializer_class = BlockedSlotSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        date_str = self.request.query_params.get('date')
        if date_str:
            try:
                date = datetime.strptime(date_str, '%Y-%m-%d').date()
                return BlockedSlot.objects.filter(date=date).order_by('start_time')
            except ValueError:
                pass
        
        return BlockedSlot.objects.none()


class BlockSlotView(views.APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsOwner]

    def post(self, request):
        booking_id = request.data.get('booking_id')

        if not booking_id:
            return Response(
                {'error': 'booking_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            booking_id = int(booking_id)
            booking = Booking.objects.get(pk=booking_id)
        except (ValueError, TypeError):
            return Response(
                {'error': 'Invalid booking_id format'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Booking.DoesNotExist:
            return Response(
                {'error': 'Booking not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        if booking.status != 'accepted':
            return Response(
                {'error': 'Can only block slots for accepted bookings'},
                status=status.HTTP_400_BAD_REQUEST
            )

        booking_start = booking.start_time
        
        default_tz = getattr(settings, 'BLOCKED_SLOT_TIMEZONE', 'Asia/Kolkata')
        
        slot_start_minutes = (booking_start.minute // 30) * 30
        slot_start_time_utc = booking_start.replace(minute=slot_start_minutes, second=0, microsecond=0)
        slot_end_time_utc = slot_start_time_utc + timedelta(minutes=30)
        if timezone.is_aware(slot_start_time_utc):
            try:
                local_tz = ZoneInfo(default_tz)
                slot_start_time_local = slot_start_time_utc.astimezone(local_tz)
                slot_end_time_local = slot_end_time_utc.astimezone(local_tz)
                
                slot_date = slot_start_time_local.date()
                slot_start_time_only = slot_start_time_local.time()
                slot_end_time_only = slot_end_time_local.time()
            except Exception as e:
                safe_log_error(f'Error converting timezone for blocked slot: {e}')
                slot_date = slot_start_time_utc.date()
                slot_start_time_only = slot_start_time_utc.time()
                slot_end_time_only = slot_end_time_utc.time()
        else:
            slot_date = slot_start_time_utc.date()
            slot_start_time_only = slot_start_time_utc.time()
            slot_end_time_only = slot_end_time_utc.time()

        is_already_blocked = BlockedSlot.objects.filter(
            date=slot_date,
            start_time__lte=slot_start_time_only,
            end_time__gt=slot_start_time_only
        ).exists()

        if is_already_blocked:
            return Response(
                {'error': 'This slot is already blocked'},
                status=status.HTTP_400_BAD_REQUEST
            )

        blocked_slot = BlockedSlot.objects.create(
            date=slot_date,
            start_time=slot_start_time_only,
            end_time=slot_end_time_only,
            reason=f"Blocked after accepting booking {booking.id}"
        )

        booking_date = slot_start_time_utc.date()
        moved_bookings = move_pending_bookings_to_next_slot(slot_start_time_utc, booking_date)

        return Response({
            'message': 'Slot blocked successfully',
            'blocked_slot': BlockedSlotSerializer(blocked_slot).data,
            'moved_bookings': moved_bookings
        }, status=status.HTTP_200_OK)

    def find_next_available_slot(self, from_time, service_duration):
        """Find next available slot after from_time"""
        current_time = from_time
        max_time = current_time + timedelta(days=7)

        while current_time < max_time:
            if current_time.tzinfo is None:
                current_time = timezone.make_aware(current_time)
            slot_minutes = (current_time.minute // 30) * 30
            slot_start = current_time.replace(minute=slot_minutes, second=0, microsecond=0)
            slot_end = slot_start + timedelta(minutes=30)

            is_blocked = BlockedSlot.objects.filter(
                date=slot_start.date(),
                start_time__lte=slot_start.time(),
                end_time__gt=slot_start.time()
            ).exists()

            if not is_blocked:
                if self.check_slot_capacity(slot_start, service_duration):
                    return slot_start

            current_time = slot_end

        return None

    def check_slot_capacity(self, slot_start, service_duration):
        try:
            staff_avail = StaffAvailability.objects.get(date=slot_start.date())
            staff_count = staff_avail.staff_count
        except StaffAvailability.DoesNotExist:
            staff_count = 1

        slot_end = slot_start + timedelta(minutes=30)
        total_capacity_minutes = staff_count * 30

        booked_bookings = Booking.objects.filter(
            start_time__gte=slot_start,
            start_time__lt=slot_end,
            status='accepted'
        )

        booked_minutes = sum(b.service.duration_minutes for b in booked_bookings)

        return (booked_minutes + service_duration) <= total_capacity_minutes
