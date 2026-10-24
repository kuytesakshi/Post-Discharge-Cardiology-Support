from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class PatientMedication(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    dose: str | None = Field(default=None, max_length=128)
    frequency: str | None = Field(default=None, max_length=128)
    route: str | None = Field(default=None, max_length=64)
    start_date: date | None = None
    end_date: date | None = None
    instructions: str | None = None


class PatientProfileBase(BaseModel):
    medical_record_number: str | None = Field(default=None, max_length=64)
    status: str = Field(default="active", max_length=32)

    date_of_birth: date | None = None
    gender: str | None = Field(default=None, max_length=32)
    phone: str | None = Field(default=None, max_length=32)
    alternate_phone: str | None = Field(default=None, max_length=32)
    preferred_language: str | None = Field(default=None, max_length=64)
    preferred_contact_method: str | None = Field(default=None, max_length=32)

    address_line1: str | None = Field(default=None, max_length=255)
    address_line2: str | None = Field(default=None, max_length=255)
    city: str | None = Field(default=None, max_length=128)
    state: str | None = Field(default=None, max_length=128)
    postal_code: str | None = Field(default=None, max_length=20)
    country: str | None = Field(default=None, max_length=64)

    emergency_contact_name: str | None = Field(default=None, max_length=255)
    emergency_contact_phone: str | None = Field(default=None, max_length=32)
    emergency_contact_relationship: str | None = Field(default=None, max_length=64)
    caregiver_name: str | None = Field(default=None, max_length=255)
    caregiver_phone: str | None = Field(default=None, max_length=32)
    caregiver_relationship: str | None = Field(default=None, max_length=64)

    admission_date: date | None = None
    discharge_date: date | None = None
    discharge_disposition: str | None = Field(default=None, max_length=64)
    hospital_name: str | None = Field(default=None, max_length=255)
    discharging_physician_name: str | None = Field(default=None, max_length=255)
    primary_care_physician_name: str | None = Field(default=None, max_length=255)
    primary_care_physician_phone: str | None = Field(default=None, max_length=32)
    primary_doctor_id: UUID | None = None
    attending_doctor_id: UUID | None = None

    primary_condition: str | None = Field(default=None, max_length=255)
    discharge_diagnosis: str | None = None
    secondary_diagnoses: list[str] | None = None
    comorbidities: list[str] | None = None
    allergies: list[str] | None = None
    procedure_name: str | None = Field(default=None, max_length=255)
    procedure_date: date | None = None
    lvef: float | None = Field(default=None, ge=0, le=100)
    nyha_class: str | None = Field(default=None, max_length=8)
    heart_failure_type: str | None = Field(default=None, max_length=32)
    cardiac_device: str | None = Field(default=None, max_length=128)
    device_details: str | None = None
    anticoagulation_required: bool | None = None
    target_inr: float | None = Field(default=None, ge=0)

    height_cm: float | None = Field(default=None, ge=0)
    weight_kg: float | None = Field(default=None, ge=0)
    bmi: float | None = Field(default=None, ge=0)
    baseline_weight_kg: float | None = Field(default=None, ge=0)
    target_weight_kg: float | None = Field(default=None, ge=0)

    discharge_systolic_bp: int | None = Field(default=None, ge=0)
    discharge_diastolic_bp: int | None = Field(default=None, ge=0)
    discharge_heart_rate: int | None = Field(default=None, ge=0)
    discharge_respiratory_rate: int | None = Field(default=None, ge=0)
    discharge_spo2: int | None = Field(default=None, ge=0, le=100)
    discharge_temperature_c: float | None = Field(default=None, ge=0)

    discharge_sodium: float | None = Field(default=None, ge=0)
    discharge_potassium: float | None = Field(default=None, ge=0)
    discharge_creatinine: float | None = Field(default=None, ge=0)
    discharge_egfr: float | None = Field(default=None, ge=0)
    discharge_hemoglobin: float | None = Field(default=None, ge=0)
    discharge_hba1c: float | None = Field(default=None, ge=0)
    discharge_bnp: float | None = Field(default=None, ge=0)
    discharge_nt_probnp: float | None = Field(default=None, ge=0)
    discharge_inr: float | None = Field(default=None, ge=0)

    smoking_status: str | None = Field(default=None, max_length=32)
    alcohol_use: str | None = Field(default=None, max_length=32)
    physical_activity_level: str | None = Field(default=None, max_length=64)
    lives_alone: bool | None = None
    transportation_access: bool | None = None
    code_status: str | None = Field(default=None, max_length=64)

    medications: list[PatientMedication] | None = None
    symptoms_to_watch: list[str] | None = None
    red_flags: list[str] | None = None
    activity_restrictions: str | None = None
    diet_instructions: str | None = None
    home_monitoring_instructions: str | None = None
    follow_up_plan: str | None = None
    next_follow_up_date: date | None = None
    readmission_risk: str | None = Field(default=None, max_length=32)
    readmission_risk_score: int | None = Field(default=None, ge=0)
    clinical_notes: str | None = None

    consent_to_contact: bool = False
    consent_date: date | None = None
    last_contacted_at: datetime | None = None
    onboarding_completed_at: datetime | None = None


class PatientProfileUpdate(PatientProfileBase):
    pass


class PatientProfileRead(PatientProfileBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    created_by_id: UUID | None
    created_at: datetime
    updated_at: datetime
