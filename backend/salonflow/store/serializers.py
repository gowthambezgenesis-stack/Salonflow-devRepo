from rest_framework import serializers
from .models import Offer, Service, Booking, StaffAvailability, BlockedSlot


class OfferSerializer(serializers.ModelSerializer):
    class Meta:
        model = Offer
        fields = "__all__"


class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = "__all__"


class BookingSerializer(serializers.ModelSerializer):
    service_name = serializers.CharField(source='service.name', read_only=True)
    service_id = serializers.IntegerField(source='service.id', read_only=True)
    service_duration_minutes = serializers.IntegerField(source='service.duration_minutes', read_only=True)
    
    class Meta:
        model = Booking
        fields = [
            'id', 'customer_id', 'customer_name', 'customer_phone',
            'service', 'service_id', 'service_name', 'service_duration_minutes',
            'start_time', 'end_time', 'status', 'notes', 'price',
            'staff_assignment', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'service_name', 'service_id', 'service_duration_minutes', 'customer_id', 'customer_name', 'customer_phone', 'staff_assignment']


class BookingStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Booking.STATUS_CHOICES)


class StaffAvailabilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = StaffAvailability
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class BlockedSlotSerializer(serializers.ModelSerializer):
    class Meta:
        model = BlockedSlot
        fields = '__all__'
        read_only_fields = ['created_at']