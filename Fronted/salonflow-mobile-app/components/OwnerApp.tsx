import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard,
  CalendarDays,
  Tag,
  Settings as SettingsIcon,
  List
} from 'lucide-react';
import { Booking, BookingStatus, Offer, Service } from '../types';
import { MOCK_SALON_PROFILE } from '../constants';
import BookingsList from './BookingsList';
import OffersList from './OffersList';
import ServicesList from './ServicesList';
import SettingsView from './SettingsView';
import Sidebar from './Sidebar';
import DashboardView from './DashboardView';

interface OwnerAppProps {
  bookings: Booking[];
  offers: Offer[];
  services: Service[];
  onUpdateStatus: (id: string, status: BookingStatus) => void;
  onAddOffer: (offer: Offer) => void;
  onDeleteOffer: (id: string | number) => void;
  onAddService: (service: Service) => void;
  onUpdateService: (service: Service) => void;
  onDeleteService: (id: string) => void;
  onLogout: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

const OwnerApp: React.FC<OwnerAppProps> = ({
  bookings, offers, services, onUpdateStatus, onAddOffer, onDeleteOffer, onAddService, onUpdateService, onDeleteService, onLogout, isDarkMode, onToggleTheme
}) => {
  const getInitialView = (): 'home' | 'bookings' | 'services' | 'offers' | 'settings' => {
    const savedView = localStorage.getItem('ownerView');
    const validViews: Array<'home' | 'bookings' | 'services' | 'offers' | 'settings'> = 
      ['home', 'bookings', 'services', 'offers', 'settings'];
    if (savedView && validViews.includes(savedView as any)) {
      return savedView as any;
    }
    return 'home';
  };

  const [view, setView] = useState<'home' | 'bookings' | 'services' | 'offers' | 'settings'>(getInitialView());
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    localStorage.setItem('ownerView', view);
  }, [view]);


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


  const prevRequestedCountRef = useRef<number>(0);

  useEffect(() => {
    const requestedCount = bookings.filter(b => b.status === BookingStatus.REQUESTED).length;


    if (requestedCount > prevRequestedCountRef.current) {
      if (hasPermission) {
        new Notification('New Booking Request! 📅', {
          body: 'A customer is waiting for confirmation.',
          icon: '/favicon.ico'
        });
      }
    }
    prevRequestedCountRef.current = requestedCount;
  }, [bookings, hasPermission]);

  const BottomNav = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 pb-safe pt-2 px-4 flex justify-between items-center z-20 md:hidden transition-colors duration-200">
      <button
        onClick={() => setView('home')}
        className={`flex flex-col items-center w-14 ${view === 'home' ? 'text-pink-600 dark:text-pink-400' : 'text-gray-400 dark:text-gray-500'}`}
      >
        <LayoutDashboard className="h-6 w-6" />
        <span className="text-[10px] mt-1 font-medium">Home</span>
      </button>
      <button
        onClick={() => setView('bookings')}
        className={`flex flex-col items-center w-14 ${view === 'bookings' ? 'text-pink-600 dark:text-pink-400' : 'text-gray-400 dark:text-gray-500'}`}
      >
        <CalendarDays className="h-6 w-6" />
        <span className="text-[10px] mt-1 font-medium">Bookings</span>
      </button>
      <button
        onClick={() => setView('services')}
        className={`flex flex-col items-center w-14 ${view === 'services' ? 'text-pink-600 dark:text-pink-400' : 'text-gray-400 dark:text-gray-500'}`}
      >
        <List className="h-6 w-6" />
        <span className="text-[10px] mt-1 font-medium">Services</span>
      </button>
      <button
        onClick={() => setView('offers')}
        className={`flex flex-col items-center w-14 ${view === 'offers' ? 'text-pink-600 dark:text-pink-400' : 'text-gray-400 dark:text-gray-500'}`}
      >
        <Tag className="h-6 w-6" />
        <span className="text-[10px] mt-1 font-medium">Offers</span>
      </button>
      <button
        onClick={() => setView('settings')}
        className={`flex flex-col items-center w-14 ${view === 'settings' ? 'text-pink-600 dark:text-pink-400' : 'text-gray-400 dark:text-gray-500'}`}
      >
        <SettingsIcon className="h-6 w-6" />
        <span className="text-[10px] mt-1 font-medium">Settings</span>
      </button>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar
          activeView={view}
          onNavigate={(v) => setView(v)}
          onLogout={onLogout}
          salonName={MOCK_SALON_PROFILE.name}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden h-full relative">
        <div className="flex-1 overflow-y-auto scrollbar-hide pb-20 md:pb-0">
          {view === 'home' && <DashboardView bookings={bookings} onUpdateStatus={onUpdateStatus} />}
          {view === 'bookings' && <BookingsList bookings={bookings} onUpdateStatus={onUpdateStatus} />}
          {view === 'services' && <ServicesList services={services} onAddService={onAddService} onUpdateService={onUpdateService} onDeleteService={onDeleteService} />}
          {view === 'offers' && <OffersList offers={offers} onAddOffer={onAddOffer} onDeleteOffer={onDeleteOffer} />}
          {view === 'settings' && <SettingsView profile={MOCK_SALON_PROFILE} onLogout={onLogout} isDarkMode={isDarkMode} onToggleTheme={onToggleTheme} />}
        </div>

        <BottomNav />
      </div>
    </div>
  );
};

export default OwnerApp;
