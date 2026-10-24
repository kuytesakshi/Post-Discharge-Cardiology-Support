from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import DbSession, require_roles
from app.models import User, UserRole
from app.schemas.admin import (
    AdminDoctorCreate,
    AdminDoctorRead,
    AdminPatientCreate,
    AdminPatientRead,
)
from app.services import admin_service, auth_service

router = APIRouter()

AdminUser = Annotated[User, Depends(require_roles(UserRole.ADMIN))]


async def _ensure_email_available(db: DbSession, email: str) -> None:
    existing_user = await auth_service.get_user_by_email(db, email)
    if existing_user is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email is already registered",
        )


@router.post(
    "/patients",
    response_model=AdminPatientRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_patient(
    payload: AdminPatientCreate,
    db: DbSession,
    current_admin: AdminUser,
) -> AdminPatientRead:
    await _ensure_email_available(db, payload.email)

    try:
        user = await admin_service.create_patient(
            db,
            payload,
            created_by_id=current_admin.id,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    return AdminPatientRead(user=user, profile=user.patient_profile)


@router.post(
    "/doctors",
    response_model=AdminDoctorRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_doctor(
    payload: AdminDoctorCreate,
    db: DbSession,
    current_admin: AdminUser,
) -> AdminDoctorRead:
    await _ensure_email_available(db, payload.email)

    try:
        user = await admin_service.create_doctor(
            db,
            payload,
            created_by_id=current_admin.id,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    return AdminDoctorRead(user=user, profile=user.doctor_profile)
