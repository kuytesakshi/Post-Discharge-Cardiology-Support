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


def _create_patient(
    client: TestClient,
    name: str = "Patient Master Test",
    profile: dict | None = None,
) -> dict:
    email = f"pytest-patient-{uuid.uuid4().hex}@example.com"
    response = client.post(
        "/api/v1/admin/patients",
        headers=_admin_headers(client),
        json={
            "name": name,
            "email": email,
            "password": "PatientPass123!",
            "profile": profile
            or {
                "primary_condition": "Heart failure",
                "readmission_risk": "Moderate",
                "readmission_risk_score": 6,
            },
        },
    )
    assert response.status_code == 201, response.text
    body = response.json()
    body["test_email"] = email
    return body


def test_list_patients_returns_pagination_and_summary(client: TestClient) -> None:
    response = client.get(
        "/api/v1/admin/patients?page=1&page_size=2",
        headers=_admin_headers(client),
    )
    assert response.status_code == 200, response.text

    body = response.json()
    assert body["page"] == 1
    assert body["pageSize"] == 2
    assert len(body["items"]) <= 2
    assert body["summary"]["total"] == body["total"]
    assert body["totalPages"] >= 1

    if body["total"] == 0:
        pytest.skip("Demo patients are not seeded")

    item = body["items"][0]
    for field in (
        "id",
        "userId",
        "name",
        "email",
        "risk",
        "status",
        "nextFollowUp",
        "primaryDoctorName",
    ):
        assert field in item


def test_list_patients_search_and_risk_filter(client: TestClient) -> None:
    headers = _admin_headers(client)
    baseline = client.get(
        "/api/v1/admin/patients?page=1&page_size=100",
        headers=headers,
    ).json()
    if baseline["total"] == 0:
        pytest.skip("Demo patients are not seeded")

    target = baseline["items"][0]
    search = client.get(
        "/api/v1/admin/patients",
        headers=headers,
        params={"search": target["email"], "pageSize": 100},
    )
    assert search.status_code == 200, search.text
    search_body = search.json()
    assert search_body["total"] == 1
    assert search_body["items"][0]["id"] == target["id"]

    risk = client.get(
        "/api/v1/admin/patients",
        headers=headers,
        params={"risk": "high", "pageSize": 100},
    )
    assert risk.status_code == 200, risk.text
    risk_body = risk.json()
    assert all(item["risk"] == "high" for item in risk_body["items"])
    assert risk_body["total"] == risk_body["summary"]["highRisk"]


def test_patient_detail_and_update(client: TestClient) -> None:
    headers = _admin_headers(client)
    created = _create_patient(client, "Patient Master Update")
    patient_id = created["profile"]["id"]

    detail = client.get(f"/api/v1/admin/patients/{patient_id}", headers=headers)
    assert detail.status_code == 200, detail.text
    assert detail.json()["user"]["name"] == "Patient Master Update"
    assert detail.json()["risk"] == "moderate"

    updated = client.patch(
        f"/api/v1/admin/patients/{patient_id}",
        headers=headers,
        json={
            "name": "Patient Master Updated",
            "profile": {
                "primary_condition": "Atrial fibrillation",
                "readmission_risk": "High",
                "readmission_risk_score": 10,
                "status": "inactive",
            },
        },
    )
    assert updated.status_code == 200, updated.text
    body = updated.json()
    assert body["user"]["name"] == "Patient Master Updated"
    assert body["profile"]["primary_condition"] == "Atrial fibrillation"
    assert body["profile"]["status"] == "inactive"
    assert body["risk"] == "high"


def test_patient_update_rejects_duplicate_email_and_invalid_doctor(
    client: TestClient,
) -> None:
    headers = _admin_headers(client)
    first = _create_patient(client, "Patient Master First")
    second = _create_patient(client, "Patient Master Second")
    patient_id = first["profile"]["id"]

    duplicate = client.patch(
        f"/api/v1/admin/patients/{patient_id}",
        headers=headers,
        json={"email": second["test_email"]},
    )
    assert duplicate.status_code == 409

    invalid_doctor = client.patch(
        f"/api/v1/admin/patients/{patient_id}",
        headers=headers,
        json={"profile": {"primary_doctor_id": str(uuid.uuid4())}},
    )
    assert invalid_doctor.status_code == 400
    assert "Primary doctor" in invalid_doctor.json()["detail"]


def test_patient_list_supports_status_filter_and_doctor_options(
    client: TestClient,
) -> None:
    headers = _admin_headers(client)
    created = _create_patient(client, "Patient Master Inactive")
    patient_id = created["profile"]["id"]

    updated = client.patch(
        f"/api/v1/admin/patients/{patient_id}",
        headers=headers,
        json={"profile": {"status": "inactive"}},
    )
    assert updated.status_code == 200, updated.text

    inactive = client.get(
        "/api/v1/admin/patients",
        headers=headers,
        params={"status": "inactive", "search": created["test_email"]},
    )
    assert inactive.status_code == 200, inactive.text
    assert inactive.json()["total"] == 1

    options = client.get(
        "/api/v1/admin/doctors/options",
        headers=headers,
    )
    assert options.status_code == 200, options.text
    if options.json():
        assert {"id", "name", "specialty", "status"} <= set(options.json()[0])


