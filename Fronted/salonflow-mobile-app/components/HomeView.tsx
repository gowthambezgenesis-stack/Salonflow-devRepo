import React from 'react';
import { Scissors, Calendar, Clock, ChevronRight, Sun, Moon } from 'lucide-react';
import { Booking, BookingStatus, Offer } from '../types';
import ExclusiveOffers from './ExclusiveOffers';

interface HomeViewProps {
  userName: string;
  myBookings: Booking[];
  offers: Offer[];
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onNavigateToServices: () => void;
  onNavigateToBookings: () => void;
  onOfferClick: (offer: Offer) => void;
}

const HomeView: React.FC<HomeViewProps> = ({
  userName,
  myBookings,
  offers,
  isDarkMode,
  onToggleTheme,
  onNavigateToServices,
  onNavigateToBookings,
  onOfferClick
}) => {
  const now = new Date();
  const upcomingBookings = myBookings.filter(b => {
    const bookingStartTime = new Date(b.start_time);
    return (b.status === BookingStatus.REQUESTED || b.status === BookingStatus.ACCEPTED) &&
           bookingStartTime > now;
  });

  const nearestBooking = upcomingBookings.length > 0
    ? upcomingBookings.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())[0]
    : null;

  return (
    <div className="pb-24 md:pb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 md:pt-8 animate-fade-in">
      {/* Header Mobile */}
      <div className="flex justify-between items-center mb-6 md:hidden">
        <div className="flex items-center gap-2">
          <div className="bg-pink-600 p-1.5 rounded-lg">
            <Scissors className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-gray-900 dark:text-white text-lg">SalonFlow</span>
        </div>
        <button onClick={onToggleTheme} className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
          {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
      </div>

      {/* Hero */}
      <div className="bg-gradient-to-br from-pink-600 to-purple-700 text-white p-6 md:p-10 rounded-3xl shadow-lg mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl"></div>
        <div className="relative z-10">
          <p className="text-pink-100 text-sm md:text-base mb-1 font-medium opacity-90">Welcome back,</p>
          <h1 className="text-3xl md:text-4xl font-bold mb-6 tracking-tight">{userName.split(' ')[0]} 👋</h1>

          <div className="bg-white/10 p-4 md:p-6 rounded-2xl backdrop-blur-md border border-white/20 max-w-md hover:bg-white/20 transition-colors cursor-default">
            <p className="text-xs font-bold text-pink-200 uppercase tracking-wider mb-3">Upcoming Visit</p>
            {nearestBooking ? (
               <div>
                 <div className="flex items-baseline gap-2 mb-2">
                   <p className="text-2xl font-bold">
                     {new Date(nearestBooking.start_time).toLocaleDateString(undefined, {weekday: 'short', day: 'numeric', month: 'short'})}
                   </p>
                   <p className="text-lg opacity-90">
                     at {new Date(nearestBooking.start_time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                   </p>
                 </div>
                 <div className="flex items-center gap-2 mb-2">
                   <Scissors className="h-4 w-4" />
                   <p className="text-base font-semibold text-white/95">{nearestBooking.service_name}</p>
                 </div>
                 <div className="flex items-center gap-2 text-sm">
                   <Clock className="h-3.5 w-3.5 opacity-80" />
                   <span className="opacity-90">
                     {nearestBooking.status === BookingStatus.ACCEPTED ? 'Confirmed' : 'Pending'}
                   </span>
                   <span className="opacity-60">•</span>
                   <span className="opacity-90">₹{nearestBooking.price}</span>
                 </div>
               </div>
            ) : (
              <div>
                <p className="text-lg font-medium mb-2">No upcoming visit</p>
                <button onClick={onNavigateToServices} className="text-sm font-bold mt-2 bg-white text-pink-600 px-4 py-2 rounded-lg hover:bg-pink-50 transition-colors inline-block">
                  Book Now
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Offers Grid */}
      <ExclusiveOffers
        offers={offers}
        onBookClick={onOfferClick}
      />

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={onNavigateToServices}
            className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between group hover:border-pink-300 dark:hover:border-pink-700 hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="bg-gray-900 dark:bg-gray-700 p-4 rounded-full group-hover:bg-pink-600 dark:group-hover:bg-pink-600 transition-colors text-white">
                <Calendar className="h-6 w-6" />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">Book Appointment</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Find a slot that suits you</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400 dark:text-gray-500 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors" />
          </button>

          <button
            onClick={onNavigateToBookings}
            className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between group hover:border-pink-300 dark:hover:border-pink-700 hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-full group-hover:bg-pink-100 dark:group-hover:bg-pink-900/30 transition-colors text-gray-600 dark:text-gray-300 group-hover:text-pink-600 dark:group-hover:text-pink-400">
                <Clock className="h-6 w-6" />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">History & Status</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Track your bookings</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400 dark:text-gray-500 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomeView;

