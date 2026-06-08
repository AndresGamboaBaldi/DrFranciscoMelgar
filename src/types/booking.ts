export interface Service {
  id: string
  name: string
  tag: string
  durationMins?: number
  price?: string
  icon: string
}

export type BookingStep = 1 | 2 | 3 | 4

export interface SelectedDate {
  y: number
  m: number
  d: number
}

export interface BookingState {
  step: BookingStep
  service: Service | null
  date: SelectedDate | null
  time: string | null
}

export interface BookingFormData {
  name: string
  phone: string
  notes: string
  consent: boolean
}

export interface Appointment {
  id?: string
  service: string
  appointment_date: string   // ISO: 'YYYY-MM-DD'
  appointment_time: string   // '09:00'
  name: string
  phone: string
  notes?: string | null
  doctor_id?: string
  status?: 'pending' | 'confirmed' | 'cancelled'
  created_at?: string
}
