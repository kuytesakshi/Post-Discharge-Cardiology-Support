export type UserRole = "admin" | "doctor" | "patient";

export interface Role {
  id: string;
  name: UserRole;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  is_active: boolean;
  created_at: string;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface PatientMedication {
  name: string;
  dose: string | null;
  frequency: string | null;
  route: string | null;
  start_date: string | null;
  end_date: string | null;
  instructions: string | null;
}

export interface PatientProfile {
  id: string;
  user_id: string;
  created_by_id: string | null;
  primary_doctor_id: string | null;
  attending_doctor_id: string | null;
  medical_record_number: string | null;
  status: string;
  date_of_birth: string | null;
  gender: string | null;
  phone: string | null;
  alternate_phone: string | null;
  preferred_language: string | null;
  preferred_contact_method: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relationship: string | null;
  caregiver_name: string | null;
  caregiver_phone: string | null;
  caregiver_relationship: string | null;
  admission_date: string | null;
  discharge_date: string | null;
  discharge_disposition: string | null;
  hospital_name: string | null;
  discharging_physician_name: string | null;
  primary_care_physician_name: string | null;
  primary_care_physician_phone: string | null;
  primary_condition: string | null;
  discharge_diagnosis: string | null;
  secondary_diagnoses: string[] | null;
  comorbidities: string[] | null;
  allergies: string[] | null;
  procedure_name: string | null;
  procedure_date: string | null;
  lvef: number | null;
  nyha_class: string | null;
  heart_failure_type: string | null;
  cardiac_device: string | null;
  device_details: string | null;
  anticoagulation_required: boolean | null;
  target_inr: number | null;
  height_cm: number | null;
  weight_kg: number | null;
  bmi: number | null;
  baseline_weight_kg: number | null;
  target_weight_kg: number | null;
  discharge_systolic_bp: number | null;
  discharge_diastolic_bp: number | null;
  discharge_heart_rate: number | null;
  discharge_respiratory_rate: number | null;
  discharge_spo2: number | null;
  discharge_temperature_c: number | null;
  discharge_sodium: number | null;
  discharge_potassium: number | null;
  discharge_creatinine: number | null;
  discharge_egfr: number | null;
  discharge_hemoglobin: number | null;
  discharge_hba1c: number | null;
  discharge_bnp: number | null;
  discharge_nt_probnp: number | null;
  discharge_inr: number | null;
  smoking_status: string | null;
  alcohol_use: string | null;
  physical_activity_level: string | null;
  lives_alone: boolean | null;
  transportation_access: boolean | null;
  code_status: string | null;
  medications: PatientMedication[] | null;
  symptoms_to_watch: string[] | null;
  red_flags: string[] | null;
  activity_restrictions: string | null;
  diet_instructions: string | null;
  home_monitoring_instructions: string | null;
  follow_up_plan: string | null;
  next_follow_up_date: string | null;
  readmission_risk: string | null;
  readmission_risk_score: number | null;
  clinical_notes: string | null;
  consent_to_contact: boolean;
  consent_date: string | null;
  last_contacted_at: string | null;
  onboarding_completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DoctorOfficeHours {
  day: string;
  start_time: string | null;
  end_time: string | null;
  is_closed: boolean;
}

export interface DoctorProfile {
  id: string;
  user_id: string;
  created_by_id: string | null;
  title: string | null;
  designation: string | null;
  specialty: string | null;
  subspecialty: string | null;
  department: string | null;
  gender: string | null;
  phone: string | null;
  alternate_phone: string | null;
  office_phone: string | null;
  office_extension: string | null;
  fax: string | null;
  office_address_line1: string | null;
  office_address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  hospital: string | null;
  clinic_name: string | null;
  license_number: string | null;
  license_state: string | null;
  license_expiry_date: string | null;
  npi_number: string | null;
  years_of_experience: number | null;
  patients_attended_count: number;
  medical_school: string | null;
  residency: string | null;
  fellowship: string | null;
  board_certifications: string[] | null;
  professional_memberships: string[] | null;
  languages: string[] | null;
  clinical_interests: string[] | null;
  conditions_treated: string[] | null;
  procedures_performed: string[] | null;
  consultation_modes: string[] | null;
  telehealth_enabled: boolean;
  accepting_new_patients: boolean;
  consultation_fee: number | null;
  availability_notes: string | null;
  office_hours: DoctorOfficeHours[] | null;
  status: string;
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
