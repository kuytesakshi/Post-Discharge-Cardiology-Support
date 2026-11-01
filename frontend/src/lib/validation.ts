const PERSON_NAME_RE = /^[A-Za-z]+(?:[ '\-][A-Za-z]+)*$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_ALLOWED_RE = /^[0-9+()\-.\s]+$/;
const MRN_RE = /^[A-Za-z0-9-]+$/;
const MEDICAL_TEXT_RE = /^[A-Za-z0-9][A-Za-z0-9\s.,'()/\-]*$/;

export const PHONE_MIN_DIGITS = 7;
export const PHONE_MAX_DIGITS = 10;
export const MAX_NAME_LENGTH = 255;
export const MAX_MRN_LENGTH = 64;
export const MAX_NOTES_LENGTH = 5000;

export function normalizeName(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function validateName(
  value: string,
  label = "Full name",
): string | null {
  const normalized = normalizeName(value);
  if (!normalized) {
    return `${label} is required.`;
  }
  if (normalized.length < 2) {
    return `${label} must be at least 2 characters.`;
  }
  if (normalized.length > MAX_NAME_LENGTH) {
    return `${label} must be 255 characters or fewer.`;
  }
  if (!PERSON_NAME_RE.test(normalized)) {
    return `${label} can only contain letters, spaces, apostrophes, and hyphens.`;
  }
  return null;
}

export function validateEmail(value: string): string | null {
  const normalized = value.trim();
  if (!normalized) {
    return "Email address is required.";
  }
  if (normalized.length > 255) {
    return "Email address must be 255 characters or fewer.";
  }
  if (!EMAIL_RE.test(normalized)) {
    return "Enter a valid email address.";
  }
  return null;
}

export function validatePhone(value: string, label = "Phone"): string | null {
  const normalized = value.trim();
  if (!normalized) {
    return null;
  }
  if (normalized.length > 32) {
    return `${label} must be 32 characters or fewer.`;
  }
  if (!PHONE_ALLOWED_RE.test(normalized)) {
    return `${label} can only contain digits, spaces, +, -, parentheses, and periods.`;
  }
  const digits = normalized.replace(/\D/g, "");
  if (digits.length < PHONE_MIN_DIGITS || digits.length > PHONE_MAX_DIGITS) {
    return `${label} must contain between 7 and 10 digits.`;
  }
  return null;
}

export function validateMrn(value: string): string | null {
  const normalized = value.trim();
  if (!normalized) {
    return null;
  }
  if (normalized.length < 2 || normalized.length > MAX_MRN_LENGTH) {
    return "Medical record number must be between 2 and 64 characters.";
  }
  if (!MRN_RE.test(normalized)) {
    return "Medical record number can only contain letters, numbers, and hyphens.";
  }
  return null;
}

export function validateRiskScore(value: string): string | null {
  const normalized = value.trim();
  if (!normalized) {
    return null;
  }
  if (!/^\d+$/.test(normalized)) {
    return "Risk score must be a whole number.";
  }
  const score = Number(normalized);
  if (score < 0 || score > 10) {
    return "Risk score must be between 0 and 10.";
  }
  return null;
}

export function validateLettersOnly(
  value: string,
  label: string,
): string | null {
  const normalized = normalizeName(value);
  if (!normalized) {
    return null;
  }
  if (normalized.length > 128) {
    return `${label} must be 128 characters or fewer.`;
  }
  if (!PERSON_NAME_RE.test(normalized)) {
    return `${label} can only contain letters, spaces, apostrophes, and hyphens.`;
  }
  return null;
}

export function validateMedicalText(
  value: string,
  label: string,
): string | null {
  const normalized = normalizeName(value);
  if (!normalized) {
    return null;
  }
  if (normalized.length > 255) {
    return `${label} must be 255 characters or fewer.`;
  }
  if (!MEDICAL_TEXT_RE.test(normalized)) {
    return `${label} contains invalid characters.`;
  }
  return null;
}

export function validateTextLength(
  value: string,
  label: string,
  maxLength: number,
): string | null {
  if (value.trim().length > maxLength) {
    return `${label} must be ${maxLength} characters or fewer.`;
  }
  return null;
}

export function todayIso(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseIsoDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return null;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

export function calculateAge(
  value: string,
  today = new Date(),
): number | null {
  const dob = parseIsoDate(value);
  if (!dob) {
    return null;
  }
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age -= 1;
  }
  return age;
}

export function validateDateValue(
  value: string,
  label: string,
): string | null {
  if (!value) {
    return null;
  }
  return parseIsoDate(value) ? null : `${label} must be a valid date.`;
}

export function validateDateNotFuture(
  value: string,
  label: string,
): string | null {
  if (!value) {
    return null;
  }
  const date = parseIsoDate(value);
  if (!date) {
    return `${label} must be a valid date.`;
  }
  const today = parseIsoDate(todayIso());
  if (today && date > today) {
    return `${label} cannot be in the future.`;
  }
  return null;
}

export function validateDateOfBirth(value: string): string | null {
  if (!value) {
    return null;
  }
  const date = parseIsoDate(value);
  if (!date) {
    return "Date of birth must be a valid date.";
  }
  const today = parseIsoDate(todayIso());
  if (today && date > today) {
    return "Date of birth cannot be in the future.";
  }
  const age = calculateAge(value);
  if (age !== null && age > 120) {
    return "Date of birth indicates an age over 120.";
  }
  return null;
}

export function validateDateOrder(
  earlier: string,
  later: string,
  message: string,
): string | null {
  if (!earlier || !later) {
    return null;
  }
  const start = parseIsoDate(earlier);
  const end = parseIsoDate(later);
  if (!start || !end) {
    return null;
  }
  return end < start ? message : null;
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}
