import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Login from './components/Login';
import CustomerApp from './components/CustomerApp';
import OwnerApp from './components/OwnerApp';
import { MOCK_SALON_PROFILE, MOCK_SERVICES } from './constants';
import { BookingStatus, Offer, Booking, UserRole, Service } from './types';
import { initializeAuth, isAuthenticated, logout, getUserInfo } from './services/auth';
import apiClient from './services/api';

const RoleProtectedRoute = ({
  children,
  allowedRole
}: {
  children: React.ReactNode;
  allowedRole: 'customer' | 'owner';
}) => {
  const isLoggedIn = isAuthenticated();
  const userInfo = getUserInfo();

  if (!isLoggedIn) {
    return <Navigate to="/" replace />;
  }

  if (userInfo.role !== allowedRole) {
    const redirectPath = userInfo.role === 'owner' ? '/owner/home' : '/customer/home';
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
};

const AppContent: React.FC = () => {
  const navigate = useNavigate();
  const [isAuthenticatedState, setIsAuthenticatedState] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<UserRole | null>(null);
  const [currentUserName, setCurrentUserName] = useState('');
  const [currentUserPhone, setCurrentUserPhone] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const authState = await initializeAuth();
        if (authState.isAuthenticated) {
          setIsAuthenticatedState(true);
          setCurrentUserRole(authState.role);
          setCurrentUserName(authState.name || '');
          setCurrentUserPhone(authState.phone_number || '');
        } else {
          setIsAuthenticatedState(false);
          setCurrentUserRole(null);
          setCurrentUserName('');
          setCurrentUserPhone('');
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setIsAuthenticatedState(false);
      } finally {
        setIsInitializing(false);
      }
    };

    initAuth();
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [services, setServices] = useState<Service[]>(MOCK_SERVICES);

  useEffect(() => {
    const fetchBookings = async () => {
      if (isAuthenticatedState) {
        try {
          const response = await apiClient.get('/api/store/bookings/');
          const backendBookings: Booking[] = response.data.map((booking: any) => ({
            id: booking.id.toString(),
            customer_id: booking.customer_id,
            customer_name: booking.customer_name,
            customer_phone: booking.customer_phone || booking.customer_id,
            service_id: booking.service_id.toString(),
            service_name: booking.service_name,
            service_duration_minutes: booking.service_duration_minutes || booking.service?.duration_minutes,
            start_time: booking.start_time,
            end_time: booking.end_time,
            status: booking.status as BookingStatus,
            price: parseFloat(booking.price),
            notes: booking.notes || '',
            created_at: booking.created_at
          }));

          setBookings(backendBookings);
        } catch (err: any) {
          console.error('Error fetching bookings:', err);
          setBookings([]);
        }
      } else {
        setBookings([]);
      }
    };

    fetchBookings();

    if (isAuthenticatedState) {
      const interval = setInterval(fetchBookings, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticatedState]);

  useEffect(() => {
    const fetchOffers = async () => {
      if (isAuthenticatedState) {
        try {
          const response = await apiClient.get('/api/store/offers/');
          const backendOffers: Offer[] = response.data.map((offer: any) => ({
            id: offer.id,
            title: offer.title,
            description: offer.description || '',
            discount_percentage: parseFloat(offer.discount_percentage),
            valid_until: offer.valid_until || '',
            valid_from: offer.valid_from,
            active: true
          }));

          setOffers(backendOffers);
        } catch (err: any) {
          console.error('Error fetching offers:', err);
          setOffers([]);
        }
      } else {
        setOffers([]);
      }
    };

    fetchOffers();
  }, [isAuthenticatedState]);

  useEffect(() => {
    const fetchServices = async () => {
      if (isAuthenticatedState) {
        try {
          const response = await apiClient.get('/api/store/services/');
          const backendServices: Service[] = response.data.map((service: any) => ({
            id: service.id?.toString(),
            name: service.name,
            duration_minutes: service.duration_minutes,
            price: service.price,
            description: service.description || '',
          }));

          setServices(backendServices);
        } catch (err: any) {
          console.error('Error fetching services:', err);
          setServices(MOCK_SERVICES);
        }
      } else {
        setServices(MOCK_SERVICES);
      }
    };

    fetchServices();
  }, [isAuthenticatedState]);

  const handleLogin = (role: UserRole, name: string = 'User', phone?: string) => {
    setCurrentUserRole(role);
    setCurrentUserName(name);
    if (phone) setCurrentUserPhone(phone);
    setIsAuthenticatedState(true);
  };

  const handleLogout = async () => {
    await logout();
    setIsAuthenticatedState(false);
    setCurrentUserRole(null);
    setCurrentUserName('');
    setCurrentUserPhone('');
    localStorage.removeItem('customerView');
    localStorage.removeItem('ownerView');
    navigate('/', { replace: true });
  };

  const updateBookingStatus = async (id: string, status: BookingStatus) => {
    try {
      const response = await apiClient.patch(`/api/store/bookings/${id}/status/`, { status });
      const updatedBooking = response.data;

      setBookings(prev => prev.map(b => {
        if (b.id === id) {
          return {
            ...b,
            status: updatedBooking.status as BookingStatus
          };
        }
        return b;
      }));

      const refreshResponse = await apiClient.get('/api/store/bookings/');
      const backendBookings: Booking[] = refreshResponse.data.map((booking: any) => ({
        id: booking.id.toString(),
        customer_id: booking.customer_id,
        customer_name: booking.customer_name,
        customer_phone: booking.customer_phone || booking.customer_id,
        service_id: booking.service_id.toString(),
        service_name: booking.service_name,
        service_duration_minutes: booking.service_duration_minutes || booking.service?.duration_minutes,
        start_time: booking.start_time,
        end_time: booking.end_time,
        status: booking.status as BookingStatus,
        price: parseFloat(booking.price),
        notes: booking.notes || '',
        created_at: booking.created_at
      }));
      setBookings(backendBookings);
    } catch (error: any) {
      console.error('Error updating booking status:', error);
      alert('Failed to update booking status. Please try again.');
    }
  };

  const addOffer = (offer: Offer) => {
    setOffers(prev => {
      const getOfferId = (o: Offer): number => {
        if (typeof o.id === 'number') return o.id;
        if (typeof o.id === 'string') return parseInt(o.id, 10);
        return 0;
      };

      const newId = getOfferId(offer);
      const exists = prev.some(o => {
        const existingId = getOfferId(o);
        return existingId === newId && newId !== 0;
      });

      if (exists) {
        return prev.map(o => {
          const existingId = getOfferId(o);
          return existingId === newId ? offer : o;
        });
      } else {
        return [offer, ...prev];
      }
    });
  };

  const deleteOffer = (id: string | number) => {
    setOffers(prev => prev.filter(o => {
      const offerId = typeof o.id === 'number' ? o.id.toString() : o.id;
      const deleteId = typeof id === 'number' ? id.toString() : id;
      return offerId !== deleteId;
    }));
  };

  const addService = (service: Service) => {
    setServices(prev => [...prev, service]);
  };

  const updateService = (updatedService: Service) => {
    setServices(prev => prev.map(s => s.id === updatedService.id ? updatedService : s));
  };

  const deleteService = (id: string) => {
    setServices(prev => prev.filter(s => s.id !== id));
  };

  const createBooking = async (booking: Booking) => {
    try {
      const response = await apiClient.get('/api/store/bookings/');
      const backendBookings: Booking[] = response.data.map((b: any) => ({
        id: b.id.toString(),
        customer_id: b.customer_id,
        customer_name: b.customer_name,
        customer_phone: b.customer_phone || b.customer_id,
        service_id: b.service_id.toString(),
        service_name: b.service_name,
        service_duration_minutes: b.service_duration_minutes || b.service?.duration_minutes,
        start_time: b.start_time,
        end_time: b.end_time,
        status: b.status as BookingStatus,
        price: parseFloat(b.price),
        notes: b.notes || '',
        created_at: b.created_at
      }));
      setBookings(backendBookings);
    } catch (error: any) {
      console.error('Error refreshing bookings:', error);
    }
  };

  const cancelBooking = async (id: string) => {
    try {
      const response = await apiClient.post(`/api/store/bookings/${id}/cancel/`);
      const updatedBooking = response.data;

      // Update local state with the cancelled booking
      setBookings(prev => prev.map(b => {
        if (b.id === id) {
          return {
            ...b,
            status: updatedBooking.status as BookingStatus
          };
        }
        return b;
      }));

      const refreshResponse = await apiClient.get('/api/store/bookings/');
      const backendBookings: Booking[] = refreshResponse.data.map((booking: any) => ({
        id: booking.id.toString(),
        customer_id: booking.customer_id,
        customer_name: booking.customer_name,
        customer_phone: booking.customer_phone || booking.customer_id,
        service_id: booking.service_id.toString(),
        service_name: booking.service_name,
        service_duration_minutes: booking.service_duration_minutes || booking.service?.duration_minutes,
        start_time: booking.start_time,
        end_time: booking.end_time,
        status: booking.status as BookingStatus,
        price: parseFloat(booking.price),
        notes: booking.notes || '',
        created_at: booking.created_at
      }));
      setBookings(backendBookings);
    } catch (error: any) {
      console.error('Error cancelling booking:', error);
      
      let errorMessage = 'Failed to cancel booking. Please try again.';
      if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error;
        } else if (error.response.data.detail) {
          errorMessage = error.response.data.detail;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-200">
      <Routes>
        <Route
          path="/"
          element={
            isAuthenticatedState ? (
              <Navigate to={currentUserRole === 'owner' ? '/owner/home' : '/customer/home'} replace />
            ) : (
              <Login onLogin={handleLogin} isDarkMode={isDarkMode} onToggleTheme={toggleTheme} />
            )
          }
        />
      <Route
        path="/customer/home"
        element={
          <RoleProtectedRoute allowedRole="customer">
            <CustomerApp
              user={{ name: currentUserName, phone: currentUserPhone || '+91 99999 99999' }}
              bookings={bookings}
              services={services}
              offers={offers}
              salonProfile={MOCK_SALON_PROFILE}
              onCreateBooking={createBooking}
              onCancelBooking={cancelBooking}
              onLogout={handleLogout}
              isDarkMode={isDarkMode}
              onToggleTheme={toggleTheme}
            />
          </RoleProtectedRoute>
        }
      />
        <Route
          path="/owner/home"
          element={
            <RoleProtectedRoute allowedRole="owner">
              <OwnerApp
                bookings={bookings}
                services={services}
                offers={offers}
                onUpdateStatus={updateBookingStatus}
                onAddOffer={addOffer}
                onDeleteOffer={deleteOffer}
                onAddService={addService}
                onUpdateService={updateService}
                onDeleteService={deleteService}
                onLogout={handleLogout}
                isDarkMode={isDarkMode}
                onToggleTheme={toggleTheme}
              />
            </RoleProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
};

const App: React.FC = () => {
  return <AppContent />;
};

export default App;
