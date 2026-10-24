from __future__ import annotations

import uuid
from datetime import date
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    Date,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    false,
    text,
    true,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.appointment import Appointment
    from app.models.patient import PatientProfile
    from app.models.query import PatientQuery
    from app.models.user import User


class DoctorProfile(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "doctor_profiles"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        index=True,
        nullable=False,
    )
    created_by_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        index=True,
    )

    title: Mapped[str | None] = mapped_column(String(32))
    designation: Mapped[str | None] = mapped_column(String(128))
    specialty: Mapped[str | None] = mapped_column(String(255))
    subspecialty: Mapped[str | None] = mapped_column(String(128))
    department: Mapped[str | None] = mapped_column(String(128))
    gender: Mapped[str | None] = mapped_column(String(32))

    phone: Mapped[str | None] = mapped_column(String(32))
    alternate_phone: Mapped[str | None] = mapped_column(String(32))
    office_phone: Mapped[str | None] = mapped_column(String(32))
    office_extension: Mapped[str | None] = mapped_column(String(16))
    fax: Mapped[str | None] = mapped_column(String(32))

    office_address_line1: Mapped[str | None] = mapped_column(String(255))
    office_address_line2: Mapped[str | None] = mapped_column(String(255))
    city: Mapped[str | None] = mapped_column(String(128))
    state: Mapped[str | None] = mapped_column(String(128))
    postal_code: Mapped[str | None] = mapped_column(String(20))
    country: Mapped[str | None] = mapped_column(String(64))

    hospital: Mapped[str | None] = mapped_column(String(255))
    clinic_name: Mapped[str | None] = mapped_column(String(255))

    license_number: Mapped[str | None] = mapped_column(String(128), unique=True)
    license_state: Mapped[str | None] = mapped_column(String(64))
    license_expiry_date: Mapped[date | None] = mapped_column(Date)
    npi_number: Mapped[str | None] = mapped_column(String(32), unique=True, index=True)
    years_of_experience: Mapped[int | None] = mapped_column(Integer)
    patients_attended_count: Mapped[int] = mapped_column(
        Integer,
        default=0,
        server_default=text("0"),
        nullable=False,
    )

    medical_school: Mapped[str | None] = mapped_column(String(255))
    residency: Mapped[str | None] = mapped_column(String(255))
    fellowship: Mapped[str | None] = mapped_column(String(255))
    board_certifications: Mapped[list[str] | None] = mapped_column(JSONB)
    professional_memberships: Mapped[list[str] | None] = mapped_column(JSONB)

    languages: Mapped[list[str] | None] = mapped_column(JSONB)
    clinical_interests: Mapped[list[str] | None] = mapped_column(JSONB)
    conditions_treated: Mapped[list[str] | None] = mapped_column(JSONB)
    procedures_performed: Mapped[list[str] | None] = mapped_column(JSONB)

    consultation_modes: Mapped[list[str] | None] = mapped_column(JSONB)
    telehealth_enabled: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        server_default=false(),
        nullable=False,
    )
    accepting_new_patients: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        server_default=true(),
        nullable=False,
    )
    consultation_fee: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))
    availability_notes: Mapped[str | None] = mapped_column(Text)
    office_hours: Mapped[list[dict[str, object]] | None] = mapped_column(JSONB)

    status: Mapped[str] = mapped_column(
        String(32),
        default="active",
        server_default=text("'active'"),
        nullable=False,
    )
    bio: Mapped[str | None] = mapped_column(Text)

    user: Mapped[User] = relationship(
        back_populates="doctor_profile",
        foreign_keys=[user_id],
    )
    appointments: Mapped[list[Appointment]] = relationship(
        back_populates="doctor",
        cascade="all, delete-orphan",
    )
    answered_queries: Mapped[list[PatientQuery]] = relationship(
        back_populates="doctor",
    )
    primary_patients: Mapped[list[PatientProfile]] = relationship(
        back_populates="primary_doctor",
        foreign_keys="PatientProfile.primary_doctor_id",
    )
    attending_patients: Mapped[list[PatientProfile]] = relationship(
        back_populates="attending_doctor",
        foreign_keys="PatientProfile.attending_doctor_id",
    )
