export type UserRole = 'patient' | 'clinic_admin' | 'super_admin'

export interface User {
  id: string
  full_name: string
  email: string
  phone: string | null
  role: UserRole
  location: string | null
  is_active: boolean
  created_at: string
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
  user: User
}

export interface Patient {
  id: string
  user_id: string
  full_name: string
  date_of_birth: string | null
  gender: string | null
  county: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  allergies: string[]
  chronic_conditions: string[]
  created_at: string
}

export interface Clinic {
  id: string
  name: string
  address: string
  county: string
  phone: string
  email: string | null
  latitude: number | null
  longitude: number | null
  is_verified: boolean
  specialties: string[]
  operating_hours: Record<string, { open: string; close: string }>
  distance_km: number | null
  next_available: string | null
  doctor_count: number
}

export interface Doctor {
  id: string
  clinic_id: string
  full_name: string
  specialty: string
  qualification: string | null
  bio: string | null
  available_days: string[]
  consultation_fee_kes: number
  photo_url: string | null
  is_active: boolean
}

export interface ClinicDetail extends Clinic {
  owner_id: string
  license_number: string | null
  subscription_plan: string
  doctors: Doctor[]
}

export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled'

export interface Appointment {
  id: string
  patient_id: string
  clinic_id: string
  doctor_id: string | null
  appointment_date: string  // "YYYY-MM-DD"
  appointment_time: string  // "HH:MM:SS"
  status: AppointmentStatus
  reason: string | null
  notes: string | null
  payment_status: string
  amount_kes: number
  created_at: string
  booking_reference: string
  clinic_name: string | null
  doctor_name: string | null
}

export interface TimeSlot {
  time: string
  doctor_id: string
  doctor_name: string
  fee_kes: number
}

export interface DaySlots {
  date: string
  slots: TimeSlot[]
}

export interface Product {
  id: string
  clinic_id: string
  clinic_name: string | null
  name: string
  category: string
  description: string | null
  price_kes: number
  stock_quantity: number
  requires_prescription: boolean
  image_url: string | null
  is_active: boolean
}

export type OrderStatus = 'pending' | 'processing' | 'ready' | 'delivered'
export type DeliveryMethod = 'pickup' | 'delivery'
export type PaymentMethod = 'mpesa' | 'cash'

export interface OrderItemDetail {
  product_id: string
  product_name: string
  quantity: number
  unit_price_kes: number
  total_kes: number
}

export interface MedOrder {
  id: string
  patient_id: string
  order_reference: string
  items_detail: OrderItemDetail[]
  total_amount_kes: number
  status: OrderStatus
  delivery_method: DeliveryMethod
  delivery_address: string | null
  payment_method: PaymentMethod
  mpesa_transaction_id: string | null
  created_at: string
}

export interface CartItem {
  productId: string
  name: string
  priceKes: number
  quantity: number
  clinicName: string | null
}
