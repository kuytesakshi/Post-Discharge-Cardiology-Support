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
    mrn = f"MRN-{uuid.uuid4().hex[:10].upper()}"
    response = client.post(
        "/api/v1/admin/patients",
        headers=_admin_headers(client),
        json={
            "name": "Test Patient",
            "email": email,
            "password": "PatientPass123!",
            "profile": {
                "medical_record_number": mrn,
                "status": "discharged",
                "date_of_birth": "1970-05-10",
                "gender": "female",
                "phone": "+1-555-0100",
                "alternate_phone": "+1-555-0101",
                "preferred_language": "English",
                "preferred_contact_method": "phone",
                "address_line1": "123 Heart St",
                "city": "Boston",
                "state": "MA",
                "postal_code": "02118",
                "country": "USA",
                "emergency_contact_name": "John Doe",
                "emergency_contact_phone": "+1-555-0102",
                "emergency_contact_relationship": "Spouse",
                "caregiver_name": "John Doe",
                "caregiver_phone": "+1-555-0102",
                "caregiver_relationship": "Spouse",
                "admission_date": "2026-10-10",
                "discharge_date": "2026-10-20",
                "discharge_disposition": "Home",
                "hospital_name": "City Hospital",
                "discharging_physician_name": "Dr. Smith",
                "primary_care_physician_name": "Dr. Primary",
                "primary_care_physician_phone": "+1-555-0300",
                "primary_condition": "Heart failure",
                "discharge_diagnosis": "Acute decompensated heart failure",
                "secondary_diagnoses": ["Hypertension", "Type 2 diabetes"],
                "comorbidities": ["CKD stage 3", "Atrial fibrillation"],
                "allergies": ["Penicillin"],
                "procedure_name": "Coronary angioplasty",
                "procedure_date": "2026-10-12",
                "lvef": 35.5,
                "nyha_class": "III",
                "heart_failure_type": "HFrEF",
                "cardiac_device": "ICD",
                "device_details": "Single-chamber ICD",
                "anticoagulation_required": True,
                "target_inr": 2.5,
                "height_cm": 175.5,
                "weight_kg": 82.3,
                "bmi": 26.7,
                "baseline_weight_kg": 80.0,
                "target_weight_kg": 79.0,
                "discharge_systolic_bp": 118,
                "discharge_diastolic_bp": 72,
                "discharge_heart_rate": 68,
                "discharge_respiratory_rate": 16,
                "discharge_spo2": 97,
                "discharge_temperature_c": 36.8,
                "discharge_sodium": 138,
                "discharge_potassium": 4.1,
                "discharge_creatinine": 1.3,
                "discharge_egfr": 55,
                "discharge_hemoglobin": 12.5,
                "discharge_hba1c": 7.2,
                "discharge_bnp": 450,
                "discharge_nt_probnp": 3200,
                "discharge_inr": 2.4,
                "smoking_status": "Former",
                "alcohol_use": "Occasional",
                "physical_activity_level": "Light",
                "lives_alone": False,
                "transportation_access": True,
                "code_status": "Full code",
                "medications": [
                    {
                        "name": "Furosemide",
                        "dose": "40 mg",
                        "frequency": "Once daily",
                        "route": "Oral",
                        "start_date": "2026-10-20",
                        "end_date": None,
                        "instructions": "Take in the morning",
                    },
                    {
                        "name": "Carvedilol",
                        "dose": "6.25 mg",
                        "frequency": "Twice daily",
                        "route": "Oral",
                        "start_date": "2026-10-20",
                        "end_date": None,
                        "instructions": "Take with food",
                    },
                ],
                "symptoms_to_watch": ["Shortness of breath", "Weight gain", "Swelling"],
                "red_flags": ["Chest pain", "Fainting", "Severe shortness of breath"],
                "activity_restrictions": "No heavy lifting for 2 weeks",
                "diet_instructions": "Low sodium diet",
                "home_monitoring_instructions": "Daily weight and BP",
                "follow_up_plan": "Cardiology follow-up in 1 week",
                "next_follow_up_date": "2026-10-27",
                "readmission_risk": "High",
                "readmission_risk_score": 12,
                "clinical_notes": "Patient stable at discharge",
                "consent_to_contact": True,
                "consent_date": "2026-10-20",
                "last_contacted_at": "2026-10-21T10:00:00Z",
                "onboarding_completed_at": "2026-10-21T10:30:00Z",
            },
        },
    )
    assert response.status_code == 201, response.text
    body = response.json()
    assert body["user"]["role"]["name"] == "patient"
    assert body["profile"]["medical_record_number"] == mrn
    assert body["profile"]["status"] == "discharged"
    assert body["profile"]["primary_condition"] == "Heart failure"
    assert float(body["profile"]["lvef"]) == 35.5
    assert body["profile"]["nyha_class"] == "III"
    assert body["profile"]["comorbidities"] == ["CKD stage 3", "Atrial fibrillation"]
    assert body["profile"]["medications"][0]["name"] == "Furosemide"
    assert body["profile"]["medications"][0]["start_date"] == "2026-10-20"
    assert body["profile"]["consent_to_contact"] is True
    assert body["profile"]["created_by_id"] is not None

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
                "title": "Dr.",
                "designation": "Consultant Cardiologist",
                "specialty": "Cardiology",
                "subspecialty": "Heart Failure",
                "department": "Cardiology",
                "gender": "female",
                "phone": "+1-555-0400",
                "alternate_phone": "+1-555-0401",
                "office_phone": "+1-555-0402",
                "office_extension": "123",
                "fax": "+1-555-0403",
                "office_address_line1": "456 Clinic Ave",
                "office_address_line2": "Suite 200",
                "city": "Boston",
                "state": "MA",
                "postal_code": "02118",
                "country": "USA",
                "hospital": "City Hospital",
                "clinic_name": "Heart Care Clinic",
                "license_number": f"DOC-{uuid.uuid4().hex[:8]}",
                "license_state": "MA",
                "license_expiry_date": "2030-12-31",
                "npi_number": f"NPI-{uuid.uuid4().hex[:12]}",
                "years_of_experience": 12,
                "patients_attended_count": 1500,
                "medical_school": "Harvard Medical School",
                "residency": "Massachusetts General Hospital",
                "fellowship": "Brigham and Women's Hospital",
                "board_certifications": ["ABIM Cardiovascular Disease"],
                "professional_memberships": ["ACC", "AHA"],
                "languages": ["English", "Spanish"],
                "clinical_interests": ["Heart failure", "Cardiac rehabilitation"],
                "conditions_treated": ["Heart failure", "Atrial fibrillation"],
                "procedures_performed": ["Echocardiography", "Cardiac catheterization"],
                "consultation_modes": ["In-person", "Video"],
                "telehealth_enabled": True,
                "accepting_new_patients": True,
                "consultation_fee": 250.0,
                "availability_notes": "Monday to Friday",
                "office_hours": [
                    {
                        "day": "Monday",
                        "start_time": "09:00",
                        "end_time": "17:00",
                        "is_closed": False,
                    },
                    {
                        "day": "Tuesday",
                        "start_time": None,
                        "end_time": None,
                        "is_closed": True,
                    },
                ],
                "status": "active",
                "bio": "Interventional cardiologist",
            },
        },
    )
    assert response.status_code == 201, response.text
    body = response.json()
    assert body["user"]["role"]["name"] == "doctor"
    assert body["profile"]["specialty"] == "Cardiology"
    assert body["profile"]["title"] == "Dr."
    assert body["profile"]["subspecialty"] == "Heart Failure"
    assert body["profile"]["patients_attended_count"] == 1500
    assert body["profile"]["board_certifications"] == ["ABIM Cardiovascular Disease"]
    assert body["profile"]["office_hours"][0]["day"] == "Monday"
    assert body["profile"]["office_hours"][0]["start_time"] == "09:00"
    assert body["profile"]["telehealth_enabled"] is True
    assert body["profile"]["created_by_id"] is not None

    tokens = _login(client, email, "DoctorPass123!")
    me = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {tokens['access_token']}"},
    )
    assert me.status_code == 200
    assert me.json()["role"]["name"] == "doctor"


