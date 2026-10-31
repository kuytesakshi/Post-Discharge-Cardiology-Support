import uuid
from datetime import UTC, date, datetime, time, timedelta
from typing import Literal

from sqlalchemy import case, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import aliased

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
from app.schemas.admin import (
    AdminDashboardRead,
    AdminDoctorCreate,
    AdminPatientCreate,
    DashboardActivity,
    DashboardAlert,
    DashboardAppointment,
    DashboardDoctor,
    DashboardMetric,
    DashboardPatient,
    FollowUpPoint,
    RiskSlice,
)


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


def _risk_bucket(risk: str | None, score: int | None) -> Literal["low", "moderate", "high"]:
    normalized = (risk or "").strip().lower()
    if normalized in {"high", "very high", "severe"} or (
        score is not None and score >= 10
    ):
        return "high"
    if normalized in {"moderate", "medium", "intermediate"} or (
        score is not None and score >= 5
    ):
        return "moderate"
    return "low"


def _high_risk_filter():
    normalized = func.lower(func.trim(func.coalesce(PatientProfile.readmission_risk, "")))
    return or_(
        normalized.in_(["high", "very high", "severe"]),
        func.coalesce(PatientProfile.readmission_risk_score, 0) >= 10,
    )


def _as_date(value: object) -> date | None:
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    if isinstance(value, str):
        try:
            return date.fromisoformat(value)
        except ValueError:
            return None
    return None


def _age(date_of_birth: date | None, today: date) -> int | None:
    if date_of_birth is None:
        return None
    return today.year - date_of_birth.year - (
        (today.month, today.day) < (date_of_birth.month, date_of_birth.day)
    )


def _initials(name: str) -> str:
    parts = [
        part
        for part in name.replace(".", " ").split()
        if part.lower() not in {"dr", "prof", "mr", "mrs", "ms"}
    ]
    if not parts:
        return "?"
    return "".join(part[0].upper() for part in parts[:2])


def _doctor_display_name(title: str | None, name: str) -> str:
    cleaned_title = (title or "").strip()
    cleaned_name = name.strip()
    if cleaned_title and not cleaned_name.lower().startswith(cleaned_title.lower()):
        return f"{cleaned_title} {cleaned_name}"
    return cleaned_name


def _relative_time(value: datetime, now: datetime) -> str:
    delta = now - value
    seconds = max(int(delta.total_seconds()), 0)
    if seconds < 60:
        return "just now"
    minutes = seconds // 60
    if minutes < 60:
        return f"{minutes} min ago"
    hours = minutes // 60
    if hours < 24:
        return f"{hours} hour{'s' if hours != 1 else ''} ago"
    days = hours // 24
    return f"{days} day{'s' if days != 1 else ''} ago"


def _duration(value: datetime, now: datetime) -> str:
    delta = now - value
    seconds = max(int(delta.total_seconds()), 0)
    if seconds < 60:
        return "less than a minute"
    minutes = seconds // 60
    if minutes < 60:
        return f"{minutes} minute{'s' if minutes != 1 else ''}"
    hours = minutes // 60
    if hours < 24:
        return f"{hours} hour{'s' if hours != 1 else ''}"
    days = hours // 24
    return f"{days} day{'s' if days != 1 else ''}"


def _follow_up_label(value: datetime | date | None, today: date) -> str:
    if value is None:
        return "Not scheduled"
    if isinstance(value, datetime):
        day = value.date()
        time_label = value.strftime("%H:%M")
    else:
        day = value
        time_label = None
    delta = (day - today).days
    if delta < 0:
        days = abs(delta)
        return f"Overdue by {days} day{'s' if days != 1 else ''}"
    if delta == 0:
        return f"Today, {time_label}" if time_label else "Today"
    if delta == 1:
        return f"Tomorrow, {time_label}" if time_label else "Tomorrow"
    formatted = day.strftime("%a, %d %b")
    return f"{formatted}, {time_label}" if time_label else formatted


def _is_overdue(value: datetime | date | None, today: date) -> bool:
    if isinstance(value, datetime):
        return value.date() < today
    if isinstance(value, date):
        return value < today
    return False


def _trend(series: list[int]) -> Literal["up", "down", "flat"]:
    if len(series) < 2:
        return "flat"
    if series[-1] > series[-2]:
        return "up"
    if series[-1] < series[-2]:
        return "down"
    return "flat"


def _delta_label(series: list[int]) -> str:
    if len(series) < 2:
        return "No change"
    delta = series[-1] - series[-2]
    if delta == 0:
        return "No change"
    return f"{delta:+d} this week"


