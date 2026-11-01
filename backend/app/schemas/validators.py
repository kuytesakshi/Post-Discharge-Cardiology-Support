import re
from datetime import date

PERSON_NAME_RE = re.compile(r"^[A-Za-z]+(?:[ '\-][A-Za-z]+)*$")
PROVIDER_NAME_RE = re.compile(r"^[A-Za-z]+(?:[ .'\-]+[A-Za-z]+)*\.?$")
PLACE_TEXT_RE = re.compile(r"^[A-Za-z]+(?:[ .'\-]+[A-Za-z]+)*$")
MEDICAL_TEXT_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9\s.,'()/\-]*$")
ADDRESS_TEXT_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9\s.,'#()/\-]*$")
POSTAL_CODE_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9 \-]*$")
PHONE_ALLOWED_RE = re.compile(r"^[0-9+()\-.\s]+$")
MRN_RE = re.compile(r"^[A-Za-z0-9-]+$")


def strip_optional(value: str | None) -> str | None:
    if value is None:
        return None
    stripped = value.strip()
    return stripped or None


def normalize_name(value: str | None) -> str | None:
    if value is None:
        return None
    normalized = " ".join(value.split())
    return normalized or None


def validate_person_name(value: str | None, label: str) -> str | None:
    normalized = normalize_name(value)
    if normalized is None:
        return None
    if len(normalized) < 2:
        raise ValueError(f"{label} must be at least 2 characters")
    if len(normalized) > 255:
        raise ValueError(f"{label} must be 255 characters or fewer")
    if not PERSON_NAME_RE.fullmatch(normalized):
        raise ValueError(
            f"{label} can only contain letters, spaces, apostrophes, and hyphens"
        )
    return normalized


def validate_provider_name(value: str | None, label: str) -> str | None:
    normalized = normalize_name(value)
    if normalized is None:
        return None
    if len(normalized) < 2:
        raise ValueError(f"{label} must be at least 2 characters")
    if len(normalized) > 255:
        raise ValueError(f"{label} must be 255 characters or fewer")
    if not PROVIDER_NAME_RE.fullmatch(normalized):
        raise ValueError(
            f"{label} can only contain letters, spaces, periods, apostrophes, and hyphens"
        )
    return normalized


def validate_place_text(value: str | None, label: str) -> str | None:
    normalized = normalize_name(value)
    if normalized is None:
        return None
    if len(normalized) > 128:
        raise ValueError(f"{label} must be 128 characters or fewer")
    if not PLACE_TEXT_RE.fullmatch(normalized):
        raise ValueError(f"{label} contains invalid characters")
    return normalized


def validate_address_text(value: str | None, label: str) -> str | None:
    normalized = normalize_name(value)
    if normalized is None:
        return None
    if len(normalized) > 255:
        raise ValueError(f"{label} must be 255 characters or fewer")
    if not ADDRESS_TEXT_RE.fullmatch(normalized):
        raise ValueError(f"{label} contains invalid characters")
    return normalized


def validate_medical_text(value: str | None, label: str) -> str | None:
    normalized = normalize_name(value)
    if normalized is None:
        return None
    if len(normalized) > 255:
        raise ValueError(f"{label} must be 255 characters or fewer")
    if not MEDICAL_TEXT_RE.fullmatch(normalized):
        raise ValueError(f"{label} contains invalid characters")
    return normalized


def validate_postal_code(value: str | None) -> str | None:
    normalized = strip_optional(value)
    if normalized is None:
        return None
    if len(normalized) > 20:
        raise ValueError("Postal code must be 20 characters or fewer")
    if not POSTAL_CODE_RE.fullmatch(normalized):
        raise ValueError("Postal code can only contain letters, numbers, spaces, and hyphens")
    return normalized


def validate_phone(value: str | None, label: str) -> str | None:
    normalized = strip_optional(value)
    if normalized is None:
        return None
    if not PHONE_ALLOWED_RE.fullmatch(normalized):
        raise ValueError(
            f"{label} can only contain digits, spaces, +, -, parentheses, and periods"
        )
    digits = re.sub(r"\D", "", normalized)
    if not 7 <= len(digits) <= 10:
        raise ValueError(f"{label} must contain between 7 and 10 digits")
    return normalized


def validate_mrn(value: str | None) -> str | None:
    normalized = strip_optional(value)
    if normalized is None:
        return None
    if len(normalized) < 2 or len(normalized) > 64:
        raise ValueError("Medical record number must be between 2 and 64 characters")
    if not MRN_RE.fullmatch(normalized):
        raise ValueError("Medical record number can only contain letters, numbers, and hyphens")
    return normalized


def validate_text_length(value: str | None, label: str, max_length: int) -> str | None:
    normalized = strip_optional(value)
    if normalized is None:
        return None
    if len(normalized) > max_length:
        raise ValueError(f"{label} must be {max_length} characters or fewer")
    return normalized


def validate_choice(value: str | None, label: str, allowed: set[str]) -> str | None:
    normalized = strip_optional(value)
    if normalized is None:
        return None
    lowered = normalized.lower()
    if lowered not in allowed:
        choices = ", ".join(sorted(allowed))
        raise ValueError(f"{label} must be one of: {choices}")
    return lowered


def calculate_age(value: date, today: date | None = None) -> int:
    current = today or date.today()
    return current.year - value.year - ((current.month, current.day) < (value.month, value.day))


def validate_date_of_birth(value: date | None) -> date | None:
    if value is None:
        return None
    if value > date.today():
        raise ValueError("Date of birth cannot be in the future")
    if calculate_age(value) > 120:
        raise ValueError("Date of birth indicates an age over 120")
    return value


def validate_date_not_future(value: date | None, label: str) -> date | None:
    if value is not None and value > date.today():
        raise ValueError(f"{label} cannot be in the future")
    return value


def validate_patient_date_relationships(
    *,
    date_of_birth: date | None,
    admission_date: date | None,
    discharge_date: date | None,
    procedure_date: date | None,
    next_follow_up_date: date | None,
) -> None:
    if date_of_birth is not None:
        if admission_date is not None and admission_date < date_of_birth:
            raise ValueError("Admission date cannot be before date of birth")
        if discharge_date is not None and discharge_date < date_of_birth:
            raise ValueError("Discharge date cannot be before date of birth")
        if procedure_date is not None and procedure_date < date_of_birth:
            raise ValueError("Procedure date cannot be before date of birth")
    if admission_date is not None and discharge_date is not None:
        if discharge_date < admission_date:
            raise ValueError("Discharge date cannot be before admission date")
    if discharge_date is not None and next_follow_up_date is not None:
        if next_follow_up_date < discharge_date:
            raise ValueError("Next follow-up date cannot be before discharge date")


def resolve_consent_date(
    consent_to_contact: bool,
    consent_date: date | None,
) -> date | None:
    if consent_to_contact and consent_date is None:
        return date.today()
    return consent_date
