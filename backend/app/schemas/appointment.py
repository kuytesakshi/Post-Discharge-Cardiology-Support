from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import AppointmentStatus


class AppointmentCreate(BaseModel):
    doctor_id: UUID
    scheduled_at: datetime
    duration_minutes: int = Field(default=30, ge=15, le=120)
    reason: str | None = Field(default=None, max_length=2000)


class AppointmentStatusUpdate(BaseModel):
    status: AppointmentStatus
    notes: str | None = Field(default=None, max_length=2000)
    meeting_link: str | None = Field(default=None, max_length=512)


class AppointmentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    patient_id: UUID
    doctor_id: UUID
    scheduled_at: datetime
    duration_minutes: int
    status: AppointmentStatus
    reason: str | None
    notes: str | None
    meeting_link: str | None
    created_at: datetime
    updated_at: datetime
