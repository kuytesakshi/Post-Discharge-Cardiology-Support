from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.enums import QueryStatus

if TYPE_CHECKING:
    from app.models.doctor import DoctorProfile
    from app.models.patient import PatientProfile


class PatientQuery(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "patient_queries"

    patient_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("patient_profiles.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    doctor_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("doctor_profiles.id", ondelete="SET NULL"),
        index=True,
    )
    subject: Mapped[str] = mapped_column(String(255), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[QueryStatus] = mapped_column(
        SAEnum(
            QueryStatus,
            name="query_status",
            values_callable=lambda enum_cls: [member.value for member in enum_cls],
        ),
        default=QueryStatus.OPEN,
        server_default=QueryStatus.OPEN.value,
        nullable=False,
    )
    response: Mapped[str | None] = mapped_column(Text)
    responded_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    patient: Mapped[PatientProfile] = relationship(back_populates="queries")
    doctor: Mapped[DoctorProfile | None] = relationship(back_populates="answered_queries")
