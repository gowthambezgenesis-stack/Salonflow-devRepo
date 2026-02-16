from django.urls import path
from .views import (
    OfferCreateView,
    OfferListView,
    OfferDeleteView,
    ServiceListCreateView,
    ServiceRetrieveUpdateDestroyView,
    BookingListView,
    BookingCreateView,
    BookingUpdateStatusView,
    BookingCancelView,
    StaffAvailabilityListView,
    StaffAvailabilityUpdateView,
    BlockedSlotListView,
    BlockedSlotCustomerListView,
    BlockSlotView,
)

urlpatterns = [
    path("offers/", OfferListView.as_view(), name="offer-list"),
    path("offers/create/", OfferCreateView.as_view(), name="offer-create"),
    path("offers/<int:pk>/delete/", OfferDeleteView.as_view(), name="offer-delete"),
    path("services/", ServiceListCreateView.as_view(), name="service-list-create"),
    path(
        "services/<int:pk>/",
        ServiceRetrieveUpdateDestroyView.as_view(),
        name="service-detail",
    ),
    path("bookings/", BookingListView.as_view(), name="booking-list"),
    path("bookings/create/", BookingCreateView.as_view(), name="booking-create"),
    path("bookings/<int:pk>/status/", BookingUpdateStatusView.as_view(), name="booking-update-status"),
    path("bookings/<int:pk>/cancel/", BookingCancelView.as_view(), name="booking-cancel"),
    path("staff-availability/", StaffAvailabilityListView.as_view(), name="staff-availability-list"),
    path("staff-availability/update/", StaffAvailabilityUpdateView.as_view(), name="staff-availability-update"),
    path("blocked-slots/", BlockedSlotListView.as_view(), name="blocked-slots-list"),
    path("blocked-slots/customer/", BlockedSlotCustomerListView.as_view(), name="blocked-slots-customer-list"),
    path("slots/block/", BlockSlotView.as_view(), name="block-slot"),
]
