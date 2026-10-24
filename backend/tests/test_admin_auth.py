import asyncio
import uuid

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


def test_admin_creates_patient_and_patient_logs_in(client: TestClient) -> None:
    email = f"pytest-patient-{uuid.uuid4().hex}@example.com"
    response = client.post(
        "/api/v1/admin/patients",
        headers=_admin_headers(client),
        json={
            "name": "Test Patient",
            "email": email,
            "password": "PatientPass123!",
            "profile": {
                "date_of_birth": "1970-05-10",
                "gender": "female",
                "phone": "+1-555-0100",
                "discharge_date": "2026-10-20",
                "primary_condition": "Heart failure",
                "medications": ["Aspirin", "Beta blocker"],
                "emergency_contact_name": "John Doe",
                "emergency_contact_phone": "+1-555-0101",
            },
        },
    )
    assert response.status_code == 201, response.text
    body = response.json()
    assert body["user"]["role"]["name"] == "patient"
    assert body["profile"]["primary_condition"] == "Heart failure"

    tokens = _login(client, email, "PatientPass123!")
    me = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {tokens['access_token']}"},
    )
    assert me.status_code == 200
    assert me.json()["role"]["name"] == "patient"


def test_admin_creates_doctor_and_doctor_logs_in(client: TestClient) -> None:
    email = f"pytest-doctor-{uuid.uuid4().hex}@example.com"
    response = client.post(
        "/api/v1/admin/doctors",
        headers=_admin_headers(client),
        json={
            "name": "Test Doctor",
            "email": email,
            "password": "DoctorPass123!",
            "profile": {
                "specialty": "Cardiology",
                "license_number": f"DOC-{uuid.uuid4().hex[:8]}",
                "hospital": "City Hospital",
                "years_of_experience": 12,
                "bio": "Interventional cardiologist",
            },
        },
    )
    assert response.status_code == 201, response.text
    body = response.json()
    assert body["user"]["role"]["name"] == "doctor"
    assert body["profile"]["specialty"] == "Cardiology"

    tokens = _login(client, email, "DoctorPass123!")
    me = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {tokens['access_token']}"},
    )
    assert me.status_code == 200
    assert me.json()["role"]["name"] == "doctor"


def test_public_registration_is_disabled(client: TestClient) -> None:
    response = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Self Registered",
            "email": f"pytest-self-{uuid.uuid4().hex}@example.com",
            "password": "SelfPass123!",
        },
    )
    assert response.status_code == 404


def test_patient_cannot_use_admin_endpoints(client: TestClient) -> None:
    email = f"pytest-patient-{uuid.uuid4().hex}@example.com"
    created = client.post(
        "/api/v1/admin/patients",
        headers=_admin_headers(client),
        json={
            "name": "Test Patient",
            "email": email,
            "password": "PatientPass123!",
        },
    )
    assert created.status_code == 201, created.text

    tokens = _login(client, email, "PatientPass123!")
    response = client.post(
        "/api/v1/admin/doctors",
        headers={"Authorization": f"Bearer {tokens['access_token']}"},
        json={
            "name": "Test Doctor",
            "email": f"pytest-doctor-{uuid.uuid4().hex}@example.com",
            "password": "DoctorPass123!",
        },
    )
    assert response.status_code == 403


def test_login_rejects_wrong_password(client: TestClient) -> None:
    response = client.post(
        "/api/v1/auth/login",
        json={"email": settings.ADMIN_EMAIL, "password": "wrong-password"},
    )
    assert response.status_code == 401
