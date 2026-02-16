import { Booking, BookingStatus, Offer, SalonProfile, Service, DailyStat, ServiceStat } from './types';

export const MOCK_SALON_PROFILE: SalonProfile = {
  name: "GlamCuts Salon",
  address: "123 Fashion Street, Indiranagar, Bangalore",
  open_time: "09:00",
  close_time: "20:00",
  phone: "+91 98765 43210"
};

export const MOCK_SERVICES: Service[] = [
  { id: 's1', name: 'Haircut (Men)', duration_minutes: 30, price: 300, description: 'Standard cut with styling' },
  { id: 's2', name: 'Haircut (Women)', duration_minutes: 45, price: 600, description: 'Layered cut, wash & blow dry' },
  { id: 's3', name: 'Facial Spa', duration_minutes: 60, price: 1200, description: 'Deep cleansing organic facial' },
  { id: 's4', name: 'Shave / Beard Trim', duration_minutes: 20, price: 150, description: 'Classic towel shave' },
  { id: 's5', name: 'Hair Coloring', duration_minutes: 90, price: 2500, description: 'Global color or highlights' },
];

const getTodayAt = (hour: number, minute: number = 0) => {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
};

const getRelativeDateAt = (daysOffset: number, hour: number, minute: number = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
};

// Mock bookings to create "traffic"
export const MOCK_BOOKINGS: Booking[] = [
  {
    id: 'b1',
    customer_id: 'c1',
    customer_name: 'Priya Sharma',
    customer_phone: '+91 98765 12345',
    service_id: 's2',
    service_name: 'Haircut (Women)',
    start_time: getTodayAt(14, 0),
    end_time: getTodayAt(14, 45),
    status: BookingStatus.REQUESTED,
    notes: 'Need a quick trim',
    price: 600
  },
  {
    id: 'b2',
    customer_id: 'c2',
    customer_name: 'Rahul Verma',
    customer_phone: '+91 98765 67890',
    service_id: 's1',
    service_name: 'Haircut (Men)',
    start_time: getTodayAt(10, 30),
    end_time: getTodayAt(11, 0),
    status: BookingStatus.ACCEPTED,
    price: 300
  },
  {
    id: 'b3',
    customer_id: 'c3',
    customer_name: 'Amit Kumar',
    customer_phone: '+91 99887 77665',
    service_id: 's4',
    service_name: 'Shave / Beard Trim',
    start_time: getTodayAt(11, 0),
    end_time: getTodayAt(11, 20),
    status: BookingStatus.COMPLETED,
    price: 150
  },
  // Future traffic
  {
    id: 'b4',
    customer_id: 'c4',
    customer_name: 'Sneha Gupta',
    customer_phone: '+91 98765 43211',
    service_id: 's3',
    service_name: 'Facial Spa',
    start_time: getRelativeDateAt(1, 16, 0), // Tomorrow 4pm
    end_time: getRelativeDateAt(1, 17, 0),
    status: BookingStatus.ACCEPTED, // Busy slot
    price: 1200
  },
  // Past booking
  {
    id: 'b5',
    customer_id: 'c1',
    customer_name: 'Priya Sharma',
    customer_phone: '+91 98765 12345',
    service_id: 's3',
    service_name: 'Facial Spa',
    start_time: getRelativeDateAt(-1, 15, 0),
    end_time: getRelativeDateAt(-1, 16, 0),
    status: BookingStatus.COMPLETED,
    price: 1200
  }
];



export const MOCK_DAILY_STATS: DailyStat[] = [
  { day: 'Mon', bookings: 12, revenue: 4500 },
  { day: 'Tue', bookings: 15, revenue: 5200 },
  { day: 'Wed', bookings: 8, revenue: 3100 },
  { day: 'Thu', bookings: 20, revenue: 8000 },
  { day: 'Fri', bookings: 18, revenue: 6500 },
  { day: 'Sat', bookings: 25, revenue: 10500 },
  { day: 'Sun', bookings: 22, revenue: 9000 },
];

export const MOCK_SERVICE_STATS: ServiceStat[] = [
  { name: 'Haircut (M)', count: 45 },
  { name: 'Haircut (F)', count: 30 },
  { name: 'Facial', count: 15 },
  { name: 'Shave', count: 25 },
];
