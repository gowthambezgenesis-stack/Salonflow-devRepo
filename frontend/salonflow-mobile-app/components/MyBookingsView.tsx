import React from 'react';
import { Calendar, Clock, CheckCircle2, X, Info, Trash2 } from 'lucide-react';
import { Booking, BookingStatus, SalonProfile } from '../types';

interface MyBookingsViewProps {
  myBookings: Booking[];
  salonProfile: SalonProfile;
  onCancelBooking: (id: string) => void;
  onNavigateToServices: () => void;
}

const MyBookingsView: React.FC<MyBookingsViewProps> = ({
  myBookings,
  salonProfile,
  onCancelBooking,
  onNavigateToServices
}) => {
  const upcomingBookings = myBookings.filter(b =>
    b.status === BookingStatus.REQUESTED ||
    b.status === BookingStatus.ACCEPTED ||
    (new Date(b.start_time) > new Date() && b.status !== BookingStatus.CANCELLED && b.status !== BookingStatus.DECLINED)
  );

  const pastBookings = myBookings.filter(b =>
    b.status === BookingStatus.COMPLETED ||
    b.status === BookingStatus.DECLINED ||
    b.status === BookingStatus.CANCELLED ||
    (new Date(b.start_time) <= new Date() && b.status !== BookingStatus.REQUESTED && b.status !== BookingStatus.ACCEPTED)
  );

  const handleCancelClick = (bookingId: string) => {
    if (window.confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) {
      onCancelBooking(bookingId);
    }
  };

  const BookingCard = ({ booking }: { booking: Booking }) => {
    let statusColor = 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300';
    let statusIcon = null;
    const isCancellable = booking.status === BookingStatus.REQUESTED || booking.status === BookingStatus.ACCEPTED;

    if (booking.status === BookingStatus.ACCEPTED) {
      statusColor = 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      statusIcon = <CheckCircle2 className="h-4 w-4" />;
    } else if (booking.status === BookingStatus.REQUESTED) {
      statusColor = 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      statusIcon = <Clock className="h-4 w-4" />;
    } else if (booking.status === BookingStatus.DECLINED) {
      statusColor = 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      statusIcon = <X className="h-4 w-4" />;
    } else if (booking.status === BookingStatus.CANCELLED) {
      statusColor = 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400';
      statusIcon = <X className="h-4 w-4" />;
    }

    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all mb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-xl hidden md:block">
              <Calendar className="h-6 w-6 text-gray-600 dark:text-gray-400" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h3 className="font-bold text-gray-900 dark:text-white text-lg">{booking.service_name}</h3>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${statusColor}`}>
                  {statusIcon} {booking.status === BookingStatus.REQUESTED ? 'Pending' :
                                booking.status === BookingStatus.ACCEPTED ? 'Accepted' :
                                booking.status === BookingStatus.DECLINED ? 'Declined' :
                                booking.status === BookingStatus.COMPLETED ? 'Completed' :
                                booking.status === BookingStatus.CANCELLED ? 'Cancelled' :
                                booking.status}
                </span>
              </div>
              <div className="flex gap-3 text-sm">
                <span className="text-gray-500 dark:text-gray-400">{salonProfile.name}</span>
                <span className="text-gray-300 dark:text-gray-600">•</span>
                <span className="font-medium text-gray-900 dark:text-white">₹{booking.price}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-xl md:bg-transparent md:p-0">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-pink-500 md:hidden" />
              <span className="font-medium">{new Date(booking.start_time).toLocaleDateString(undefined, {weekday:'short', day:'numeric', month:'short'})}</span>
            </div>
            <div className="w-px h-4 bg-gray-300 dark:bg-gray-600"></div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-pink-500 md:hidden" />
              <span className="font-bold text-gray-900 dark:text-white">{new Date(booking.start_time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
            </div>
          </div>
        </div>

        {booking.notes && (
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400 italic flex items-start gap-2">
            <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
            "{booking.notes}"
          </div>
        )}

        {isCancellable && (
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 flex justify-end">
            <button
              onClick={() => handleCancelClick(booking.id)}
              className="text-red-500 text-sm font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="h-4 w-4" /> Cancel Booking
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="pb-24 md:pb-12 max-w-4xl mx-auto px-4 sm:px-6 pt-4 md:pt-12 min-h-screen animate-fade-in">
      <div className="flex justify-between items-end mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">My Appointments</h2>
        <button onClick={onNavigateToServices} className="text-pink-600 dark:text-pink-400 font-bold text-sm hover:underline bg-pink-50 dark:bg-pink-900/30 px-4 py-2 rounded-lg">
          + Book New
        </button>
      </div>

      {/* Upcoming Section */}
      <div className="mb-8">
        <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2 ml-1">
          Upcoming
        </h3>
        {upcomingBookings.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
              <Calendar className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 font-medium">No upcoming appointments.</p>
            <p className="text-xs text-gray-400 mt-1">Time to treat yourself?</p>
          </div>
        ) : (
          upcomingBookings.map(b => <BookingCard key={b.id} booking={b} />)
        )}
      </div>

      {/* Past Section */}
      <div>
        <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2 ml-1">
          History
        </h3>
        {pastBookings.length === 0 ? (
          <div className="text-center py-8 opacity-50">
            <p className="text-gray-400 text-sm">No history available.</p>
          </div>
        ) : (
          <div className="opacity-75 hover:opacity-100 transition-opacity">
            {pastBookings.map(b => <BookingCard key={b.id} booking={b} />)}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBookingsView;

