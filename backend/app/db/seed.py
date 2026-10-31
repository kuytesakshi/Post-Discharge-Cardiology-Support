import logging
import uuid
from datetime import UTC, date, datetime, time, timedelta

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import hash_password
from app.models import (
    Appointment,
    AppointmentStatus,
    DoctorProfile,
    PatientProfile,
    PatientQuery,
    QueryStatus,
    Role,
    User,
    UserRole,
)

logger = logging.getLogger(__name__)

ADMIN_ROLE_ID = uuid.UUID("00000000-0000-0000-0000-000000000003")


async def seed_admin(db: AsyncSession) -> None:
    if not settings.SEED_ADMIN:
        return

    if not settings.ADMIN_PASSWORD:
        logger.warning("SEED_ADMIN is enabled but ADMIN_PASSWORD is not set")
        return

    role = await db.scalar(select(Role).where(Role.name == UserRole.ADMIN.value))
    if role is None:
        role = Role(id=ADMIN_ROLE_ID, name=UserRole.ADMIN.value)
        db.add(role)
        await db.flush()

    email = settings.ADMIN_EMAIL.lower()
    existing_user = await db.scalar(select(User).where(User.email == email))
    if existing_user is not None:
        if existing_user.role.name != UserRole.ADMIN.value:
            logger.warning("An existing non-admin user already uses ADMIN_EMAIL")
        return

    admin = User(
        name=settings.ADMIN_NAME,
        email=email,
        hashed_password=hash_password(settings.ADMIN_PASSWORD),
        role=role,
        is_active=True,
    )
    db.add(admin)
    await db.commit()
    logger.info("Seeded admin user %s", email)


