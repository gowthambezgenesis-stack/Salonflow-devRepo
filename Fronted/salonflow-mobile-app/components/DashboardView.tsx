import React from 'react';
import { Booking, BookingStatus } from '../types';
import { Users, TrendingUp, Clock, CheckCircle2, CalendarDays } from 'lucide-react';

interface DashboardViewProps {
  bookings: Booking[];
  onUpdateStatus: (id: string, status: BookingStatus) => void;
}

const DashboardView: React.FC<DashboardViewProps> = ({ bookings, onUpdateStatus }) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const todaysBookings = bookings.filter(b => b.start_time.startsWith(todayStr));
  const todaysAcceptedBookings = todaysBookings.filter(b => b.status === BookingStatus.ACCEPTED);
  const todaysPendingRequests = todaysBookings.filter(b => b.status === BookingStatus.REQUESTED);
  const revenueToday = todaysBookings
    .filter(b => b.status === BookingStatus.COMPLETED)
    .reduce((acc, curr) => acc + curr.price, 0);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto animate-fade-in">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-6">Dashboard Overview</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm transition-colors duration-200 hover:shadow-md">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-pink-50 dark:bg-pink-900/30 rounded-lg">
              <Users className="h-5 w-5 text-pink-600 dark:text-pink-400" />
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Today's Visits</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{todaysAcceptedBookings.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm transition-colors duration-200 hover:shadow-md">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-50 dark:bg-green-900/30 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Revenue</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">₹{revenueToday.toFixed(2)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm col-span-2 md:col-span-1 transition-colors duration-200 hover:shadow-md">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-50 dark:bg-orange-900/30 rounded-lg">
              <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Pending</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{todaysPendingRequests.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Today's Pending Requests</h2>
            {todaysPendingRequests.length > 0 && (
              <span className="bg-pink-100 dark:bg-pink-900 text-pink-700 dark:text-pink-300 text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                {todaysPendingRequests.length} new
              </span>
            )}
          </div>
          
          {todaysPendingRequests.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl text-center border border-gray-100 dark:border-gray-700 shadow-sm h-64 flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-green-50 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-500 dark:text-green-400" />
              </div>
              <p className="text-gray-900 dark:text-white font-medium">All caught up!</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">No pending requests to review.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {todaysPendingRequests.map(booking => (
                <div key={booking.id} className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white text-lg">{booking.customer_name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{booking.service_name} • <span className="font-medium text-gray-700 dark:text-gray-300">₹{booking.price}</span></p>
                    </div>
                    <span className="text-xs font-bold bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-3 py-1.5 rounded-full">
                      {new Date(booking.start_time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                  {booking.notes && (
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg text-sm text-gray-600 dark:text-gray-300 italic border border-gray-100 dark:border-gray-600">
                      "{booking.notes}"
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Today's Schedule</h2>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden h-64 overflow-y-auto scrollbar-hide">
            {todaysBookings.filter(b => b.status !== BookingStatus.REQUESTED).length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 dark:text-gray-500 text-sm">
                 <CalendarDays className="h-8 w-8 mb-2 opacity-30" />
                 No confirmed bookings for today yet.
               </div>
            ) : (
              <div className="divide-y divide-gray-50 dark:divide-gray-700">
                {todaysBookings
                  .filter(b => b.status !== BookingStatus.REQUESTED)
                  .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
                  .map(booking => (
                  <div key={booking.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="flex-shrink-0 w-16 text-center">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        {new Date(booking.start_time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                      </p>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white">{booking.customer_name}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{booking.service_name}</p>
                    </div>
                    <div>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${
                        booking.status === BookingStatus.COMPLETED ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 
                        booking.status === BookingStatus.CANCELLED ? 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                        booking.status === BookingStatus.REQUESTED ? 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                        booking.status === BookingStatus.DECLINED ? 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                        'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      }`}>
                        {booking.status === BookingStatus.REQUESTED ? 'Pending' : 
                         booking.status === BookingStatus.ACCEPTED ? 'Accepted' :
                         booking.status === BookingStatus.DECLINED ? 'Declined' :
                         booking.status === BookingStatus.COMPLETED ? 'Completed' :
                         booking.status === BookingStatus.CANCELLED ? 'Cancelled' :
                         booking.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;

