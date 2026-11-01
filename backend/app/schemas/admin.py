from datetime import date, datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator
from pydantic.alias_generators import to_camel

from app.schemas.doctor import DoctorProfileBase, DoctorProfileRead
from app.schemas.patient import (
    PatientProfileRead,
    PatientProfileUpdate,
    PatientProfileWrite,
)
from app.schemas.user import UserCreate, UserRead
from app.schemas.validators import validate_person_name


class DashboardModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class AdminPatientCreate(UserCreate):
    profile: PatientProfileWrite = Field(default_factory=PatientProfileWrite)

    @field_validator("name")
    @classmethod
    def _validate_name(cls, value: str) -> str:
        normalized = validate_person_name(value, "Full name")
        if normalized is None:
            raise ValueError("Full name is required")
        return normalized


class AdminDoctorCreate(UserCreate):
    profile: DoctorProfileBase = Field(default_factory=DoctorProfileBase)


class AdminPatientRead(BaseModel):
    user: UserRead
    profile: PatientProfileRead


class AdminDoctorRead(BaseModel):
    user: UserRead
    profile: DoctorProfileRead


class AdminPatientSummary(DashboardModel):
    total: int
    active: int
    high_risk: int
    overdue_follow_ups: int


class AdminPatientListItem(DashboardModel):
    id: UUID
    user_id: UUID
    name: str
    email: str
    medical_record_number: str | None
    age: int | None
    gender: str | None
    phone: str | None
    primary_condition: str | None
    readmission_risk: str | None
    readmission_risk_score: int | None
    risk: Literal["low", "moderate", "high"]
    status: str
    next_follow_up_date: date | None
    next_follow_up: str
    primary_doctor_id: UUID | None
    primary_doctor_name: str | None
    created_at: datetime


class AdminPatientListRead(DashboardModel):
    items: list[AdminPatientListItem]
    total: int
    page: int
    page_size: int
    total_pages: int
    summary: AdminPatientSummary


class AdminPatientDetailRead(DashboardModel):
    user: UserRead
    profile: PatientProfileRead
    primary_doctor_name: str | None
    attending_doctor_name: str | None
    risk: Literal["low", "moderate", "high"]


class AdminPatientUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=255)
    email: EmailStr | None = None
    profile: PatientProfileUpdate | None = None

    @field_validator("name")
    @classmethod
    def _validate_name(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return validate_person_name(value, "Full name")


class AdminDoctorOption(DashboardModel):
    id: UUID
    name: str
    specialty: str | None
    status: str


class DashboardMetric(DashboardModel):
    label: str
    value: str
    helper: str
    trend: Literal["up", "down", "flat"]
    trend_label: str
    tone: Literal["teal", "emerald", "coral", "amber"]
    sparkline: list[int]


class DashboardPatient(DashboardModel):
    id: UUID
    name: str
    age: int | None
    condition: str
    risk: Literal["low", "moderate", "high"]
    doctor: str
    next_follow_up: str
    status: Literal["on_track", "needs_attention", "overdue"]


class DashboardDoctor(DashboardModel):
    id: UUID
    name: str
    initials: str
    specialty: str
    patients: int
    availability: Literal["available", "in_consult", "off_duty"]


class DashboardAppointment(DashboardModel):
    id: UUID
    time: str
    patient: str
    doctor: str
    type: str
    status: Literal["pending", "confirmed", "completed", "cancelled", "no_show"]


class DashboardAlert(DashboardModel):
    id: str
    title: str
    description: str
    severity: Literal["high", "medium", "low"]
    href: str
    action_label: str


class DashboardActivity(DashboardModel):
    id: str
    title: str
    description: str
    time: str
    tone: Literal["emerald", "teal", "coral", "amber"]


class FollowUpPoint(DashboardModel):
    label: str
    completed: int
    scheduled: int


class RiskSlice(DashboardModel):
    label: str
    value: int
    color: str


class AdminDashboardRead(DashboardModel):
    admin_name: str
    display_date: str
    last_updated: str
    generated_at: datetime
    metrics: list[DashboardMetric]
    follow_up_series: list[FollowUpPoint]
    risk_mix: list[RiskSlice]
    recent_patients: list[DashboardPatient]
    care_team: list[DashboardDoctor]
    appointments: list[DashboardAppointment]
    alerts: list[DashboardAlert]
    activity: list[DashboardActivity]