def test_patient_create_rejects_invalid_fields(client: TestClient) -> None:
    headers = _admin_headers(client)
    today = date.today()
    cases = [
        {"name": "Patient 123"},
        {"email": "not-an-email"},
        {"profile": {"phone": "123456"}},
        {"profile": {"phone": "12345678901"}},
        {"profile": {"readmission_risk_score": 11}},
        {"profile": {"medical_record_number": "MRN 123"}},
        {
            "profile": {
                "date_of_birth": (today + timedelta(days=1)).isoformat(),
            }
        },
        {
            "profile": {
                "date_of_birth": "1990-01-01",
                "discharge_date": "1989-12-31",
            }
        },
        {
            "profile": {
                "discharge_date": "2025-01-01",
                "next_follow_up_date": "2024-12-31",
            }
        },
        {"profile": {"consent_date": (today + timedelta(days=1)).isoformat()}},
    ]

    for overrides in cases:
        payload = {
            "name": "Patient Validation",
            "email": f"pytest-patient-{uuid.uuid4().hex}@example.com",
            "password": "PatientPass123!",
            "profile": {},
        }
        payload.update(overrides)
        response = client.post(
            "/api/v1/admin/patients",
            headers=headers,
            json=payload,
        )
        assert response.status_code == 422, (overrides, response.text)


def test_patient_create_accepts_names_and_defaults_consent_date(
    client: TestClient,
) -> None:
    mrn = f"PYTEST-MRN-{uuid.uuid4().hex[:8].upper()}"
    response = client.post(
        "/api/v1/admin/patients",
        headers=_admin_headers(client),
        json={
            "name": "Anne-Marie O'Connor",
            "email": f"pytest-patient-{uuid.uuid4().hex}@example.com",
            "password": "PatientPass123!",
            "profile": {
                "medical_record_number": mrn,
                "date_of_birth": "1980-01-01",
                "phone": "+1-555-0100",
                "discharge_date": date.today().isoformat(),
                "next_follow_up_date": (
                    date.today() + timedelta(days=7)
                ).isoformat(),
                "readmission_risk": "High",
                "readmission_risk_score": 10,
                "consent_to_contact": True,
            },
        },
    )
    assert response.status_code == 201, response.text
    body = response.json()
    assert body["user"]["name"] == "Anne-Marie O'Connor"
    assert body["profile"]["medical_record_number"] == mrn
    assert body["profile"]["phone"] == "+1-555-0100"
    assert body["profile"]["readmission_risk_score"] == 10
    assert body["profile"]["consent_date"] == date.today().isoformat()


def test_patient_create_and_update_reject_duplicate_mrn(
    client: TestClient,
) -> None:
    headers = _admin_headers(client)
    first_mrn = f"PYTEST-MRN-{uuid.uuid4().hex[:8].upper()}"
    second_mrn = f"PYTEST-MRN-{uuid.uuid4().hex[:8].upper()}"
    first = _create_patient(
        client,
        "Patient MRN First",
        profile={"medical_record_number": first_mrn},
    )
    _create_patient(
        client,
        "Patient MRN Second",
        profile={"medical_record_number": second_mrn},
    )

    duplicate = client.post(
        "/api/v1/admin/patients",
        headers=headers,
        json={
            "name": "Patient MRN Duplicate",
            "email": f"pytest-patient-{uuid.uuid4().hex}@example.com",
            "password": "PatientPass123!",
            "profile": {"medical_record_number": first_mrn},
        },
    )
    assert duplicate.status_code == 409, duplicate.text
    assert duplicate.json()["detail"] == "Medical record number is already in use"

    duplicate_update = client.patch(
        f"/api/v1/admin/patients/{first['profile']['id']}",
        headers=headers,
        json={"profile": {"medical_record_number": second_mrn}},
    )
    assert duplicate_update.status_code == 409, duplicate_update.text


def test_patient_update_rejects_invalid_name(client: TestClient) -> None:
    created = _create_patient(client, "Patient Master Valid Name")
    response = client.patch(
        f"/api/v1/admin/patients/{created['profile']['id']}",
        headers=_admin_headers(client),
        json={"name": "Patient 123"},
    )
    assert response.status_code == 422, response.text


def test_patient_master_requires_admin(client: TestClient) -> None:
    created = _create_patient(client, "Patient Master Access")
    tokens = _login(client, created["test_email"], "PatientPass123!")

    response = client.get(
        "/api/v1/admin/patients",
        headers={"Authorization": f"Bearer {tokens['access_token']}"},
    )
    assert response.status_code == 403

    unauthenticated = client.get("/api/v1/admin/patients")
    assert unauthenticated.status_code == 401
