import asyncio
import random
import string
import uuid
from datetime import UTC, date, datetime, time, timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

from app.core.config import settings

pytestmark = pytest.mark.skipif(
    not settings.SEED_ADMIN or not settings.ADMIN_PASSWORD,
    reason="Admin seed is not configured",
)


@pytest.fixture(autouse=True)
def cleanup_test_users():
    yield
    asyncio.run(_delete_test_users())


async def _delete_test_users() -> None:
    engine = create_async_engine(settings.database_url)
    async with engine.begin() as connection:
        await connection.execute(text("DELETE FROM users WHERE email LIKE 'pytest-%'"))
    await engine.dispose()


async def _insert_follow_up_test_appointments() -> list[uuid.UUID] | None:
    engine = create_async_engine(settings.database_url)
    try:
        async with engine.begin() as connection:
            patient_id = (
                await connection.execute(
                    text("SELECT id FROM patient_profiles ORDER BY created_at LIMIT 1")
                )
            ).scalar_one_or_none()
            doctor_id = (
                await connection.execute(
                    text("SELECT id FROM doctor_profiles ORDER BY created_at LIMIT 1")
                )
            ).scalar_one_or_none()
            if patient_id is None or doctor_id is None:
                return None

            day = datetime.now(UTC).date()
            base = datetime.combine(day, time(23, 0), tzinfo=UTC) + timedelta(
                seconds=uuid.uuid4().int % 3000
            )
            appointments = [
                (
                    uuid.uuid4(),
                    base,
                    "Follow-up",
                ),
                (
                    uuid.uuid4(),
                    base + timedelta(minutes=1),
                    "Medication review",
                ),
            ]
            for appointment_id, scheduled_at, reason in appointments:
                await connection.execute(
                    text(
                        "INSERT INTO appointments "
                        "(id, patient_id, doctor_id, scheduled_at, duration_minutes, "
                        "status, reason, created_at, updated_at) "
                        "VALUES (:id, :patient_id, :doctor_id, :scheduled_at, 30, "
                        "CAST(:status AS appointment_status), :reason, "
                        ":created_at, :updated_at)"
                    ),
                    {
                        "id": appointment_id,
                        "patient_id": patient_id,
                        "doctor_id": doctor_id,
                        "scheduled_at": scheduled_at,
                        "status": "pending",
                        "reason": reason,
                        "created_at": scheduled_at,
                        "updated_at": scheduled_at,
                    },
                )
            return [appointment_id for appointment_id, _, _ in appointments]
    finally:
        await engine.dispose()


async def _delete_appointments(appointment_ids: list[uuid.UUID]) -> None:
    engine = create_async_engine(settings.database_url)
    try:
        async with engine.begin() as connection:
            for appointment_id in appointment_ids:
                await connection.execute(
                    text("DELETE FROM appointments WHERE id = :id"),
                    {"id": appointment_id},
                )
    finally:
        await engine.dispose()


def _metric_value(body: dict, label: str) -> int:
    metric = next(item for item in body["metrics"] if item["label"] == label)
    return int(metric["value"])


def _login(client: TestClient, email: str, password: str) -> dict:
    response = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )
    assert response.status_code == 200, response.text
    return response.json()


def _admin_headers(client: TestClient) -> dict[str, str]:
    tokens = _login(client, settings.ADMIN_EMAIL, settings.ADMIN_PASSWORD)
    return {"Authorization": f"Bearer {tokens['access_token']}"}


def test_dashboard_returns_expected_shape(client: TestClient) -> None:
    response = client.get("/api/v1/admin/dashboard", headers=_admin_headers(client))
    assert response.status_code == 200, response.text

    body = response.json()
    assert body["adminName"]
    assert body["displayDate"]
    assert body["generatedAt"]
    assert len(body["metrics"]) == 4
    assert len(body["followUpSeries"]) == 7
    assert len(body["riskMix"]) == 3
    assert isinstance(body["recentPatients"], list)
    assert isinstance(body["careTeam"], list)
    assert isinstance(body["appointments"], list)
    assert isinstance(body["alerts"], list)
    assert isinstance(body["activity"], list)

    total_patients = int(body["metrics"][0]["value"])
    risk_total = sum(item["value"] for item in body["riskMix"])
    assert risk_total == (100 if total_patients else 0)


def test_dashboard_includes_created_patient_and_derived_alerts(
    client: TestClient,
) -> None:
    email = f"pytest-patient-{uuid.uuid4().hex}@example.com"
    name = f"Dashboard Patient {''.join(random.choices(string.ascii_uppercase, k=6))}"
    overdue_date = (date.today() - timedelta(days=2)).isoformat()

    created = client.post(
        "/api/v1/admin/patients",
        headers=_admin_headers(client),
        json={
            "name": name,
            "email": email,
            "password": "PatientPass123!",
            "profile": {
                "status": "active",
                "primary_condition": "Heart failure",
                "readmission_risk": "High",
                "readmission_risk_score": 10,
                "next_follow_up_date": overdue_date,
            },
        },
    )
    assert created.status_code == 201, created.text

    response = client.get("/api/v1/admin/dashboard", headers=_admin_headers(client))
    assert response.status_code == 200, response.text
    body = response.json()

    patient = next(
        (item for item in body["recentPatients"] if item["name"] == name),
        None,
    )
    assert patient is not None
    assert patient["risk"] == "high"
    assert patient["status"] == "overdue"
    assert "Overdue" in patient["nextFollowUp"]

    alert_ids = {alert["id"] for alert in body["alerts"]}
    assert "overdue-follow-ups" in alert_ids
    assert "high-risk-patients" in alert_ids


def test_dashboard_follow_ups_exclude_other_visit_types(
    client: TestClient,
) -> None:
    headers = _admin_headers(client)
    before = client.get("/api/v1/admin/dashboard", headers=headers)
    assert before.status_code == 200, before.text
    before_body = before.json()

    appointment_ids = asyncio.run(_insert_follow_up_test_appointments())
    if appointment_ids is None:
        pytest.skip("Demo patient/doctor data is not available")

    try:
        after = client.get("/api/v1/admin/dashboard", headers=headers)
        assert after.status_code == 200, after.text
        after_body = after.json()

        assert _metric_value(after_body, "Follow-ups today") == (
            _metric_value(before_body, "Follow-ups today") + 1
        )

        before_today = before_body["followUpSeries"][-1]
        after_today = after_body["followUpSeries"][-1]
        assert after_today["scheduled"] == before_today["scheduled"] + 1
        assert after_today["completed"] == before_today["completed"]
    finally:
        asyncio.run(_delete_appointments(appointment_ids))


def test_dashboard_requires_admin(client: TestClient) -> None:
    email = f"pytest-patient-{uuid.uuid4().hex}@example.com"
    created = client.post(
        "/api/v1/admin/patients",
        headers=_admin_headers(client),
        json={
            "name": "Dashboard Patient",
            "email": email,
            "password": "PatientPass123!",
        },
    )
    assert created.status_code == 201, created.text

    tokens = _login(client, email, "PatientPass123!")
    response = client.get(
        "/api/v1/admin/dashboard",
        headers={"Authorization": f"Bearer {tokens['access_token']}"},
    )
    assert response.status_code == 403


def test_dashboard_requires_authentication(client: TestClient) -> None:
    response = client.get("/api/v1/admin/dashboard")
    assert response.status_code == 401
