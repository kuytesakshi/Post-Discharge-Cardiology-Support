export type UserRole = "patient" | "doctor";

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface PatientProfile {
  id: string;
  user_id: string;
  date_of_birth: string | null;
  gender: string | null;
  phone: string | null;
  discharge_date: string | null;
  primary_condition: string | null;
  medications: string[] | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface DoctorProfile {
  id: string;
  user_id: string;
  specialty: string | null;
  license_number: string | null;
  hospital: string | null;
  years_of_experience: number | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
  user?: User;
}

export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show";

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: AppointmentStatus;
  reason: string | null;
  notes: string | null;
  meeting_link: string | null;
  created_at: string;
  updated_at: string;
}

export type QueryStatus = "open" | "answered" | "closed";

export interface PatientQuery {
  id: string;
  patient_id: string;
  doctor_id: string | null;
  subject: string;
  body: string;
  status: QueryStatus;
  response: string | null;
  responded_at: string | null;
  created_at: string;
  updated_at: string;
}
