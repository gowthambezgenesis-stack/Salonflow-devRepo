from django.db import models
from django.utils import timezone


class Offer(models.Model):
    title = models.CharField(max_length=100)
    valid_until = models.DateField()
    discount_percentage = models.DecimalField(max_digits=5, decimal_places=2)
    description = models.TextField()
    valid_from = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.title


class Service(models.Model):

    name = models.CharField(max_length=100)
    duration_minutes = models.PositiveIntegerField()
    price = models.PositiveIntegerField(help_text="Price in whole currency units (e.g. rupees)")
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name


class Booking(models.Model):
    STATUS_CHOICES = [
        ('requested', 'Requested'),
        ('accepted', 'Accepted'),
        ('declined', 'Declined'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]

    customer_id = models.CharField(max_length=15, help_text="Customer phone number")
    customer_name = models.CharField(max_length=100)
    customer_phone = models.CharField(max_length=15, blank=True, null=True)
    service = models.ForeignKey(Service, on_delete=models.CASCADE, related_name='bookings')
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='requested')
    notes = models.TextField(blank=True, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    staff_assignment = models.PositiveIntegerField(null=True, blank=True, help_text='Staff number assigned (1-based index)')
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.customer_name} - {self.service.name} - {self.status}"


class StaffAvailability(models.Model):
    date = models.DateField(unique=True)
    staff_count = models.PositiveIntegerField(default=1, help_text='Number of available staff for this date')
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['date']
        verbose_name_plural = 'Staff Availabilities'

    def __str__(self):
        return f"{self.date}: {self.staff_count} staff"


class BlockedSlot(models.Model):
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    reason = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['date', 'start_time']
        indexes = [
            models.Index(fields=['date', 'start_time']),
        ]

    def __str__(self):
        return f"Blocked: {self.date} {self.start_time}-{self.end_time}"
