import uuid

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


async def _ensure_doctor_exists(
    db: AsyncSession,
    doctor_id: uuid.UUID | None,
    label: str,
) -> None:
    if doctor_id is None:
        return
    doctor = await db.scalar(select(DoctorProfile.id).where(DoctorProfile.id == doctor_id))
    if doctor is None:
        raise ValueError(f"{label} does not reference an existing doctor")


async def create_patient(
    db: AsyncSession,
    payload: AdminPatientCreate,
    created_by_id: uuid.UUID | None = None,
) -> User:
    role = await _get_role(db, UserRole.PATIENT)
    user = User(
        name=payload.name,
        email=payload.email.lower(),
        hashed_password=hash_password(payload.password),
        role=role,
    )

    profile_data = payload.profile.model_dump()
    primary_doctor_id = profile_data.get("primary_doctor_id")
    attending_doctor_id = profile_data.get("attending_doctor_id")
    await _ensure_doctor_exists(db, primary_doctor_id, "Primary doctor")
    await _ensure_doctor_exists(db, attending_doctor_id, "Attending doctor")
    if attending_doctor_id is None:
        profile_data["attending_doctor_id"] = primary_doctor_id
    if payload.profile.medications is not None:
        profile_data["medications"] = [
            medication.model_dump(mode="json") for medication in payload.profile.medications
        ]
    user.patient_profile = PatientProfile(
        **profile_data,
        created_by_id=created_by_id,
    )

    db.add(user)
    await db.commit()
    await db.refresh(user)
    await db.refresh(user, ["role", "patient_profile"])
    return user


async def create_doctor(
    db: AsyncSession,
    payload: AdminDoctorCreate,
    created_by_id: uuid.UUID | None = None,
) -> User:
    role = await _get_role(db, UserRole.DOCTOR)
    user = User(
        name=payload.name,
        email=payload.email.lower(),
        hashed_password=hash_password(payload.password),
        role=role,
    )
    profile_data = payload.profile.model_dump()
    if payload.profile.office_hours is not None:
        profile_data["office_hours"] = [
            entry.model_dump(mode="json") for entry in payload.profile.office_hours
        ]
    user.doctor_profile = DoctorProfile(
        **profile_data,
        created_by_id=created_by_id,
    )

    db.add(user)
    await db.commit()
    await db.refresh(user)
    await db.refresh(user, ["role", "doctor_profile"])
    return user
