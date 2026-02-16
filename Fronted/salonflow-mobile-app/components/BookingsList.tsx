import React, { useState, useEffect } from 'react';
import { Booking, BookingStatus, StaffAvailability, BlockedSlot, SlotInfo } from '../types';
import { Search, Filter, Phone, Check, X, Calendar, Clock, Users, Ban, Plus, Minus } from 'lucide-react';
import apiClient from '../services/api';

interface BookingsListProps {
  bookings: Booking[];
  onUpdateStatus: (id: string, status: BookingStatus) => void;
}

interface AcceptedBookingCard {
  booking: Booking;
  slotTime: string;
  capacityInfo?: {
    remaining_minutes: number;
    total_capacity: number;
    should_block: boolean;
  };
  movedBookings?: Booking[];
  acceptedCount?: number;
}

const BookingsList: React.FC<BookingsListProps> = ({ bookings, onUpdateStatus }) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);
  const [staffAvailability, setStaffAvailability] = useState<{ [key: string]: number }>({});
  const [blockedSlots, setBlockedSlots] = useState<Set<string>>(new Set());
  const [acceptedBookingCard, setAcceptedBookingCard] = useState<AcceptedBookingCard | null>(null);

  const filteredBookings = bookings.filter(b => {
    const bookingStartTime = new Date(b.start_time);
    const now = new Date();
    
    const bookingDate = bookingStartTime.toDateString();
    const todayDate = now.toDateString();
    const isToday = bookingDate === todayDate;
    
    if (!isToday) {
      const isExpired = bookingStartTime < now;
      if (isExpired) return false;
    }

    const matchesStatus = filterStatus === 'all' || b.status === filterStatus;
    const matchesSearch =
      b.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.service_name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  }).sort((a, b) => {
    const dateCompare = new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
    if (dateCompare !== 0) return dateCompare;
    const aCreated = a.created_at ? new Date(a.created_at).getTime() : 0;
    const bCreated = b.created_at ? new Date(b.created_at).getTime() : 0;
    return aCreated - bCreated;
  });

  const normalizeToSlotTime = (dateTime: string): string => {
    const dt = new Date(dateTime);
    const minutes = Math.floor(dt.getMinutes() / 30) * 30;
    dt.setMinutes(minutes, 0, 0);
    return dt.toISOString();
  };

  const getSlotKey = (dateTime: string): string => {
    const dt = new Date(dateTime);
    const slotTime = normalizeToSlotTime(dateTime);
    const dateStr = dt.toISOString().split('T')[0];
    const timeStr = new Date(slotTime).toTimeString().slice(0, 5);
    return `${dateStr}_${timeStr}`;
  };

  const groupBookingsByDateAndSlot = (bookings: Booking[]) => {
    const grouped: { [dateKey: string]: { [slotKey: string]: Booking[] } } = {};

    bookings.forEach(booking => {
      const dateKey = new Date(booking.start_time).toDateString();
      const slotKey = getSlotKey(booking.start_time);

      if (!grouped[dateKey]) {
        grouped[dateKey] = {};
      }
      if (!grouped[dateKey][slotKey]) {
        grouped[dateKey][slotKey] = [];
      }
      grouped[dateKey][slotKey].push(booking);
    });

    Object.keys(grouped).forEach(dateKey => {
      Object.keys(grouped[dateKey]).forEach(slotKey => {
        grouped[dateKey][slotKey].sort((a, b) => {
          const aCreated = a.created_at ? new Date(a.created_at).getTime() : 0;
          const bCreated = b.created_at ? new Date(b.created_at).getTime() : 0;
          return aCreated - bCreated;
        });
      });
    });

    return grouped;
  };

  const calculateSlotMetrics = (slotBookings: Booking[], dateKey: string): SlotInfo => {
    const slotTime = slotBookings[0]?.start_time || '';
    const staffCount = staffAvailability[dateKey] || 1;
    const totalCapacityMinutes = staffCount * 30;

    const acceptedBookings = slotBookings.filter(b => b.status === BookingStatus.ACCEPTED);
    const bookedMinutes = acceptedBookings.reduce((sum, b) => {
      return sum + (b.service_duration_minutes || 30);
    }, 0);

    const remainingMinutes = Math.max(0, totalCapacityMinutes - bookedMinutes);
    const slotKey = getSlotKey(slotTime);
    const isBlocked = blockedSlots.has(slotKey);

    return {
      time: new Date(slotTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      bookings: slotBookings,
      bookedCount: acceptedBookings.length,
      capacity: staffCount,
      remainingTime: remainingMinutes,
      isBlocked
    };
  };

  useEffect(() => {
    const fetchStaffAvailability = async () => {
      try {
        const response = await apiClient.get('/api/store/staff-availability/');
        const availability: { [key: string]: number } = {};
        response.data.forEach((item: StaffAvailability) => {

          const [year, month, day] = item.date.split('-').map(Number);
          const dateObj = new Date(year, month - 1, day);
          const dateKey = dateObj.toDateString();
          availability[dateKey] = item.staff_count;
        });
        setStaffAvailability(availability);
      } catch (error) {
        console.error('Error fetching staff availability:', error);
      }
    };

    fetchStaffAvailability();
  }, []);

  useEffect(() => {
    const fetchBlockedSlots = async () => {
      try {
        const response = await apiClient.get('/api/store/blocked-slots/');
        const blockedSlotsSet = new Set<string>();
        response.data.forEach((slot: BlockedSlot) => {
          const slotDateTimeStr = `${slot.date}T${slot.start_time}`;
          const dt = new Date(slotDateTimeStr);
          const minutes = Math.floor(dt.getMinutes() / 30) * 30;
          dt.setMinutes(minutes, 0, 0);
          const dateStr = dt.toISOString().split('T')[0];
          const timeStr = dt.toTimeString().slice(0, 5);
          const slotKey = `${dateStr}_${timeStr}`;
          blockedSlotsSet.add(slotKey);
        });
        setBlockedSlots(blockedSlotsSet);
      } catch (error) {
        console.error('Error fetching blocked slots:', error);
        setBlockedSlots(new Set());
      }
    };

    fetchBlockedSlots();
  }, [bookings]);

  const groupedBookings = groupBookingsByDateAndSlot(filteredBookings);
  const dateKeys = Object.keys(groupedBookings).sort((a, b) =>
    new Date(a).getTime() - new Date(b).getTime()
  );


  const handleAcceptBooking = async (booking: Booking) => {
    try {

      const response = await apiClient.patch(`/api/store/bookings/${booking.id}/status/`, {
        status: BookingStatus.ACCEPTED
      });

      const updatedBooking = response.data;
      const capacityInfo = response.data.capacity_info;


      const slotKey = getSlotKey(booking.start_time);
      const slotBookings = filteredBookings.filter(b => getSlotKey(b.start_time) === slotKey);
      const acceptedCount = slotBookings.filter(b =>
        b.status === BookingStatus.ACCEPTED || b.id === updatedBooking.id
      ).length + 1;


      const slotTime = normalizeToSlotTime(booking.start_time);
      setAcceptedBookingCard({
        booking: updatedBooking,
        slotTime: new Date(slotTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        capacityInfo,
        movedBookings: [],
        acceptedCount
      });


      onUpdateStatus(updatedBooking.id, BookingStatus.ACCEPTED);
    } catch (error: any) {
      console.error('Error accepting booking:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Unknown error occurred';
      alert(`Failed to accept booking: ${errorMessage}. Please try again.`);
    }
  };


  const handleBlockSlot = async () => {
    if (!acceptedBookingCard) return;

    try {
      const response = await apiClient.post('/api/store/slots/block/', {
        booking_id: acceptedBookingCard.booking.id
      });


      const slotKey = getSlotKey(acceptedBookingCard.booking.start_time);
      setBlockedSlots(prev => new Set([...prev, slotKey]));

      const movedBookings = response.data.moved_bookings || [];


      setAcceptedBookingCard(null);


      window.location.reload();
    } catch (error: any) {
      console.error('Error blocking slot:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Unknown error occurred';
      alert(`Failed to block slot: ${errorMessage}. Please try again.`);
    }
  };


  const handleStaffCountChange = async (dateKey: string, delta: number) => {
    const currentCount = staffAvailability[dateKey] || 1;
    const newCount = Math.max(1, currentCount + delta);


    let dateStr: string;
    try {
      const dateObj = new Date(dateKey);

      if (isNaN(dateObj.getTime())) {

        const firstBooking = filteredBookings.find(b => {
          const bookingDate = new Date(b.start_time).toDateString();
          return bookingDate === dateKey;
        });
        if (firstBooking) {
          const bookingDate = new Date(firstBooking.start_time);

          const year = bookingDate.getFullYear();
          const month = String(bookingDate.getMonth() + 1).padStart(2, '0');
          const day = String(bookingDate.getDate()).padStart(2, '0');
          dateStr = `${year}-${month}-${day}`;
        } else {
          throw new Error('Invalid date');
        }
      } else {

        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        dateStr = `${year}-${month}-${day}`;
      }
    } catch (error) {
      console.error('Error parsing date:', error);
      alert('Failed to parse date. Please try again.');
      return;
    }

    try {
      await apiClient.post('/api/store/staff-availability/update/', {
        date: dateStr,
        staff_count: newCount
      });

      setStaffAvailability(prev => ({
        ...prev,
        [dateKey]: newCount
      }));
    } catch (error: any) {
      console.error('Error updating staff availability:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Unknown error occurred';
      alert(`Failed to update staff count: ${errorMessage}. Please try again.`);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedBookingId(expandedBookingId === id ? null : id);
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200 flex flex-col pb-32">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Manage Bookings</h1>

        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search customer or service..."
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-400"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative">
            <select
              className="h-full pl-4 pr-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent appearance-none shadow-sm font-medium text-gray-700 dark:text-gray-300"
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value={BookingStatus.REQUESTED}>Pending</option>
              <option value={BookingStatus.ACCEPTED}>Accepted</option>
              <option value={BookingStatus.COMPLETED}>Completed</option>
              <option value={BookingStatus.DECLINED}>Declined</option>
            </select>
            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="hidden md:block space-y-6 flex-1 overflow-y-auto">
        {dateKeys.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
            <p className="text-gray-400 dark:text-gray-500">No bookings found matching your filters.</p>
          </div>
        ) : (
          dateKeys.map(dateKey => {
            const dateObj = new Date(dateKey);
            const isToday = dateKey === new Date().toDateString();
            const isTomorrow = dateKey === new Date(Date.now() + 86400000).toDateString();
            const slotGroups = groupedBookings[dateKey];
            const slotKeys = Object.keys(slotGroups).sort();
            const staffCount = staffAvailability[dateKey] || 1;

            return (
              <div key={dateKey} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className={`px-6 py-4 border-b border-gray-200 dark:border-gray-700 ${
                  blockedSlots.has(dateKey.split('_')[0]) ? 'bg-red-50 dark:bg-red-900/20' : 'bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                          {isToday ? 'Today' : isTomorrow ? 'Tomorrow' : dateObj.toLocaleDateString(undefined, {weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'})}
                        </h3>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 bg-white dark:bg-gray-700 px-3 py-1.5 rounded-lg shadow-sm">
                        <Users className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                        <button
                          onClick={() => handleStaffCountChange(dateKey, -1)}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                          aria-label="Decrease staff count"
                        >
                          <Minus className="h-3 w-3 text-gray-600 dark:text-gray-300" />
                        </button>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">available staff</span>
                        <span className="text-sm font-bold text-gray-900 dark:text-white min-w-[20px] text-center">{staffCount}</span>
                        <button
                          onClick={() => handleStaffCountChange(dateKey, 1)}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                          aria-label="Increase staff count"
                        >
                          <Plus className="h-3 w-3 text-gray-600 dark:text-gray-300" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {slotKeys.map(slotKey => {
                    const slotBookings = slotGroups[slotKey];
                    const metrics = calculateSlotMetrics(slotBookings, dateKey);
                    const slotDate = slotBookings[0]?.start_time || '';
                    const slotDateObj = new Date(slotDate);

                    return (
                      <div
                        key={slotKey}
                        className={`p-4 ${metrics.isBlocked ? 'bg-red-50 dark:bg-red-900/10' : ''}`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <Clock className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                            <span className="font-bold text-gray-900 dark:text-white">{metrics.time}</span>
                            {metrics.isBlocked && (
                              <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-bold rounded">
                                BLOCKED
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-gray-600 dark:text-gray-400">
                              <Users className="h-3 w-3 inline mr-1" />
                              {metrics.bookedCount}/{metrics.capacity}
                            </span>
                            <span className={`font-medium ${
                              metrics.remainingTime > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                            }`}>
                              {metrics.remainingTime} min remaining
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          {slotBookings.map((booking) => (
                            <div
                              key={booking.id}
                              className={`flex items-center justify-between p-3 rounded-lg ${
                                booking.status === BookingStatus.ACCEPTED
                                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                                  : booking.status === BookingStatus.COMPLETED
                                  ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                                  : 'bg-gray-50 dark:bg-gray-700/50'
                              }`}
                            >
                              <div className="flex items-center gap-3 flex-1">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-gray-900 dark:text-white">{booking.customer_name}</span>
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                      booking.status === BookingStatus.REQUESTED ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                                      booking.status === BookingStatus.ACCEPTED ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                      booking.status === BookingStatus.COMPLETED ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                      'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                                    }`}>
                                      {booking.status === BookingStatus.REQUESTED ? 'Pending' :
                                       booking.status === BookingStatus.ACCEPTED ? 'Accepted' :
                                       booking.status === BookingStatus.COMPLETED ? 'Completed' :
                                       booking.status}
                                    </span>
                                  </div>
                                  <div className="text-sm text-gray-600 dark:text-gray-400">
                                    {booking.service_name} • {booking.service_duration_minutes || 30} min • ₹{booking.price}
                                    {booking.staff_assignment && (
                                      <span className="ml-2 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-bold rounded">
                                        Staff {booking.staff_assignment}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                {booking.status === BookingStatus.REQUESTED && (
                                  <button
                                    onClick={() => handleAcceptBooking(booking)}
                                    className="bg-gray-900 dark:bg-pink-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-800 dark:hover:bg-pink-700"
                                  >
                                    Accept
                                  </button>
                                )}
                                {booking.status === BookingStatus.ACCEPTED && (
                                  <button
                                    onClick={() => onUpdateStatus(booking.id, BookingStatus.COMPLETED)}
                                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 text-xs font-bold border border-blue-100 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg"
                                  >
                                    Complete
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="md:hidden space-y-4 mb-20">
        {dateKeys.length === 0 ? (
          <p className="text-center text-gray-400 dark:text-gray-500 py-10">No bookings found.</p>
        ) : (
          dateKeys.map(dateKey => {
            const dateObj = new Date(dateKey);
            const isToday = dateKey === new Date().toDateString();
            const isTomorrow = dateKey === new Date(Date.now() + 86400000).toDateString();
            const slotGroups = groupedBookings[dateKey];
            const slotKeys = Object.keys(slotGroups).sort();
            const staffCount = staffAvailability[dateKey] || 1;

            return (
              <div key={dateKey} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                      <h3 className="font-bold text-gray-900 dark:text-white">
                        {isToday ? 'Today' : isTomorrow ? 'Tomorrow' : dateObj.toLocaleDateString(undefined, {weekday: 'long', month: 'long', day: 'numeric'})}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 bg-white dark:bg-gray-700 px-2 py-1 rounded-lg shadow-sm">
                      <Users className="h-3 w-3 text-gray-600 dark:text-gray-300" />
                      <button
                        onClick={() => handleStaffCountChange(dateKey, -1)}
                        className="p-0.5 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                        aria-label="Decrease staff count"
                      >
                        <Minus className="h-3 w-3 text-gray-600 dark:text-gray-300" />
                      </button>
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">available staff</span>
                      <span className="text-xs font-bold text-gray-900 dark:text-white min-w-[16px] text-center">{staffCount}</span>
                      <button
                        onClick={() => handleStaffCountChange(dateKey, 1)}
                        className="p-0.5 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                        aria-label="Increase staff count"
                      >
                        <Plus className="h-3 w-3 text-gray-600 dark:text-gray-300" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {slotKeys.map(slotKey => {
                    const slotBookings = slotGroups[slotKey];
                    const metrics = calculateSlotMetrics(slotBookings, dateKey);

                    return (
                      <div key={slotKey} className="p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3 text-gray-500" />
                            <span className="font-bold text-sm text-gray-900 dark:text-white">{metrics.time}</span>
                            {metrics.isBlocked && (
                              <span className="px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-[10px] font-bold rounded">
                                BLOCKED
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            {metrics.bookedCount}/{metrics.capacity} • {metrics.remainingTime} min
                          </div>
                        </div>
                        {slotBookings.map((booking) => (
                          <div
                            key={booking.id}
                            className={`p-2 mb-2 rounded-lg ${
                              booking.status === BookingStatus.ACCEPTED
                                ? 'bg-green-50 dark:bg-green-900/20'
                                : booking.status === BookingStatus.COMPLETED
                                ? 'bg-blue-50 dark:bg-blue-900/20'
                                : 'bg-gray-50 dark:bg-gray-700/50'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-gray-900 dark:text-white">{booking.customer_name}</span>
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  booking.status === BookingStatus.REQUESTED ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                                  booking.status === BookingStatus.ACCEPTED ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                  booking.status === BookingStatus.COMPLETED ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                  'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                                }`}>
                                  {booking.status === BookingStatus.REQUESTED ? 'Pending' :
                                   booking.status === BookingStatus.ACCEPTED ? 'Accepted' :
                                   booking.status === BookingStatus.COMPLETED ? 'Completed' :
                                   booking.status}
                                </span>
                              </div>
                              {booking.status === BookingStatus.REQUESTED && (
                                <button
                                  onClick={() => handleAcceptBooking(booking)}
                                  className="bg-gray-900 dark:bg-pink-600 text-white px-2 py-1 rounded text-xs font-bold"
                                >
                                  Accept
                                </button>
                              )}
                              {booking.status === BookingStatus.ACCEPTED && (
                                <button
                                  onClick={() => onUpdateStatus(booking.id, BookingStatus.COMPLETED)}
                                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 text-xs font-bold border border-blue-100 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded"
                                >
                                  Complete
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {acceptedBookingCard && (
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-2xl z-50 p-4 md:p-6 animate-slide-up">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Booking Accepted</h3>
              <button
                onClick={() => setAcceptedBookingCard(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg mb-4">
              <div className="flex items-center gap-3 mb-2">
                <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                <span className="font-bold text-gray-900 dark:text-white">{acceptedBookingCard.booking.customer_name}</span>
                {acceptedBookingCard.booking.staff_assignment && (
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-bold rounded">
                    Staff {acceptedBookingCard.booking.staff_assignment}
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <p>{acceptedBookingCard.booking.service_name}</p>
                <p>{new Date(acceptedBookingCard.booking.start_time).toLocaleDateString()} at {acceptedBookingCard.slotTime}</p>
              </div>
            </div>

            {acceptedBookingCard.capacityInfo && (
              <div className={`p-4 rounded-lg mb-4 ${
                acceptedBookingCard.capacityInfo.remaining_minutes <= 0
                  ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                  : acceptedBookingCard.capacityInfo.remaining_minutes < 15
                  ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
                  : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-gray-900 dark:text-white">
                    {acceptedBookingCard.acceptedCount || 1} booking{acceptedBookingCard.acceptedCount !== 1 ? 's' : ''} accepted
                  </span>
                  <span className={`font-bold ${
                    acceptedBookingCard.capacityInfo.remaining_minutes <= 0
                      ? 'text-red-600 dark:text-red-400'
                      : acceptedBookingCard.capacityInfo.remaining_minutes < 15
                      ? 'text-yellow-600 dark:text-yellow-400'
                      : 'text-green-600 dark:text-green-400'
                  }`}>
                    {acceptedBookingCard.capacityInfo.remaining_minutes > 0
                      ? `${acceptedBookingCard.capacityInfo.remaining_minutes} min remaining`
                      : `${Math.abs(acceptedBookingCard.capacityInfo.remaining_minutes)} min overflow`
                    }
                  </span>
                </div>
                {acceptedBookingCard.capacityInfo.remaining_minutes <= 0 && (
                  <p className="text-sm text-red-700 dark:text-red-400 font-medium">
                    ⚠️ Slot capacity exhausted! Block this slot to prevent overbooking.
                  </p>
                )}
                {acceptedBookingCard.movedBookings && acceptedBookingCard.movedBookings.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      📤 {acceptedBookingCard.movedBookings.length} pending booking(s) moved to next available slots
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleBlockSlot}
                className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 ${
                  acceptedBookingCard.capacityInfo?.should_block || acceptedBookingCard.capacityInfo?.remaining_minutes <= 0
                    ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                <Ban className="h-4 w-4" />
                Block This Slot
              </button>
              <button
                onClick={() => setAcceptedBookingCard(null)}
                className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingsList;
