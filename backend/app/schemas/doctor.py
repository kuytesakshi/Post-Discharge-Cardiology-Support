from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.user import UserRead


class DoctorOfficeHours(BaseModel):
    day: str = Field(min_length=1, max_length=16)
    start_time: str | None = Field(default=None, max_length=16)
    end_time: str | None = Field(default=None, max_length=16)
    is_closed: bool = False


class DoctorProfileBase(BaseModel):
    title: str | None = Field(default=None, max_length=32)
    designation: str | None = Field(default=None, max_length=128)
    specialty: str | None = Field(default=None, max_length=255)
    subspecialty: str | None = Field(default=None, max_length=128)
    department: str | None = Field(default=None, max_length=128)
    gender: str | None = Field(default=None, max_length=32)

    phone: str | None = Field(default=None, max_length=32)
    alternate_phone: str | None = Field(default=None, max_length=32)
    office_phone: str | None = Field(default=None, max_length=32)
    office_extension: str | None = Field(default=None, max_length=16)
    fax: str | None = Field(default=None, max_length=32)

    office_address_line1: str | None = Field(default=None, max_length=255)
    office_address_line2: str | None = Field(default=None, max_length=255)
    city: str | None = Field(default=None, max_length=128)
    state: str | None = Field(default=None, max_length=128)
    postal_code: str | None = Field(default=None, max_length=20)
    country: str | None = Field(default=None, max_length=64)

    hospital: str | None = Field(default=None, max_length=255)
    clinic_name: str | None = Field(default=None, max_length=255)

    license_number: str | None = Field(default=None, max_length=128)
    license_state: str | None = Field(default=None, max_length=64)
    license_expiry_date: date | None = None
    npi_number: str | None = Field(default=None, max_length=32)
    years_of_experience: int | None = Field(default=None, ge=0, le=80)
    patients_attended_count: int = Field(default=0, ge=0)

    medical_school: str | None = Field(default=None, max_length=255)
    residency: str | None = Field(default=None, max_length=255)
    fellowship: str | None = Field(default=None, max_length=255)
    board_certifications: list[str] | None = None
    professional_memberships: list[str] | None = None

    languages: list[str] | None = None
    clinical_interests: list[str] | None = None
    conditions_treated: list[str] | None = None
    procedures_performed: list[str] | None = None

    consultation_modes: list[str] | None = None
    telehealth_enabled: bool = False
    accepting_new_patients: bool = True
    consultation_fee: float | None = Field(default=None, ge=0)
    availability_notes: str | None = None
    office_hours: list[DoctorOfficeHours] | None = None

    status: str = Field(default="active", max_length=32)
    bio: str | None = None


class DoctorProfileUpdate(DoctorProfileBase):
    pass


class DoctorProfileRead(DoctorProfileBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    created_by_id: UUID | None
    created_at: datetime
    updated_at: datetime


class DoctorPublic(DoctorProfileRead):
    user: UserRead
