from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class PatientProfileBase(BaseModel):
    date_of_birth: date | None = None
    gender: str | None = Field(default=None, max_length=32)
    phone: str | None = Field(default=None, max_length=32)
    discharge_date: date | None = None
    primary_condition: str | None = Field(default=None, max_length=255)
    medications: list[str] | None = None
    emergency_contact_name: str | None = Field(default=None, max_length=255)
    emergency_contact_phone: str | None = Field(default=None, max_length=32)


class PatientProfileUpdate(PatientProfileBase):
    pass


class PatientProfileRead(PatientProfileBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
