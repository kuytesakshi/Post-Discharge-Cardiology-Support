from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.models import DoctorProfile, PatientProfile, Role, User, UserRole
from app.schemas.admin import AdminDoctorCreate, AdminPatientCreate


async def _get_role(db: AsyncSession, role_name: UserRole) -> Role:
    role = await db.scalar(select(Role).where(Role.name == role_name.value))
    if role is None:
        raise ValueError(f"Role '{role_name.value}' is not configured")
    return role


async def create_patient(db: AsyncSession, payload: AdminPatientCreate) -> User:
    role = await _get_role(db, UserRole.PATIENT)
    user = User(
        name=payload.name,
        email=payload.email.lower(),
        hashed_password=hash_password(payload.password),
        role=role,
    )
    user.patient_profile = PatientProfile(**payload.profile.model_dump())

    db.add(user)
    await db.commit()
    await db.refresh(user)
    await db.refresh(user, ["role", "patient_profile"])
    return user


async def create_doctor(db: AsyncSession, payload: AdminDoctorCreate) -> User:
    role = await _get_role(db, UserRole.DOCTOR)
    user = User(
        name=payload.name,
        email=payload.email.lower(),
        hashed_password=hash_password(payload.password),
        role=role,
    )
    user.doctor_profile = DoctorProfile(**payload.profile.model_dump())

    db.add(user)
    await db.commit()
    await db.refresh(user)
    await db.refresh(user, ["role", "doctor_profile"])
    return user
