from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.user import UserRead


class DoctorProfileBase(BaseModel):
    specialty: str | None = Field(default=None, max_length=255)
    license_number: str | None = Field(default=None, max_length=128)
    hospital: str | None = Field(default=None, max_length=255)
    years_of_experience: int | None = Field(default=None, ge=0, le=80)
    bio: str | None = None


class DoctorProfileUpdate(DoctorProfileBase):
    pass


class DoctorProfileRead(DoctorProfileBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime


class DoctorPublic(DoctorProfileRead):
    user: UserRead
