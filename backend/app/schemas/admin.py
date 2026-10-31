from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel

from app.schemas.doctor import DoctorProfileBase, DoctorProfileRead
from app.schemas.patient import PatientProfileBase, PatientProfileRead
from app.schemas.user import UserCreate, UserRead


class DashboardModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class AdminPatientCreate(UserCreate):
    profile: PatientProfileBase = Field(default_factory=PatientProfileBase)


class AdminDoctorCreate(UserCreate):
    profile: DoctorProfileBase = Field(default_factory=DoctorProfileBase)


class AdminPatientRead(BaseModel):
    user: UserRead
    profile: PatientProfileRead


class AdminDoctorRead(BaseModel):
    user: UserRead
    profile: DoctorProfileRead


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
