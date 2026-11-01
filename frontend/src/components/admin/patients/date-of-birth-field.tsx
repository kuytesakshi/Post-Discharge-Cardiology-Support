"use client";

import { useState } from "react";

import { Select } from "@/components/ui/select";
import { calculateAge, daysInMonth } from "@/lib/validation";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const MAX_AGE = 120;

type DateParts = {
  year: string;
  month: string;
  day: string;
};

type DateOfBirthFieldProps = {
  value: string;
  onChange: (value: string) => void;
  error?: string;
};

function splitIso(value: string): DateParts {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return { year: "", month: "", day: "" };
  }
  return { year: match[1], month: match[2], day: match[3] };
}

function buildIso(parts: DateParts): string {
  if (!parts.year || !parts.month || !parts.day) {
    return "";
  }
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function DateOfBirthField({
  value,
  onChange,
  error,
}: DateOfBirthFieldProps) {
  const [parts, setParts] = useState<DateParts>(() => splitIso(value));
  const currentYear = new Date().getFullYear();
  const years = Array.from(
    { length: MAX_AGE + 1 },
    (_, index) => currentYear - index,
  );
  const maxDay =
    parts.year && parts.month
      ? daysInMonth(Number(parts.year), Number(parts.month))
      : 31;
  const days = Array.from({ length: maxDay }, (_, index) => index + 1);
  const age = calculateAge(value);
  const invalidClass = error
    ? "border-rose-300 focus:border-rose-500 focus:ring-rose-100"
    : undefined;

  function updatePart(key: keyof DateParts, nextValue: string) {
    const next = { ...parts, [key]: nextValue };
    if (next.month && next.year) {
      const nextMaxDay = daysInMonth(
        Number(next.year),
        Number(next.month),
      );
      if (next.day && Number(next.day) > nextMaxDay) {
        next.day = String(nextMaxDay).padStart(2, "0");
      }
    }
    setParts(next);
    onChange(buildIso(next));
  }

  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-[1.4fr_0.8fr_1fr] gap-2">
        <Select
          aria-label="Birth month"
          aria-invalid={Boolean(error)}
          value={parts.month}
          onChange={(event) => updatePart("month", event.target.value)}
          className={invalidClass}
        >
          <option value="">Month</option>
          {MONTHS.map((month, index) => (
            <option key={month} value={String(index + 1).padStart(2, "0")}>
              {month}
            </option>
          ))}
        </Select>
        <Select
          aria-label="Birth day"
          aria-invalid={Boolean(error)}
          value={parts.day}
          onChange={(event) => updatePart("day", event.target.value)}
          className={invalidClass}
        >
          <option value="">Day</option>
          {days.map((day) => (
            <option key={day} value={String(day).padStart(2, "0")}>
              {day}
            </option>
          ))}
        </Select>
        <Select
          aria-label="Birth year"
          aria-invalid={Boolean(error)}
          value={parts.year}
          onChange={(event) => updatePart("year", event.target.value)}
          className={invalidClass}
        >
          <option value="">Year</option>
          {years.map((year) => (
            <option key={year} value={String(year)}>
              {year}
            </option>
          ))}
        </Select>
      </div>
      {age !== null && !error ? (
        <span className="block text-xs text-slate-500">Age: {age} years</span>
      ) : null}
    </div>
  );
}
