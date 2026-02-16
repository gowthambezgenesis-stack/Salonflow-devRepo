
export enum BookingStatus {
  REQUESTED = 'requested',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export type UserRole = 'owner' | 'customer';

export interface Service {
  id: string;
  name: string;
  duration_minutes: number;
  price: number;
  description: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
}

export interface Booking {
  id: string;
  customer_id: string;
  customer_name: string;
  customer_phone?: string;
  service_id: string;
  service_name: string;
  service_duration_minutes?: number;
  start_time: string;
  end_time: string;
  status: BookingStatus;
  notes?: string;
  price: number;
  staff_assignment?: number;
  created_at?: string;
}

export interface Offer {
  id?: number;
  title: string;
  description: string;
  valid_until: string;
  valid_from?: string;
  discount_percentage: number;
  active?: boolean;
}

export interface SalonProfile {
  name: string;
  address: string;
  open_time: string;
  close_time: string;
  phone: string;
}

export interface DailyStat {
  day: string;
  bookings: number;
  revenue: number;
}

export interface ServiceStat {
  name: string;
  count: number;
}


export interface TimeSlot {
  time: string;
  available: boolean;
}

export interface TimeSlotData {
  id?: number;
  date: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
  is_blocked: boolean;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface StaffAvailability {
  id?: number;
  date: string;
  staff_count: number;
  created_at?: string;
  updated_at?: string;
}

export interface BlockedSlot {
  id?: number;
  date: string;
  start_time: string;
  end_time: string;
  reason?: string;
  created_at?: string;
}

export interface SlotInfo {
  time: string;
  bookings: Booking[];
  bookedCount: number;
  capacity: number;
  remainingTime: number;
  isBlocked: boolean;
}