def test_admin_assigns_attending_doctor_to_patient(client: TestClient) -> None:
    doctor_email = f"pytest-doctor-{uuid.uuid4().hex}@example.com"
    doctor = client.post(
        "/api/v1/admin/doctors",
        headers=_admin_headers(client),
        json={
            "name": "Attending Doctor",
            "email": doctor_email,
            "password": "DoctorPass123!",
            "profile": {
                "specialty": "Cardiology",
                "license_number": f"DOC-{uuid.uuid4().hex[:8]}",
            },
        },
    )
    assert doctor.status_code == 201, doctor.text
    doctor_profile_id = doctor.json()["profile"]["id"]

    patient = client.post(
        "/api/v1/admin/patients",
        headers=_admin_headers(client),
        json={
            "name": "Attending Patient",
            "email": f"pytest-patient-{uuid.uuid4().hex}@example.com",
            "password": "PatientPass123!",
            "profile": {
                "primary_doctor_id": doctor_profile_id,
                "attending_doctor_id": doctor_profile_id,
            },
        },
    )
    assert patient.status_code == 201, patient.text
    assert patient.json()["profile"]["primary_doctor_id"] == doctor_profile_id
    assert patient.json()["profile"]["attending_doctor_id"] == doctor_profile_id

    auto_assigned = client.post(
        "/api/v1/admin/patients",
        headers=_admin_headers(client),
        json={
            "name": "Auto Attending Patient",
            "email": f"pytest-patient-{uuid.uuid4().hex}@example.com",
            "password": "PatientPass123!",
            "profile": {"primary_doctor_id": doctor_profile_id},
        },
    )
    assert auto_assigned.status_code == 201, auto_assigned.text
    assert auto_assigned.json()["profile"]["attending_doctor_id"] == doctor_profile_id

    invalid = client.post(
        "/api/v1/admin/patients",
        headers=_admin_headers(client),
        json={
            "name": "Invalid Doctor Patient",
            "email": f"pytest-patient-{uuid.uuid4().hex}@example.com",
            "password": "PatientPass123!",
            "profile": {"attending_doctor_id": str(uuid.uuid4())},
        },
    )
    assert invalid.status_code == 400
    assert "Attending doctor" in invalid.json()["detail"]


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