def _daily_counts(rows) -> dict[date, int]:
    counts: dict[date, int] = {}
    for row in rows:
        day = _as_date(row[0])
        if day is not None:
            counts[day] = counts.get(day, 0) + int(row[1])
    return counts


def _cumulative_series(
    daily_counts: dict[date, int],
    start_day: date,
    days: int = 7,
) -> list[int]:
    base = sum(count for day, count in daily_counts.items() if day < start_day)
    series: list[int] = []
    running = base
    for offset in range(days):
        running += daily_counts.get(start_day + timedelta(days=offset), 0)
        series.append(running)
    return series


def _availability(
    profile: DoctorProfile,
    in_consult_ids: set[uuid.UUID],
    now: datetime,
) -> Literal["available", "in_consult", "off_duty"]:
    if profile.id in in_consult_ids:
        return "in_consult"
    if (profile.status or "active").lower() != "active":
        return "off_duty"
    if profile.office_hours:
        day_name = now.strftime("%A").lower()
        current_time = now.strftime("%H:%M")
        for entry in profile.office_hours:
            if not isinstance(entry, dict):
                continue
            if str(entry.get("day", "")).lower() != day_name:
                continue
            if entry.get("is_closed"):
                return "off_duty"
            start = entry.get("start_time")
            end = entry.get("end_time")
            if start and end and start <= current_time <= end:
                return "available"
        return "off_duty"
    return "available" if profile.accepting_new_patients else "off_duty"


