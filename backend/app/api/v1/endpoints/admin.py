from typing import Annotated, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.deps import DbSession, require_roles
from app.models import User, UserRole
from app.schemas.admin import (
    AdminDashboardRead,
    AdminDoctorCreate,
    AdminDoctorOption,
    AdminDoctorRead,
    AdminPatientCreate,
    AdminPatientDetailRead,
    AdminPatientListRead,
    AdminPatientRead,
    AdminPatientUpdate,
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


@router.get("/dashboard", response_model=AdminDashboardRead)
async def read_dashboard(
    db: DbSession,
    current_admin: AdminUser,
) -> AdminDashboardRead:
    return await admin_service.get_dashboard(db, current_admin)


@router.get("/patients", response_model=AdminPatientListRead)
async def read_patients(
    db: DbSession,
    current_admin: AdminUser,
    search: str | None = None,
    status_filter: Annotated[str | None, Query(alias="status")] = None,
    risk: Literal["low", "moderate", "high"] | None = None,
    doctor_id: UUID | None = None,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 10,
    sort: Literal["created_at", "name", "next_follow_up"] = "created_at",
) -> AdminPatientListRead:
    return await admin_service.list_patients(
        db,
        search=search,
        status=status_filter,
        risk=risk,
        doctor_id=doctor_id,
        page=page,
        page_size=page_size,
        sort=sort,
    )


@router.get(
    "/patients/{patient_id}",
    response_model=AdminPatientDetailRead,
)
async def read_patient(
    patient_id: UUID,
    db: DbSession,
    current_admin: AdminUser,
) -> AdminPatientDetailRead:
    try:
        return await admin_service.get_patient(db, patient_id)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc


@router.patch(
    "/patients/{patient_id}",
    response_model=AdminPatientDetailRead,
)
async def update_patient(
    patient_id: UUID,
    payload: AdminPatientUpdate,
    db: DbSession,
    current_admin: AdminUser,
) -> AdminPatientDetailRead:
    try:
        return await admin_service.update_patient(db, patient_id, payload)
    except ValueError as exc:
        detail = str(exc)
        if detail == "Patient not found":
            status_code = status.HTTP_404_NOT_FOUND
        elif detail in {
            "Email is already registered",
            "Medical record number is already in use",
        }:
            status_code = status.HTTP_409_CONFLICT
        else:
            status_code = status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code=status_code, detail=detail) from exc


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
        detail = str(exc)
        status_code = (
            status.HTTP_409_CONFLICT
            if detail == "Medical record number is already in use"
            else status.HTTP_400_BAD_REQUEST
        )
        raise HTTPException(status_code=status_code, detail=detail) from exc

    return AdminPatientRead(user=user, profile=user.patient_profile)


@router.get(
    "/doctors/options",
    response_model=list[AdminDoctorOption],
)
async def read_doctor_options(
    db: DbSession,
    current_admin: AdminUser,
) -> list[AdminDoctorOption]:
    return await admin_service.list_doctor_options(db)


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
