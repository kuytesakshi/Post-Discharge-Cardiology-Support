from __future__ import annotations

import uuid
from datetime import date
from typing import TYPE_CHECKING

from sqlalchemy import Date, ForeignKey, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.appointment import Appointment
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
    date_of_birth: Mapped[date | None] = mapped_column(Date)
    gender: Mapped[str | None] = mapped_column(String(32))
    phone: Mapped[str | None] = mapped_column(String(32))
    discharge_date: Mapped[date | None] = mapped_column(Date)
    primary_condition: Mapped[str | None] = mapped_column(String(255))
    medications: Mapped[list[str] | None] = mapped_column(JSONB)
    emergency_contact_name: Mapped[str | None] = mapped_column(String(255))
    emergency_contact_phone: Mapped[str | None] = mapped_column(String(32))

    user: Mapped[User] = relationship(back_populates="patient_profile")
    appointments: Mapped[list[Appointment]] = relationship(
        back_populates="patient",
        cascade="all, delete-orphan",
    )
    queries: Mapped[list[PatientQuery]] = relationship(
        back_populates="patient",
        cascade="all, delete-orphan",
    )
