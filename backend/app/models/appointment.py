from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    text,
)
from sqlalchemy import (
    Enum as SAEnum,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.enums import AppointmentStatus

if TYPE_CHECKING:
    from app.models.doctor import DoctorProfile
    from app.models.patient import PatientProfile


class Appointment(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "appointments"
    __table_args__ = (
        UniqueConstraint(
            "doctor_id",
            "scheduled_at",
            name="uq_appointments_doctor_scheduled_at",
        ),
    )

    patient_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("patient_profiles.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    doctor_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("doctor_profiles.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    scheduled_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    duration_minutes: Mapped[int] = mapped_column(
        Integer,
        default=30,
        server_default=text("30"),
        nullable=False,
    )
    status: Mapped[AppointmentStatus] = mapped_column(
        SAEnum(
            AppointmentStatus,
            name="appointment_status",
            values_callable=lambda enum_cls: [member.value for member in enum_cls],
        ),
        default=AppointmentStatus.PENDING,
        server_default=AppointmentStatus.PENDING.value,
        nullable=False,
    )
    reason: Mapped[str | None] = mapped_column(Text)
    notes: Mapped[str | None] = mapped_column(Text)
    meeting_link: Mapped[str | None] = mapped_column(String(512))

    patient: Mapped[PatientProfile] = relationship(back_populates="appointments")
    doctor: Mapped[DoctorProfile] = relationship(back_populates="appointments")
