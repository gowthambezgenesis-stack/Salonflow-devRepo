import React, { useState, useEffect, useRef } from 'react';
import {
  Home,
  Calendar,
  Clock,
  User,
  ChevronRight,
  Tag,
  ChevronLeft,
  CheckCircle2,
  Search,
  Info,
  X,
  Scissors,
  LogOut,
  ArrowUpDown,
  Trash2,
  Sun,
  Moon
} from 'lucide-react';
import { Booking, BookingStatus, Offer, Service, SalonProfile, BlockedSlot } from '../types';
import OffersList from './OffersList';
import ExclusiveOffers from './ExclusiveOffers';
import ConfirmationModal from './ConfirmationModal';
import HomeView from './HomeView';
import MyBookingsView from './MyBookingsView';
import apiClient from '../services/api';

interface CustomerAppProps {
  user?: { name: string; phone: string };
  bookings: Booking[];
  services: Service[];
  offers: Offer[];
  salonProfile?: SalonProfile;
  onCreateBooking?: (booking: Booking) => void;
  onCancelBooking?: (id: string) => void;
  onLogout: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

const CustomerApp: React.FC<CustomerAppProps> = ({
  user, bookings, services, offers, salonProfile, onCreateBooking, onCancelBooking, onLogout, isDarkMode, onToggleTheme
}) => {
  const getInitialView = (): 'home' | 'services' | 'service_details' | 'slots' | 'success' | 'my_bookings' | 'offers' => {
    const savedView = localStorage.getItem('customerView');
    const validViews: Array<'home' | 'services' | 'service_details' | 'slots' | 'success' | 'my_bookings' | 'offers'> =
      ['home', 'services', 'service_details', 'slots', 'success', 'my_bookings', 'offers'];
    if (savedView && validViews.includes(savedView as any)) {
      return savedView as any;
    }
    return 'home';
  };

  const [view, setView] = useState<'home' | 'services' | 'service_details' | 'slots' | 'success' | 'my_bookings' | 'offers'>(getInitialView());

  useEffect(() => {
    if (view !== 'success') {
      localStorage.setItem('customerView', view);
    }
  }, [view]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);

  const getNearestUpcomingDate = (): Date => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (!salonProfile) {
      return today;
    }

    const [closeHour, closeMinute] = salonProfile.close_time.split(':').map(Number);
    const closingTime = new Date(today);
    closingTime.setHours(closeHour, closeMinute, 0, 0);

    if (now < closingTime) {
      return today;
    }

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  };
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<'default' | 'price_asc' | 'price_desc' | 'duration_asc' | 'duration_desc'>('default');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [bookingNotes, setBookingNotes] = useState('');
  const [hasPermission, setHasPermission] = useState(false);

  const activeOffers = offers.filter(offer => {
    if (!offer.active) return false;
    const validUntilDate = new Date(offer.valid_until);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    validUntilDate.setHours(0, 0, 0, 0);
    return validUntilDate >= today;
  });


