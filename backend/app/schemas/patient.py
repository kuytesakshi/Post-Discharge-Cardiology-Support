from datetime import date, datetime
from typing import Self
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.schemas.validators import (
    validate_address_text,
    validate_choice,
    validate_date_not_future,
    validate_date_of_birth,
    validate_medical_text,
    validate_mrn,
    validate_patient_date_relationships,
    validate_person_name,
    validate_phone,
    validate_place_text,
    validate_postal_code,
    validate_provider_name,
    validate_text_length,
)


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


class PatientProfileWrite(PatientProfileBase):
    model_config = ConfigDict(str_strip_whitespace=True)

    readmission_risk_score: int | None = Field(default=None, ge=0, le=10)

    @field_validator("medical_record_number")
    @classmethod
    def _validate_medical_record_number(cls, value: str | None) -> str | None:
        return validate_mrn(value)

    @field_validator("status")
    @classmethod
    def _validate_status(cls, value: str) -> str:
        normalized = validate_choice(value, "Status", {"active", "discharged", "inactive"})
        if normalized is None:
            raise ValueError("Status is required")
        return normalized

    @field_validator("date_of_birth")
    @classmethod
    def _validate_date_of_birth(cls, value: date | None) -> date | None:
        return validate_date_of_birth(value)

    @field_validator("gender")
    @classmethod
    def _validate_gender(cls, value: str | None) -> str | None:
        return validate_choice(
            value,
            "Gender",
            {"female", "male", "non_binary", "prefer_not_to_say"},
        )

    @field_validator(
        "phone",
        "alternate_phone",
        "emergency_contact_phone",
        "caregiver_phone",
        "primary_care_physician_phone",
    )
    @classmethod
    def _validate_phone(cls, value: str | None) -> str | None:
        return validate_phone(value, "Phone")

    @field_validator("preferred_language")
    @classmethod
    def _validate_preferred_language(cls, value: str | None) -> str | None:
        return validate_place_text(value, "Preferred language")

    @field_validator("preferred_contact_method")
    @classmethod
    def _validate_preferred_contact_method(cls, value: str | None) -> str | None:
        return validate_choice(
            value,
            "Preferred contact method",
            {"phone", "sms", "email", "portal"},
        )

    @field_validator("address_line1", "address_line2")
    @classmethod
    def _validate_address_line(cls, value: str | None) -> str | None:
        return validate_address_text(value, "Address")

    @field_validator("city", "state", "country")
    @classmethod
    def _validate_place(cls, value: str | None) -> str | None:
        return validate_place_text(value, "Location")

    @field_validator("postal_code")
    @classmethod
    def _validate_postal_code(cls, value: str | None) -> str | None:
        return validate_postal_code(value)

    @field_validator("emergency_contact_name", "caregiver_name")
    @classmethod
    def _validate_person_name(cls, value: str | None) -> str | None:
        return validate_person_name(value, "Name")

    @field_validator(
        "discharging_physician_name",
        "primary_care_physician_name",
    )
    @classmethod
    def _validate_provider_name(cls, value: str | None) -> str | None:
        return validate_provider_name(value, "Physician name")

    @field_validator("emergency_contact_relationship", "caregiver_relationship")
    @classmethod
    def _validate_relationship(cls, value: str | None) -> str | None:
        return validate_person_name(value, "Relationship")

    @field_validator("admission_date", "discharge_date", "procedure_date", "consent_date")
    @classmethod
    def _validate_not_future(cls, value: date | None) -> date | None:
        return validate_date_not_future(value, "Date")

    @field_validator("primary_condition", "procedure_name")
    @classmethod
    def _validate_medical_text(cls, value: str | None) -> str | None:
        return validate_medical_text(value, "Medical text")

    @field_validator(
        "discharge_diagnosis",
        "device_details",
        "activity_restrictions",
        "diet_instructions",
        "home_monitoring_instructions",
        "follow_up_plan",
        "clinical_notes",
    )
    @classmethod
    def _validate_long_text(cls, value: str | None) -> str | None:
        return validate_text_length(value, "Text", 5000)

    @field_validator("readmission_risk")
    @classmethod
    def _validate_readmission_risk(cls, value: str | None) -> str | None:
        return validate_choice(value, "Readmission risk", {"low", "moderate", "high"})

    @model_validator(mode="after")
    def _validate_dates(self) -> Self:
        validate_patient_date_relationships(
            date_of_birth=self.date_of_birth,
            admission_date=self.admission_date,
            discharge_date=self.discharge_date,
            procedure_date=self.procedure_date,
            next_follow_up_date=self.next_follow_up_date,
        )
        return self


class PatientProfileUpdate(PatientProfileWrite):
    pass


class PatientProfileRead(PatientProfileBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    created_by_id: UUID | None
    created_at: datetime
    updated_at: datetime