async def get_dashboard(db: AsyncSession, admin: User) -> AdminDashboardRead:
    now = datetime.now(UTC)
    today = now.date()
    start_day = today - timedelta(days=6)
    week_start = datetime.combine(start_day, time.min, tzinfo=UTC)
    week_end = datetime.combine(today + timedelta(days=1), time.min, tzinfo=UTC)
    today_start = datetime.combine(today, time.min, tzinfo=UTC)
    tomorrow_start = week_end
    month_start = datetime.combine(today.replace(day=1), time.min, tzinfo=UTC)

    risk_rows = (
        await db.execute(
            select(
                PatientProfile.readmission_risk,
                PatientProfile.readmission_risk_score,
            )
        )
    ).all()
    risk_counts = {"low": 0, "moderate": 0, "high": 0}
    for risk, score in risk_rows:
        risk_counts[_risk_bucket(risk, score)] += 1
    total_patients = len(risk_rows)
    high_risk = risk_counts["high"]

    patients_this_month = int(
        await db.scalar(
            select(func.count(PatientProfile.id)).where(
                PatientProfile.created_at >= month_start
            )
        )
        or 0
    )
    active_doctors = int(
        await db.scalar(
            select(func.count(DoctorProfile.id)).where(
                func.lower(func.coalesce(DoctorProfile.status, "active")) == "active"
            )
        )
        or 0
    )
    onboarding_doctors = int(
        await db.scalar(
            select(func.count(DoctorProfile.id)).where(
                func.lower(func.coalesce(DoctorProfile.status, "")).in_(
                    ["onboarding", "pending"]
                )
            )
        )
        or 0
    )
    followups_today = int(
        await db.scalar(
            select(func.count(Appointment.id)).where(
                Appointment.scheduled_at >= today_start,
                Appointment.scheduled_at < tomorrow_start,
            )
        )
        or 0
    )
    completed_today = int(
        await db.scalar(
            select(func.count(Appointment.id)).where(
                Appointment.scheduled_at >= today_start,
                Appointment.scheduled_at < tomorrow_start,
                Appointment.status == AppointmentStatus.COMPLETED,
            )
        )
        or 0
    )

    patient_day_rows = (
        await db.execute(
            select(
                func.date(PatientProfile.created_at),
                func.count(PatientProfile.id),
            )
            .where(PatientProfile.created_at < week_end)
            .group_by(func.date(PatientProfile.created_at))
        )
    ).all()
    patient_series = _cumulative_series(_daily_counts(patient_day_rows), start_day)

    high_risk_day_rows = (
        await db.execute(
            select(
                func.date(PatientProfile.created_at),
                func.count(PatientProfile.id),
            )
            .where(PatientProfile.created_at < week_end, _high_risk_filter())
            .group_by(func.date(PatientProfile.created_at))
        )
    ).all()
    high_risk_series = _cumulative_series(
        _daily_counts(high_risk_day_rows),
        start_day,
    )

    doctor_day_rows = (
        await db.execute(
            select(
                func.date(DoctorProfile.created_at),
                func.count(DoctorProfile.id),
            )
            .where(DoctorProfile.created_at < week_end)
            .group_by(func.date(DoctorProfile.created_at))
        )
    ).all()
    doctor_series = _cumulative_series(_daily_counts(doctor_day_rows), start_day)

    appointment_day_rows = (
        await db.execute(
            select(
                func.date(Appointment.scheduled_at),
                func.count(Appointment.id),
                func.sum(
                    case(
                        (Appointment.status == AppointmentStatus.COMPLETED, 1),
                        else_=0,
                    )
                ),
            )
            .where(
                Appointment.scheduled_at >= week_start,
                Appointment.scheduled_at < week_end,
            )
            .group_by(func.date(Appointment.scheduled_at))
        )
    ).all()
    appointment_daily: dict[date, tuple[int, int]] = {}
    for day_value, scheduled, completed in appointment_day_rows:
        day = _as_date(day_value)
        if day is not None:
            appointment_daily[day] = (int(scheduled), int(completed or 0))

    follow_up_series: list[FollowUpPoint] = []
    for offset in range(7):
        day = start_day + timedelta(days=offset)
        scheduled, completed = appointment_daily.get(day, (0, 0))
        follow_up_series.append(
            FollowUpPoint(
                label=day.strftime("%a"),
                completed=completed,
                scheduled=scheduled,
            )
        )
    followup_counts = [point.scheduled for point in follow_up_series]
    completion_rate = (
        round(completed_today / followups_today * 100) if followups_today else 0
    )

    metrics = [
        DashboardMetric(
            label="Total patients",
            value=str(total_patients),
            helper=f"{patients_this_month} added this month",
            trend=_trend(patient_series),
            trend_label=_delta_label(patient_series),
            tone="teal",
            sparkline=patient_series,
        ),
        DashboardMetric(
            label="Active doctors",
            value=str(active_doctors),
            helper=(
                f"{onboarding_doctors} onboarding"
                if onboarding_doctors
                else "All active"
            ),
            trend=_trend(doctor_series),
            trend_label=_delta_label(doctor_series),
            tone="emerald",
            sparkline=doctor_series,
        ),
        DashboardMetric(
            label="Follow-ups today",
            value=str(followups_today),
            helper=f"{completed_today} completed",
            trend=_trend(followup_counts),
            trend_label=(
                f"{completion_rate}% completed"
                if followups_today
                else "No visits scheduled"
            ),
            tone="coral",
            sparkline=followup_counts,
        ),
        DashboardMetric(
            label="High-risk patients",
            value=str(high_risk),
            helper=f"{high_risk} of {total_patients} patients",
            trend=_trend(high_risk_series),
            trend_label=_delta_label(high_risk_series),
            tone="amber",
            sparkline=high_risk_series,
        ),
    ]

    if total_patients:
        high_pct = round(high_risk / total_patients * 100)
        moderate_pct = round(risk_counts["moderate"] / total_patients * 100)
        low_pct = max(0, 100 - high_pct - moderate_pct)
    else:
        high_pct = moderate_pct = low_pct = 0
    risk_mix = [
        RiskSlice(label="Low risk", value=low_pct, color="#0f766e"),
        RiskSlice(label="Moderate", value=moderate_pct, color="#f59e0b"),
        RiskSlice(label="High risk", value=high_pct, color="#fb7185"),
    ]

    patient_user = aliased(User)
    doctor_user = aliased(User)
    next_appointment = (
        select(Appointment.scheduled_at)
        .where(
            Appointment.patient_id == PatientProfile.id,
            Appointment.scheduled_at >= now,
        )
        .order_by(Appointment.scheduled_at)
        .limit(1)
        .correlate(PatientProfile)
        .scalar_subquery()
    )
    recent_rows = (
        await db.execute(
            select(
                PatientProfile,
                patient_user,
                doctor_user.name.label("doctor_name"),
                next_appointment.label("next_appointment"),
            )
            .join(patient_user, PatientProfile.user_id == patient_user.id)
            .outerjoin(
                DoctorProfile,
                PatientProfile.primary_doctor_id == DoctorProfile.id,
            )
            .outerjoin(doctor_user, DoctorProfile.user_id == doctor_user.id)
            .order_by(PatientProfile.created_at.desc())
            .limit(5)
        )
    ).all()
    recent_patients: list[DashboardPatient] = []
    for profile, user, doctor_name, next_value in recent_rows:
        risk = _risk_bucket(profile.readmission_risk, profile.readmission_risk_score)
        follow_up_value = next_value or profile.next_follow_up_date
        if _is_overdue(follow_up_value, today):
            status = "overdue"
        elif risk == "high":
            status = "needs_attention"
        else:
            status = "on_track"
        recent_patients.append(
            DashboardPatient(
                id=profile.id,
                name=user.name,
                age=_age(profile.date_of_birth, today),
                condition=profile.primary_condition
                or profile.discharge_diagnosis
                or "Cardiac recovery",
                risk=risk,
                doctor=doctor_name or "Unassigned",
                next_follow_up=_follow_up_label(follow_up_value, today),
                status=status,
            )
        )

    current_appointment_rows = (
        await db.execute(
            select(Appointment.doctor_id).where(
                Appointment.scheduled_at >= now - timedelta(minutes=30),
                Appointment.scheduled_at <= now + timedelta(minutes=30),
                Appointment.status.in_(
                    [AppointmentStatus.CONFIRMED, AppointmentStatus.PENDING]
                ),
            )
        )
    ).all()
    in_consult_ids = {row[0] for row in current_appointment_rows}

    patient_count = (
        select(func.count(func.distinct(PatientProfile.id)))
        .where(
            or_(
                PatientProfile.primary_doctor_id == DoctorProfile.id,
                PatientProfile.attending_doctor_id == DoctorProfile.id,
            )
        )
        .correlate(DoctorProfile)
        .scalar_subquery()
    )
    care_team_rows = (
        await db.execute(
            select(
                DoctorProfile,
                doctor_user,
                patient_count.label("patient_count"),
            )
            .join(doctor_user, DoctorProfile.user_id == doctor_user.id)
            .order_by(DoctorProfile.created_at.desc())
            .limit(4)
        )
    ).all()
    care_team: list[DashboardDoctor] = []
    for profile, user, patient_count_value in care_team_rows:
        care_team.append(
            DashboardDoctor(
                id=profile.id,
                name=_doctor_display_name(profile.title, user.name),
                initials=_initials(user.name),
                specialty=profile.specialty or profile.designation or "Cardiology",
                patients=int(patient_count_value or 0),
                availability=_availability(profile, in_consult_ids, now),
            )
        )

    appointment_rows = (
        await db.execute(
            select(
                Appointment,
                patient_user.name.label("patient_name"),
                doctor_user.name.label("doctor_name"),
                DoctorProfile.title.label("doctor_title"),
            )
            .join(PatientProfile, Appointment.patient_id == PatientProfile.id)
            .join(patient_user, PatientProfile.user_id == patient_user.id)
            .join(DoctorProfile, Appointment.doctor_id == DoctorProfile.id)
            .join(doctor_user, DoctorProfile.user_id == doctor_user.id)
            .where(
                Appointment.scheduled_at >= today_start,
                Appointment.scheduled_at < tomorrow_start,
            )
            .order_by(Appointment.scheduled_at)
            .limit(4)
        )
    ).all()
    appointments = [
        DashboardAppointment(
            id=appointment.id,
            time=appointment.scheduled_at.strftime("%H:%M"),
            patient=patient_name,
            doctor=_doctor_display_name(doctor_title, doctor_name),
            type=appointment.reason or "Follow-up",
            status=appointment.status.value,
        )
        for appointment, patient_name, doctor_name, doctor_title in appointment_rows
    ]

    alerts: list[DashboardAlert] = []
    overdue_filter = (
        PatientProfile.next_follow_up_date < today,
        func.lower(func.coalesce(PatientProfile.status, "active")) == "active",
    )
    overdue_count = int(
        await db.scalar(
            select(func.count(PatientProfile.id)).where(*overdue_filter)
        )
        or 0
    )
    if overdue_count:
        overdue_names = (
            await db.execute(
                select(patient_user.name)
                .join(PatientProfile, PatientProfile.user_id == patient_user.id)
                .where(*overdue_filter)
                .order_by(PatientProfile.next_follow_up_date)
                .limit(2)
            )
        ).scalars().all()
        names = ", ".join(overdue_names)
        if overdue_count > len(overdue_names):
            description = (
                f"{names} and {overdue_count - len(overdue_names)} others need outreach today."
            )
        else:
            description = f"{names} need outreach today."
        alerts.append(
            DashboardAlert(
                id="overdue-follow-ups",
                title=f"{overdue_count} patients overdue for follow-up",
                description=description,
                severity="high",
                href="/admin/patients",
                action_label="Review patients",
            )
        )

    if high_risk:
        alerts.append(
            DashboardAlert(
                id="high-risk-patients",
                title=f"{high_risk} high-risk patients need review",
                description="Risk scores indicate closer monitoring is needed.",
                severity="high",
                href="/admin/patients",
                action_label="Open queue",
            )
        )

    open_queries = int(
        await db.scalar(
            select(func.count(PatientQuery.id)).where(
                PatientQuery.status == QueryStatus.OPEN
            )
        )
        or 0
    )
    if open_queries:
        oldest_query_at = await db.scalar(
            select(func.min(PatientQuery.created_at)).where(
                PatientQuery.status == QueryStatus.OPEN
            )
        )
        wait = _duration(oldest_query_at, now) if oldest_query_at else "a while"
        alerts.append(
            DashboardAlert(
                id="open-queries",
                title=f"{open_queries} unread patient queries",
                description=f"Oldest message has been waiting for {wait}.",
                severity="medium",
                href="/admin/queries",
                action_label="Open queries",
            )
        )

    activity_events: list[tuple[datetime, DashboardActivity]] = []
    patient_activity = (
        await db.execute(
            select(patient_user.name, PatientProfile.created_at, PatientProfile.id)
            .join(patient_user, PatientProfile.user_id == patient_user.id)
            .order_by(PatientProfile.created_at.desc())
            .limit(2)
        )
    ).all()
    for name, created_at, profile_id in patient_activity:
        activity_events.append(
            (
                created_at,
                DashboardActivity(
                    id=f"patient-{profile_id}",
                    title="New patient added",
                    description=f"{name} was added to the recovery program.",
                    time=_relative_time(created_at, now),
                    tone="emerald",
                ),
            )
        )

    doctor_activity = (
        await db.execute(
            select(doctor_user.name, DoctorProfile.created_at, DoctorProfile.id)
            .join(doctor_user, DoctorProfile.user_id == doctor_user.id)
            .order_by(DoctorProfile.created_at.desc())
            .limit(1)
        )
    ).all()
    for name, created_at, profile_id in doctor_activity:
        activity_events.append(
            (
                created_at,
                DashboardActivity(
                    id=f"doctor-{profile_id}",
                    title="Care team updated",
                    description=f"{name} joined the care team.",
                    time=_relative_time(created_at, now),
                    tone="teal",
                ),
            )
        )

    appointment_activity = (
        await db.execute(
            select(
                Appointment,
                patient_user.name.label("patient_name"),
                doctor_user.name.label("doctor_name"),
            )
            .join(PatientProfile, Appointment.patient_id == PatientProfile.id)
            .join(patient_user, PatientProfile.user_id == patient_user.id)
            .join(DoctorProfile, Appointment.doctor_id == DoctorProfile.id)
            .join(doctor_user, DoctorProfile.user_id == doctor_user.id)
            .order_by(Appointment.created_at.desc())
            .limit(2)
        )
    ).all()
    for appointment, patient_name, doctor_name in appointment_activity:
        title = (
            "Follow-up completed"
            if appointment.status == AppointmentStatus.COMPLETED
            else "Appointment scheduled"
        )
        activity_events.append(
            (
                appointment.created_at,
                DashboardActivity(
                    id=f"appointment-{appointment.id}",
                    title=title,
                    description=f"{patient_name} · {doctor_name}",
                    time=_relative_time(appointment.created_at, now),
                    tone="amber",
                ),
            )
        )

    query_activity = (
        await db.execute(
            select(
                PatientQuery,
                patient_user.name.label("patient_name"),
            )
            .join(PatientProfile, PatientQuery.patient_id == PatientProfile.id)
            .join(patient_user, PatientProfile.user_id == patient_user.id)
            .order_by(PatientQuery.created_at.desc())
            .limit(2)
        )
    ).all()
    for query, patient_name in query_activity:
        activity_events.append(
            (
                query.created_at,
                DashboardActivity(
                    id=f"query-{query.id}",
                    title="Patient query received",
                    description=f"{patient_name}: {query.subject}",
                    time=_relative_time(query.created_at, now),
                    tone="coral",
                ),
            )
        )

    activity_events.sort(key=lambda item: item[0], reverse=True)
    activity = [item[1] for item in activity_events[:4]]

    return AdminDashboardRead(
        admin_name=admin.name,
        display_date=now.strftime("%A, %d %B"),
        last_updated="just now",
        generated_at=now,
        metrics=metrics,
        follow_up_series=follow_up_series,
        risk_mix=risk_mix,
        recent_patients=recent_patients,
        care_team=care_team,
        appointments=appointments,
        alerts=alerts,
        activity=activity,
    )