  const now = new Date();
  const myBookings = bookings
    .filter(b => {
      const bookingStartTime = new Date(b.start_time);
      const isExpired = bookingStartTime < now;
      return !isExpired;
    })
    .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());

  useEffect(() => {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        setHasPermission(true);
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then((permission) => {
          if (permission === 'granted') setHasPermission(true);
        });
      }
    }
  }, []);

  const prevBookingsRef = useRef<Booking[]>([]);

  useEffect(() => {
    if (prevBookingsRef.current.length > 0) {
      myBookings.forEach(currentBooking => {
        const prevBooking = prevBookingsRef.current.find(b => b.id === currentBooking.id);

        if (prevBooking && prevBooking.status !== currentBooking.status) {
          if (hasPermission) {
             const title = currentBooking.status === BookingStatus.ACCEPTED ? 'Booking Confirmed! 🎉'
               : currentBooking.status === BookingStatus.DECLINED ? 'Booking Update'
               : 'Booking Status Change';

             const body = currentBooking.status === BookingStatus.ACCEPTED
               ? `Your ${currentBooking.service_name} is confirmed for ${new Date(currentBooking.start_time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}.`
               : `Your appointment for ${currentBooking.service_name} has been ${currentBooking.status}.`;

             new Notification(title, { body, icon: '/favicon.ico' });
          }
        }
      });
    }
    prevBookingsRef.current = myBookings;
  }, [bookings, hasPermission, myBookings]);

  const prevOffersLengthRef = useRef<number>(activeOffers.length);

  useEffect(() => {
    if (activeOffers.length > prevOffersLengthRef.current) {
      const newOffer = activeOffers[0];
      if (hasPermission && newOffer) {
        new Notification('New Offer Alert! 🏷️', {
          body: `${newOffer.title}: ${newOffer.description}`,
          icon: '/favicon.ico'
        });
      }
    }
    prevOffersLengthRef.current = activeOffers.length;
  }, [activeOffers, hasPermission]);



  const formatDateLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const generateSlots = (date: Date, durationMinutes: number) => {
    const slots: { time: string; available: boolean; status: string }[] = [];
    const startHour = parseInt(salonProfile.open_time.split(':')[0]);
    const endHour = parseInt(salonProfile.close_time.split(':')[0]);

    const dateStr = formatDateLocal(date);

    for (let h = startHour; h < endHour; h++) {
      for (let m = 0; m < 60; m += 30) {
        const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        const slotDate = new Date(date);
        slotDate.setHours(h, m, 0, 0);

        const now = new Date();
        if (date.toDateString() === now.toDateString() && slotDate < now) {
           slots.push({ time: timeStr, available: false, status: 'past' });
           continue;
        }

        const isBlocked = blockedSlots.some(blockedSlot => {
          let blockedDateStr = blockedSlot.date;
          if (blockedDateStr.includes('T')) {
            blockedDateStr = blockedDateStr.split('T')[0];
          }
          if (blockedDateStr.length > 10) {
            blockedDateStr = blockedDateStr.substring(0, 10);
          }

          if (blockedDateStr !== dateStr) {
            return false;
          }

          const blockedStartTime = blockedSlot.start_time;
          const blockedEndTime = blockedSlot.end_time;

          const blockedStart = blockedStartTime.length > 5 ? blockedStartTime.substring(0, 5) : blockedStartTime;
          const blockedEnd = blockedEndTime.length > 5 ? blockedEndTime.substring(0, 5) : blockedEndTime;

          return timeStr >= blockedStart && timeStr < blockedEnd;
        });

        if (isBlocked) {
          slots.push({
            time: timeStr,
            available: false,
            status: 'busy'
          });
        } else {
          slots.push({
            time: timeStr,
            available: true,
            status: 'free'
          });
        }
      }
    }
    return slots;
  };

  const handleBook = async () => {
    if (!selectedService || !selectedSlot) return;

    const startDateTime = new Date(selectedDate);
    const [h, m] = selectedSlot.split(':');
    startDateTime.setHours(parseInt(h), parseInt(m), 0, 0);

    const endDateTime = new Date(startDateTime);
    endDateTime.setMinutes(endDateTime.getMinutes() + selectedService.duration_minutes);

    let finalPrice = selectedService.price;
    let applicableOffer: Offer | undefined = undefined;

    if (selectedOffer && selectedOffer.active) {
      const validUntilDate = new Date(selectedOffer.valid_until);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      validUntilDate.setHours(0, 0, 0, 0);
      if (validUntilDate >= today) {
        applicableOffer = selectedOffer;
      }
    } else {
      applicableOffer = activeOffers.find(o =>
        o.title.toLowerCase().includes(selectedService.name.toLowerCase()) ||
        o.description.toLowerCase().includes('all') ||
        o.description.toLowerCase().includes('service')
      );
    }

    if (applicableOffer) {
      finalPrice = selectedService.price - (selectedService.price * (applicableOffer.discount_percentage / 100));
    }

    finalPrice = Math.round(finalPrice * 100) / 100;

    const maxPrice = 99999999.99;
    if (finalPrice > maxPrice) {
      finalPrice = maxPrice;
    }

    try {
      const serviceId = parseInt(selectedService.id);
      if (isNaN(serviceId)) {
        throw new Error('Invalid service ID');
      }

      const bookingData = {
        service: serviceId,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        price: parseFloat(finalPrice.toFixed(2)),
        notes: bookingNotes || ''
      };

      const response = await apiClient.post('/api/store/bookings/create/', bookingData);
      const createdBooking = response.data;

      const newBooking: Booking = {
        id: createdBooking.id.toString(),
        customer_id: createdBooking.customer_id,
        customer_name: createdBooking.customer_name,
        customer_phone: createdBooking.customer_phone,
        service_id: createdBooking.service_id.toString(),
        service_name: createdBooking.service_name,
        start_time: createdBooking.start_time,
        end_time: createdBooking.end_time,
        status: createdBooking.status as BookingStatus,
        price: parseFloat(createdBooking.price),
        notes: createdBooking.notes
      };

      onCreateBooking(newBooking);

      if (hasPermission) {
        new Notification('Request Sent', {
          body: `Waiting for salon confirmation for ${selectedService.name}.`,
        });
      }

      setShowConfirmModal(false);
      setBookingNotes('');
      setSelectedOffer(null);
      setView('success');
    } catch (error: any) {
      console.error('Error creating booking:', error);

      let errorMessage = 'Failed to create booking. Please try again.';
      if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error;
        } else if (error.response.data.detail) {
          errorMessage = error.response.data.detail;
        } else if (typeof error.response.data === 'object') {
          const validationErrors = Object.entries(error.response.data)
            .map(([key, value]: [string, any]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
            .join('\n');
          errorMessage = `Validation error:\n${validationErrors}`;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      alert(errorMessage);
    }
  };

  const handleCancelClick = (bookingId: string) => {
    if (window.confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) {
      onCancelBooking(bookingId);
    }
  };

  const DesktopHeader = () => (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30 hidden md:block transition-colors duration-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('home')}>
            <div className="bg-pink-600 p-1.5 rounded-lg shadow-sm">
              <Scissors className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-gray-900 dark:text-white text-lg tracking-tight">SalonFlow</span>
          </div>

          <nav className="flex items-center gap-8">
            {['Home', 'Services', 'Offers', 'My Bookings'].map((label) => {
              const viewKey = label.toLowerCase().replace(' ', '_') as any;
              return (
                <button
                  key={label}
                  onClick={() => setView(viewKey)}
                  className={`text-sm font-medium transition-all px-3 py-2 rounded-lg ${
                    view === viewKey
                      ? 'text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-900/20'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-4">
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 mx-1"></div>
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Hi, {user.name.split(' ')[0]}</span>
            <button
              onClick={onLogout}
              className="p-2 text-gray-400 hover:text-red-500 transition-colors"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );

  const BottomNav = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 pb-safe pt-2 px-6 flex justify-between items-center z-40 md:hidden transition-colors duration-200">
      <button onClick={() => setView('home')} className={`flex flex-col items-center p-2 ${view === 'home' ? 'text-pink-600 dark:text-pink-400' : 'text-gray-400 dark:text-gray-500'}`}>
        <Home className="h-6 w-6" />
        <span className="text-[10px] mt-1 font-medium">Home</span>
      </button>
      <button onClick={() => setView('services')} className={`flex flex-col items-center p-2 ${view === 'services' ? 'text-pink-600 dark:text-pink-400' : 'text-gray-400 dark:text-gray-500'}`}>
        <Search className="h-6 w-6" />
        <span className="text-[10px] mt-1 font-medium">Browse</span>
      </button>
      <button onClick={() => setView('offers')} className={`flex flex-col items-center p-2 ${view === 'offers' ? 'text-pink-600 dark:text-pink-400' : 'text-gray-400 dark:text-gray-500'}`}>
        <Tag className="h-6 w-6" />
        <span className="text-[10px] mt-1 font-medium">Offers</span>
      </button>
      <button onClick={() => setView('my_bookings')} className={`flex flex-col items-center p-2 ${view === 'my_bookings' ? 'text-pink-600 dark:text-pink-400' : 'text-gray-400 dark:text-gray-500'}`}>
        <Calendar className="h-6 w-6" />
        <span className="text-[10px] mt-1 font-medium">Bookings</span>
      </button>
    </div>
  );



  const ServicesView = () => {
    if (services.length === 0) {
      return (
        <div className="pb-24 min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 md:pt-8 animate-fade-in">
           <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
              <div className="flex items-center gap-4">
                <button onClick={() => setView('home')} className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full md:hidden">
                  <ChevronLeft className="h-6 w-6 text-gray-600 dark:text-gray-300" />
                </button>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Our Services</h2>
              </div>
           </div>
           <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                <Scissors className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Services Available</h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
                The salon hasn't listed any services yet. Please check back later.
              </p>
           </div>
        </div>
      );
    }

    let filteredServices = services.filter(s =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    filteredServices.sort((a, b) => {
      switch (sortOption) {
        case 'price_asc': return a.price - b.price;
        case 'price_desc': return b.price - a.price;
        case 'duration_asc': return a.duration_minutes - b.duration_minutes;
        case 'duration_desc': return b.duration_minutes - a.duration_minutes;
        default: return 0;
      }
    });

    return (
      <div className="pb-24 min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 md:pt-8 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => setView('home')} className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full md:hidden">
              <ChevronLeft className="h-6 w-6 text-gray-600 dark:text-gray-300" />
            </button>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Our Services</h2>
          </div>

          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search for haircut, spa..."
                className="w-full pl-10 pr-10 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all shadow-sm dark:text-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full p-1"
                >
                  <X className="h-4 w-4 text-gray-400" />
                </button>
              )}
            </div>

            <div className="relative w-full md:w-48">
              <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                className="w-full pl-10 pr-8 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all shadow-sm appearance-none cursor-pointer text-gray-700 dark:text-gray-300"
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as any)}
              >
                <option value="default">Sort By: Default</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="duration_asc">Duration: Shortest</option>
                <option value="duration_desc">Duration: Longest</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.length === 0 ? (
            <div className="col-span-full text-center py-16 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
              <p className="text-lg">No services found matching "{searchQuery}"</p>
              <button onClick={() => setSearchQuery('')} className="text-pink-600 dark:text-pink-400 font-bold mt-2 hover:underline">Clear Search</button>
            </div>
          ) : (
            filteredServices.map(service => (
              <div
                key={service.id}
                onClick={() => {
                  setSelectedService(service);
                  setView('service_details');
                }}
                className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 hover:border-pink-300 dark:hover:border-pink-600 hover:shadow-md transition-all cursor-pointer group flex flex-col h-full"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold text-xl text-gray-900 dark:text-white group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">{service.name}</h3>
                  <span className="font-bold text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-900/30 px-3 py-1 rounded-lg">₹{service.price}</span>
                </div>

                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 line-clamp-2 flex-1">{service.description}</p>

                <div className="flex items-center justify-between pt-4 border-t border-gray-50 dark:border-gray-700">
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-300 flex items-center gap-1.5 bg-gray-50 dark:bg-gray-700 px-2.5 py-1.5 rounded-md">
                    <Clock className="h-3.5 w-3.5" /> {service.duration_minutes} mins
                  </span>
                  <div className="flex items-center text-pink-600 dark:text-pink-400 text-sm font-bold group-hover:translate-x-1 transition-transform">
                    Book <ChevronRight className="h-4 w-4 ml-1" />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const ServiceDetailsView = () => {
    if (!selectedService) return null;

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center md:py-12 px-4 animate-slide-up">
        <div className="bg-white dark:bg-gray-800 w-full max-w-2xl rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row border border-gray-200 dark:border-gray-700">
          <div className="bg-gray-900 dark:bg-black text-white p-8 md:w-1/3 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
            <div className="relative z-10">
              <button onClick={() => setView('services')} className="mb-6 p-2 bg-white/10 rounded-full hover:bg-white/20 w-fit transition-colors">
                <ChevronLeft className="h-5 w-5 text-white" />
              </button>
              <h1 className="text-3xl font-bold mb-2 leading-tight">{selectedService.name}</h1>
              <div className="flex flex-col gap-2 mt-4 text-sm opacity-80">
                <span className="flex items-center gap-2"><Clock className="h-4 w-4" /> {selectedService.duration_minutes} mins</span>
                <span className="flex items-center gap-2"><Tag className="h-4 w-4" /> {salonProfile.name}</span>
              </div>
            </div>
            <div className="mt-8 md:mt-0 relative z-10">
              <p className="text-xs opacity-50 uppercase tracking-wider mb-1">Total Cost</p>
              <p className="text-3xl font-bold text-pink-400">₹{selectedService.price}</p>
            </div>
          </div>

          <div className="p-8 md:w-2/3 flex flex-col">
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4 text-lg">About Service</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-8 text-sm">
                {selectedService.description || "No description available for this service."}
              </p>

              <h3 className="font-bold text-gray-900 dark:text-white mb-4 text-lg">Includes</h3>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-gray-600 dark:text-gray-300 text-sm">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>Professional consultation</span>
                </li>
                <li className="flex items-center gap-3 text-gray-600 dark:text-gray-300 text-sm">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>Premium styling products</span>
                </li>
                <li className="flex items-center gap-3 text-gray-600 dark:text-gray-300 text-sm">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>Satisfaction guarantee</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => {
                const nearestDate = getNearestUpcomingDate();
                setSelectedDate(nearestDate);
                setSelectedSlot(null);
                setView('slots');
              }}
              className="w-full bg-pink-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-pink-700 transition-all active:scale-[0.98]"
            >
              Select Time Slot
            </button>
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    if (view === 'slots' && salonProfile) {
      const nearestDate = getNearestUpcomingDate();
      setSelectedDate(prevDate => {
        if (prevDate < nearestDate || prevDate.toDateString() !== nearestDate.toDateString()) {
          return nearestDate;
        }
        return prevDate;
      });
    }
  }, [view, salonProfile]);

  useEffect(() => {
    const fetchBlockedSlots = async () => {
      if (view === 'slots' && salonProfile) {
        try {
          const nearestDate = getNearestUpcomingDate();
          const allBlockedSlots: BlockedSlot[] = [];

          const fetchPromises = Array.from({ length: 14 }, async (_, i) => {
            const date = new Date(nearestDate);
            date.setDate(date.getDate() + i);
            const dateStr = formatDateLocal(date);

            try {
              const response = await apiClient.get(`/api/store/blocked-slots/customer/?date=${dateStr}`);
              return response.data || [];
            } catch (error) {
              console.error(`Error fetching blocked slots for ${dateStr}:`, error);
              return [];
            }
          });

          const results = await Promise.all(fetchPromises);
          const flattened = results.flat();
          setBlockedSlots(flattened);
        } catch (error) {
          console.error('Error fetching blocked slots:', error);
          setBlockedSlots([]);
        }
      } else if (view !== 'slots') {
        setBlockedSlots([]);
      }
    };

    fetchBlockedSlots();
  }, [view, salonProfile]);

  const SlotsView = () => {
    const nearestDate = getNearestUpcomingDate();
    const slots = generateSlots(selectedDate, selectedService?.duration_minutes || 30);

      const dates = Array.from({length: 14}, (_, i) => {
      const d = new Date(nearestDate);
      d.setDate(d.getDate() + i);
      return d;
    });

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center md:py-12">
        <div className="bg-white dark:bg-gray-800 w-full max-w-4xl md:rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col h-screen md:h-[800px]">
          <div className="bg-white dark:bg-gray-800 px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-4">
              <button onClick={() => setView('service_details')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                <ChevronLeft className="h-6 w-6 text-gray-600 dark:text-gray-300" />
              </button>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Pick a Time</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{selectedService?.name} • {selectedService?.duration_minutes} mins</p>
              </div>
            </div>
            {selectedSlot && (
              <button
                onClick={() => setSelectedSlot(null)}
                className="text-sm bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 px-3 py-1.5 rounded-lg font-bold hover:bg-pink-100 dark:hover:bg-pink-900/50 transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex flex-col md:flex-row h-full overflow-hidden">
            <div className="bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 md:w-72 flex-shrink-0 overflow-y-auto scrollbar-hide">
              <div className="flex md:flex-col p-4 gap-3 overflow-x-auto md:overflow-visible">
                {dates.map((date) => {
                  const isSelected = date.toDateString() === selectedDate.toDateString();
                  return (
                    <button
                      key={date.toString()}
                      onClick={() => { setSelectedDate(date); setSelectedSlot(null); }}
                      className={`
                        flex-shrink-0 w-16 md:w-full h-20 md:h-auto md:py-4 md:px-6 rounded-xl flex flex-col md:flex-row md:justify-between items-center justify-center border transition-all cursor-pointer
                        ${isSelected
                          ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white shadow-md'
                          : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm'}
                      `}
                    >
                      <span className="text-xs font-bold uppercase md:order-2">{date.toLocaleDateString(undefined, {weekday: 'short'})}</span>
                      <span className="text-xl font-bold md:order-1">{date.getDate()}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex-1 p-6 md:p-8 overflow-y-auto bg-white dark:bg-gray-800">
              <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <h3 className="font-bold text-gray-900 dark:text-white text-lg">{selectedDate.toLocaleDateString(undefined, {weekday:'long', month:'long', day:'numeric'})}</h3>

                <div className="flex gap-3 text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-lg">
                  <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500"></div> Available</span>
                  <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-gray-200 dark:bg-gray-500 border border-gray-300 dark:border-gray-600"></div> Busy</span>
                  <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-pink-600"></div> Selected</span>
                </div>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {slots.map((slot, idx) => (
                  <button
                    key={idx}
                    disabled={!slot.available}
                    onClick={() => slot.available && setSelectedSlot(slot.time)}
                    className={`
                      py-3 rounded-xl text-sm font-bold border transition-all relative overflow-hidden cursor-pointer
                      ${!slot.available
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 border-transparent cursor-not-allowed'
                        : selectedSlot === slot.time
                          ? 'bg-pink-600 text-white border-pink-600 shadow-lg transform scale-105 ring-2 ring-pink-200 dark:ring-pink-900 z-10'
                          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-pink-300 dark:hover:border-pink-700 hover:bg-pink-50 dark:hover:bg-pink-900/20 hover:shadow-sm'}
                    `}
                  >
                    {slot.time}
                    {!slot.available && (
                      <div className="absolute inset-0 bg-gray-200/20 dark:bg-gray-900/50 bg-[length:10px_10px] bg-[linear-gradient(45deg,transparent_25%,rgba(0,0,0,0.05)_25%,rgba(0,0,0,0.05)_50%,transparent_50%,transparent_75%,rgba(0,0,0,0.05)_75%,rgba(0,0,0,0.05)_100%)]"></div>
                    )}
                  </button>
                ))}
              </div>
              {slots.every(s => !s.available) && (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 py-12">
                  <Calendar className="h-12 w-12 mb-3 opacity-20" />
                  <p>No available slots. Please try another date.</p>
                </div>
              )}
            </div>
          </div>

          <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex justify-between items-center shrink-0">
            <div className="hidden md:block">
              <p className="text-gray-500 dark:text-gray-400 text-sm">Service Cost</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{selectedService?.price}</p>
            </div>
            <button
              disabled={!selectedSlot}
              onClick={() => setShowConfirmModal(true)}
              className={`w-full md:w-auto md:px-12 py-4 rounded-xl font-bold text-lg shadow-lg transition-all ${
                selectedSlot
                  ? 'bg-gray-900 dark:bg-pink-600 text-white hover:bg-gray-800 dark:hover:bg-pink-700 hover:-translate-y-0.5'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
              }`}
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  };

  const SuccessView = () => (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-6 text-center animate-fade-in">
      <div className="bg-white dark:bg-gray-800 p-10 rounded-3xl shadow-xl max-w-md w-full flex flex-col items-center border border-gray-100 dark:border-gray-700">
        <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6 animate-bounce">
          <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Booking Sent!</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          We've sent your request to <strong>{salonProfile.name}</strong>. You will be notified when they accept.
        </p>
        <div className="space-y-3 w-full">
          <button
            onClick={() => setView('my_bookings')}
            className="w-full py-3.5 bg-gray-900 dark:bg-pink-600 text-white rounded-xl font-bold hover:bg-gray-800 dark:hover:bg-pink-700 transition-colors"
          >
            Track Status
          </button>
          <button
            onClick={() => setView('home')}
            className="w-full py-3.5 text-gray-500 dark:text-gray-400 text-sm font-medium hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors"
          >
            Return Home
          </button>
        </div>
      </div>
    </div>
  );

  const OffersView = () => {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="md:hidden px-4 pt-4 mb-4">
          <div className="flex items-center gap-4">
            <button onClick={() => setView('home')} className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
              <ChevronLeft className="h-6 w-6 text-gray-600 dark:text-gray-300" />
            </button>
          </div>
        </div>

        <OffersList
          offers={activeOffers}
          readOnly={true}
          title="Exclusive Offers"
          emptyStateMessage="Check back later for exciting offers and discounts!"
        />
      </div>
    );
  };


  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen relative transition-colors duration-200">
      <DesktopHeader />

      <div className="min-h-[calc(100vh-4rem)]">
        {view === 'home' && (
          <HomeView
            userName={user.name}
            myBookings={myBookings}
            offers={activeOffers}
            isDarkMode={isDarkMode}
            onToggleTheme={onToggleTheme}
            onNavigateToServices={() => setView('services')}
            onNavigateToBookings={() => setView('my_bookings')}
            onOfferClick={(offer) => {
              setSelectedOffer(offer);
              setView('services');
            }}
          />
        )}
        {view === 'services' && <ServicesView />}
        {view === 'service_details' && <ServiceDetailsView />}
        {view === 'slots' && <SlotsView />}
        {view === 'success' && <SuccessView />}
        {view === 'offers' && <OffersView />}
        {view === 'my_bookings' && (
          <MyBookingsView
            myBookings={myBookings}
            salonProfile={salonProfile}
            onCancelBooking={handleCancelClick}
            onNavigateToServices={() => setView('services')}
          />
        )}
      </div>

      <ConfirmationModal
        show={showConfirmModal}
        selectedService={selectedService}
        selectedSlot={selectedSlot}
        selectedDate={selectedDate}
        selectedOffer={selectedOffer}
        offers={activeOffers}
        salonProfile={salonProfile}
        bookingNotes={bookingNotes}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleBook}
        onNotesChange={setBookingNotes}
        onOfferChange={setSelectedOffer}
      />

      {view !== 'slots' && view !== 'success' && view !== 'service_details' && <BottomNav />}
    </div>
  );
};

export default CustomerApp;
