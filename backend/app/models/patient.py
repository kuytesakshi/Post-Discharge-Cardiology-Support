from __future__ import annotations

import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    false,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.appointment import Appointment
    from app.models.doctor import DoctorProfile
    from app.models.query import PatientQuery
    from app.models.user import User


class PatientProfile(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "patient_profiles"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        index=True,
        nullable=False,
    )
    medical_record_number: Mapped[str | None] = mapped_column(
        String(64),
        unique=True,
        index=True,
    )
    status: Mapped[str] = mapped_column(
        String(32),
        default="active",
        server_default=text("'active'"),
        nullable=False,
    )

    date_of_birth: Mapped[date | None] = mapped_column(Date)
    gender: Mapped[str | None] = mapped_column(String(32))
    phone: Mapped[str | None] = mapped_column(String(32))
    alternate_phone: Mapped[str | None] = mapped_column(String(32))
    preferred_language: Mapped[str | None] = mapped_column(String(64))
    preferred_contact_method: Mapped[str | None] = mapped_column(String(32))

    address_line1: Mapped[str | None] = mapped_column(String(255))
    address_line2: Mapped[str | None] = mapped_column(String(255))
    city: Mapped[str | None] = mapped_column(String(128))
    state: Mapped[str | None] = mapped_column(String(128))
    postal_code: Mapped[str | None] = mapped_column(String(20))
    country: Mapped[str | None] = mapped_column(String(64))

    emergency_contact_name: Mapped[str | None] = mapped_column(String(255))
    emergency_contact_phone: Mapped[str | None] = mapped_column(String(32))
    emergency_contact_relationship: Mapped[str | None] = mapped_column(String(64))
    caregiver_name: Mapped[str | None] = mapped_column(String(255))
    caregiver_phone: Mapped[str | None] = mapped_column(String(32))
    caregiver_relationship: Mapped[str | None] = mapped_column(String(64))

    admission_date: Mapped[date | None] = mapped_column(Date)
    discharge_date: Mapped[date | None] = mapped_column(Date)
    discharge_disposition: Mapped[str | None] = mapped_column(String(64))
    hospital_name: Mapped[str | None] = mapped_column(String(255))
    discharging_physician_name: Mapped[str | None] = mapped_column(String(255))
    primary_care_physician_name: Mapped[str | None] = mapped_column(String(255))
    primary_care_physician_phone: Mapped[str | None] = mapped_column(String(32))
    primary_doctor_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("doctor_profiles.id", ondelete="SET NULL"),
        index=True,
    )
    attending_doctor_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("doctor_profiles.id", ondelete="SET NULL"),
        index=True,
    )
    created_by_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        index=True,
    )

    primary_condition: Mapped[str | None] = mapped_column(String(255))
    discharge_diagnosis: Mapped[str | None] = mapped_column(Text)
    secondary_diagnoses: Mapped[list[str] | None] = mapped_column(JSONB)
    comorbidities: Mapped[list[str] | None] = mapped_column(JSONB)
    allergies: Mapped[list[str] | None] = mapped_column(JSONB)
    procedure_name: Mapped[str | None] = mapped_column(String(255))
    procedure_date: Mapped[date | None] = mapped_column(Date)
    lvef: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))
    nyha_class: Mapped[str | None] = mapped_column(String(8))
    heart_failure_type: Mapped[str | None] = mapped_column(String(32))
    cardiac_device: Mapped[str | None] = mapped_column(String(128))
    device_details: Mapped[str | None] = mapped_column(Text)
    anticoagulation_required: Mapped[bool | None] = mapped_column(Boolean)
    target_inr: Mapped[Decimal | None] = mapped_column(Numeric(4, 2))

    height_cm: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))
    weight_kg: Mapped[Decimal | None] = mapped_column(Numeric(6, 2))
    bmi: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))
    baseline_weight_kg: Mapped[Decimal | None] = mapped_column(Numeric(6, 2))
    target_weight_kg: Mapped[Decimal | None] = mapped_column(Numeric(6, 2))

    discharge_systolic_bp: Mapped[int | None] = mapped_column(Integer)
    discharge_diastolic_bp: Mapped[int | None] = mapped_column(Integer)
    discharge_heart_rate: Mapped[int | None] = mapped_column(Integer)
    discharge_respiratory_rate: Mapped[int | None] = mapped_column(Integer)
    discharge_spo2: Mapped[int | None] = mapped_column(Integer)
    discharge_temperature_c: Mapped[Decimal | None] = mapped_column(Numeric(4, 1))

    discharge_sodium: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))
    discharge_potassium: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))
    discharge_creatinine: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))
    discharge_egfr: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))
    discharge_hemoglobin: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))
    discharge_hba1c: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))
    discharge_bnp: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    discharge_nt_probnp: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    discharge_inr: Mapped[Decimal | None] = mapped_column(Numeric(4, 2))

    smoking_status: Mapped[str | None] = mapped_column(String(32))
    alcohol_use: Mapped[str | None] = mapped_column(String(32))
    physical_activity_level: Mapped[str | None] = mapped_column(String(64))
    lives_alone: Mapped[bool | None] = mapped_column(Boolean)
    transportation_access: Mapped[bool | None] = mapped_column(Boolean)
    code_status: Mapped[str | None] = mapped_column(String(64))

    medications: Mapped[list[dict[str, object]] | None] = mapped_column(JSONB)
    symptoms_to_watch: Mapped[list[str] | None] = mapped_column(JSONB)
    red_flags: Mapped[list[str] | None] = mapped_column(JSONB)
    activity_restrictions: Mapped[str | None] = mapped_column(Text)
    diet_instructions: Mapped[str | None] = mapped_column(Text)
    home_monitoring_instructions: Mapped[str | None] = mapped_column(Text)
    follow_up_plan: Mapped[str | None] = mapped_column(Text)
    next_follow_up_date: Mapped[date | None] = mapped_column(Date)
    readmission_risk: Mapped[str | None] = mapped_column(String(32))
    readmission_risk_score: Mapped[int | None] = mapped_column(Integer)
    clinical_notes: Mapped[str | None] = mapped_column(Text)

    consent_to_contact: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        server_default=false(),
        nullable=False,
    )
    consent_date: Mapped[date | None] = mapped_column(Date)
    last_contacted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    onboarding_completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    user: Mapped[User] = relationship(
        back_populates="patient_profile",
        foreign_keys=[user_id],
    )
    primary_doctor: Mapped[DoctorProfile | None] = relationship(
        back_populates="primary_patients",
        foreign_keys=[primary_doctor_id],
    )
    attending_doctor: Mapped[DoctorProfile | None] = relationship(
        back_populates="attending_patients",
        foreign_keys=[attending_doctor_id],
    )
    appointments: Mapped[list[Appointment]] = relationship(
        back_populates="patient",
        cascade="all, delete-orphan",
    )
    queries: Mapped[list[PatientQuery]] = relationship(
        back_populates="patient",
        cascade="all, delete-orphan",
    )
