from pydantic import BaseModel, Field

from app.schemas.doctor import DoctorProfileBase, DoctorProfileRead
from app.schemas.patient import PatientProfileBase, PatientProfileRead
from app.schemas.user import UserCreate, UserRead


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
