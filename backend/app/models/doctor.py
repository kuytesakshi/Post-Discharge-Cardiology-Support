from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.appointment import Appointment
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
    specialty: Mapped[str | None] = mapped_column(String(255))
    license_number: Mapped[str | None] = mapped_column(String(128), unique=True)
    hospital: Mapped[str | None] = mapped_column(String(255))
    years_of_experience: Mapped[int | None] = mapped_column(Integer)
    bio: Mapped[str | None] = mapped_column(Text)

    user: Mapped[User] = relationship(back_populates="doctor_profile")
    appointments: Mapped[list[Appointment]] = relationship(
        back_populates="doctor",
        cascade="all, delete-orphan",
    )
    answered_queries: Mapped[list[PatientQuery]] = relationship(
        back_populates="doctor",
    )