async def seed_demo(db: AsyncSession) -> None:
    if not settings.SEED_DEMO:
        return

    existing_patients = await db.scalar(select(func.count(PatientProfile.id)))
    if existing_patients:
        return

    admin = await db.scalar(
        select(User).where(User.email == settings.ADMIN_EMAIL.lower())
    )
    doctor_role = await db.scalar(
        select(Role).where(Role.name == UserRole.DOCTOR.value)
    )
    patient_role = await db.scalar(
        select(Role).where(Role.name == UserRole.PATIENT.value)
    )
    if doctor_role is None or patient_role is None:
        logger.warning("Demo seed skipped because doctor/patient roles are missing")
        return

    now = datetime.now(UTC)
    today = now.date()
    admin_id = admin.id if admin is not None else None

    doctor_specs = [
        (
            "Maya Chen",
            "maya.chen@cardio.example",
            "Heart failure",
            "09:00",
            "17:00",
        ),
        (
            "Julian Park",
            "julian.park@cardio.example",
            "Interventional cardiology",
            "08:00",
            "16:00",
        ),
        (
            "Lena Ortiz",
            "lena.ortiz@cardio.example",
            "Electrophysiology",
            "10:00",
            "18:00",
        ),
        (
            "Samuel Okafor",
            "samuel.okafor@cardio.example",
            "Preventive cardiology",
            "09:00",
            "15:00",
        ),
    ]
    doctors: list[DoctorProfile] = []
    for index, (name, email, specialty, start_time, end_time) in enumerate(
        doctor_specs
    ):
        user = User(
            name=f"Dr. {name}",
            email=email,
            hashed_password=hash_password(settings.DEMO_PASSWORD),
            role=doctor_role,
            is_active=True,
            created_at=now - timedelta(days=30 - index),
        )
        user.doctor_profile = DoctorProfile(
            title="Dr.",
            designation="Consultant Cardiologist",
            specialty=specialty,
            department="Cardiology",
            status="active",
            accepting_new_patients=True,
            telehealth_enabled=True,
            patients_attended_count=150 + index * 40,
            availability_notes="Monday to Friday",
            office_hours=[
                {
                    "day": day_name,
                    "start_time": start_time,
                    "end_time": end_time,
                    "is_closed": False,
                }
                for day_name in (
                    "Monday",
                    "Tuesday",
                    "Wednesday",
                    "Thursday",
                    "Friday",
                )
            ],
            license_number=f"DEMO-LIC-{index + 1:03d}",
            npi_number=f"DEMO-NPI-{index + 1:03d}",
            created_by_id=admin_id,
            created_at=now - timedelta(days=30 - index),
        )
        db.add(user)
        doctors.append(user.doctor_profile)
    await db.flush()

    patient_specs = [
        (
            "Eleanor Brooks",
            "eleanor.brooks@example.com",
            date(1958, 3, 14),
            "HFrEF follow-up",
            "High",
            12,
            0,
            0,
        ),
        (
            "Marcus Reed",
            "marcus.reed@example.com",
            date(1972, 7, 22),
            "Post-MI recovery",
            "Moderate",
            6,
            1,
            1,
        ),
        (
            "Priya Nair",
            "priya.nair@example.com",
            date(1955, 11, 2),
            "Atrial fibrillation",
            "High",
            11,
            -2,
            0,
        ),
        (
            "Thomas Avery",
            "thomas.avery@example.com",
            date(1964, 1, 19),
            "CABG recovery",
            "Low",
            2,
            3,
            2,
        ),
        (
            "Sofia Alvarez",
            "sofia.alvarez@example.com",
            date(1979, 9, 8),
            "Pericarditis",
            "Low",
            1,
            5,
            1,
        ),
        (
            "James Whitfield",
            "james.whitfield@example.com",
            date(1949, 5, 30),
            "Heart failure",
            "Moderate",
            7,
            0,
            0,
        ),
        (
            "Aisha Rahman",
            "aisha.rahman@example.com",
            date(1986, 12, 12),
            "Post-angioplasty",
            "Low",
            2,
            1,
            3,
        ),
        (
            "Robert Kim",
            "robert.kim@example.com",
            date(1952, 8, 25),
            "Cardiac arrhythmia",
            "High",
            10,
            -1,
            2,
        ),
    ]
    patients: list[PatientProfile] = []
    for index, (
        name,
        email,
        date_of_birth,
        condition,
        risk,
        risk_score,
        follow_up_offset,
        doctor_index,
    ) in enumerate(patient_specs):
        created_at = now - timedelta(days=6 - (index % 7), hours=index)
        user = User(
            name=name,
            email=email,
            hashed_password=hash_password(settings.DEMO_PASSWORD),
            role=patient_role,
            is_active=True,
            created_at=created_at,
        )
        doctor = doctors[doctor_index]
        user.patient_profile = PatientProfile(
            status="active",
            date_of_birth=date_of_birth,
            gender="female" if index % 2 == 0 else "male",
            phone=f"+1-555-01{index:02d}",
            primary_condition=condition,
            discharge_diagnosis=condition,
            discharge_date=today - timedelta(days=14 - index),
            next_follow_up_date=today + timedelta(days=follow_up_offset),
            readmission_risk=risk,
            readmission_risk_score=risk_score,
            primary_doctor_id=doctor.id,
            attending_doctor_id=doctor.id,
            created_by_id=admin_id,
            consent_to_contact=True,
            consent_date=today - timedelta(days=14 - index),
            onboarding_completed_at=created_at,
            created_at=created_at,
        )
        db.add(user)
        patients.append(user.patient_profile)
    await db.flush()

    appointment_reasons = ["Follow-up", "Medication review", "Risk check"]
    for day_offset in range(7):
        day = today - timedelta(days=6 - day_offset)
        slots = [time(9, 0), time(11, 0), time(13, 0)]
        if day == today:
            slots = [time(9, 0), time(10, 30), time(13, 0), time(15, 45)]
        for slot_index, slot in enumerate(slots):
            patient = patients[(day_offset * 3 + slot_index) % len(patients)]
            doctor = doctors[(day_offset + slot_index) % len(doctors)]
            scheduled_at = datetime.combine(day, slot, tzinfo=UTC)
            if scheduled_at < now - timedelta(minutes=30):
                status = AppointmentStatus.COMPLETED
            elif scheduled_at <= now + timedelta(hours=2):
                status = AppointmentStatus.CONFIRMED
            else:
                status = AppointmentStatus.PENDING
            db.add(
                Appointment(
                    patient_id=patient.id,
                    doctor_id=doctor.id,
                    scheduled_at=scheduled_at,
                    duration_minutes=30,
                    status=status,
                    reason=appointment_reasons[
                        (day_offset + slot_index) % len(appointment_reasons)
                    ],
                    created_at=scheduled_at,
                )
            )

    query_specs = [
        (
            "Feeling dizzy after new medication",
            "I started the new medication yesterday and feel dizzy in the morning.",
            QueryStatus.OPEN,
            0,
            0,
            now - timedelta(hours=4),
        ),
        (
            "Swelling in my ankles",
            "My ankles have been more swollen than usual since yesterday evening.",
            QueryStatus.OPEN,
            2,
            0,
            now - timedelta(hours=2),
        ),
        (
            "Can I exercise after discharge?",
            "I usually walk every morning. Is it safe to continue this week?",
            QueryStatus.ANSWERED,
            3,
            2,
            now - timedelta(days=1),
        ),
        (
            "Missed medication dose",
            "I forgot my evening dose yesterday. Should I take it this morning?",
            QueryStatus.OPEN,
            1,
            1,
            now - timedelta(minutes=45),
        ),
    ]
    for subject, body, status, patient_index, doctor_index, created_at in query_specs:
        db.add(
            PatientQuery(
                patient_id=patients[patient_index].id,
                doctor_id=doctors[doctor_index].id,
                subject=subject,
                body=body,
                status=status,
                response=(
                    "Thanks for checking in. Please continue your usual routine and "
                    "contact the clinic if you notice chest pain or shortness of breath."
                    if status == QueryStatus.ANSWERED
                    else None
                ),
                responded_at=(
                    created_at + timedelta(hours=1)
                    if status == QueryStatus.ANSWERED
                    else None
                ),
                created_at=created_at,
            )
        )

    await db.commit()
    logger.info("Seeded demo dashboard data")
