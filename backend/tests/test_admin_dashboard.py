import asyncio
import uuid
from datetime import date, timedelta

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
    name = f"Dashboard Patient {uuid.uuid4().hex[:6]}"
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
                "readmission_risk_score": 12,
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
