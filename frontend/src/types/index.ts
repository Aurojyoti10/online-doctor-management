export type UserRole = 'patient' | 'doctor' | 'admin';

export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'rejected';

export type ConsultationType = 'in-person' | 'online';

export type PaymentMethod = 'upi' | 'card' | 'netbanking';
export type PaymentStatus = 'paid' | 'pending' | 'refunded' | 'failed';

export interface Specialization {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export interface Education {
  degree: string;
  institution: string;
  year: string;
}

export interface Experience {
  role: string;
  organization: string;
  duration: string;
  description?: string;
}

export interface Service {
  name: string;
  description: string;
  fee: number;
}

export interface Review {
  id: string;
  patientName: string;
  patientAvatar?: string;
  rating: number;
  date: string;
  comment: string;
  doctorId: string;
}

export interface AvailabilitySlot {
  day: string;
  slots: { time: string; available: boolean }[];
}

export interface DoctorAvailability {
  day: string;
  enabled: boolean;
  ranges: { start: string; end: string }[];
}

export interface Doctor {
  id: string;
  name: string;
  specializationId: string;
  specializationName: string;
  qualifications: string;
  degrees: string[];
  experienceYears: number;
  rating: number;
  reviewCount: number;
  consultationFee: number;
  location: string;
  city: string;
  area: string;
  hospital: string;
  about: string;
  education: Education[];
  experience: Experience[];
  services: Service[];
  languages: string[];
  gender: 'male' | 'female';
  verified: boolean;
  onlineConsultation: boolean;
  nextAvailable: string;
  availability: DoctorAvailability[];
  avatar?: string;
  status: 'active' | 'inactive';
  joinedDate: string;
  email: string;
  phone: string;
}

export interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  dateOfBirth: string;
  bloodGroup: string;
  address: string;
  city: string;
  allergies: string[];
  conditions: string[];
  avatar?: string;
  status: 'active' | 'suspended';
  registeredDate: string;
  appointmentsCount: number;
}

export interface Medicine {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  route?: string;
}

export interface Prescription {
  id: string;
  appointmentId: string;
  doctorId: string;
  doctorName: string;
  patientId: string;
  patientName: string;
  date: string;
  diagnosis: string;
  symptoms: string[];
  medicines: Medicine[];
  advice: string;
  followUpDate?: string;
  vitals?: {
    bloodPressure?: string;
    heartRate?: string;
    temperature?: string;
    weight?: string;
    height?: string;
  };
  notes?: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientAge?: number;
  patientGender?: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialization: string;
  date: string;
  time: string;
  consultationType: ConsultationType;
  status: AppointmentStatus;
  fee: number;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  reason: string;
  createdAt: string;
  tokenNumber?: number;
  prescriptionId?: string;
}

export interface Notification {
  id: string;
  type: 'appointment_confirmed' | 'appointment_cancelled' | 'appointment_reminder' | 'prescription_available' | 'payment_successful' | 'doctor_accepted' | 'doctor_rejected' | 'general';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  role: UserRole;
  userId: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface MedicalHistoryEntry {
  id: string;
  year: string;
  date: string;
  type: 'consultation' | 'diagnosis' | 'prescription' | 'report' | 'condition' | 'allergy';
  title: string;
  description: string;
  doctorName?: string;
  prescriptionId?: string;
}
