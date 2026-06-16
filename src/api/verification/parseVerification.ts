import type { VerificationDTO } from "./verification.schema";
import { verificationSchema } from "./verification.schema";

/** Normalize API payloads that may nest under `data` or return the entity at the root. */
export function parseVerificationDto(raw: unknown): VerificationDTO {
  if (
    raw &&
    typeof raw === "object" &&
    "data" in raw &&
    (raw as { data?: unknown }).data !== undefined &&
    (raw as { data?: unknown }).data !== null
  ) {
    return verificationSchema.parse((raw as { data: unknown }).data);
  }
  return verificationSchema.parse(raw);
}

/** List endpoint may return `{ data: [...] }` or a bare array. */
export function parseVerificationList(raw: unknown): VerificationDTO[] {
  const list = extractVerificationArray(raw);
  if (!list) {
    throw new Error("Expected verification list array or data envelope");
  }
  return list.map((item) => verificationSchema.parse(item));
}

function extractVerificationArray(raw: unknown): unknown[] | null {
  if (Array.isArray(raw)) return raw;
  if (!raw || typeof raw !== "object") return null;

  const record = raw as Record<string, unknown>;
  for (const key of ["data", "items", "results"]) {
    const value = record[key];
    if (Array.isArray(value)) return value;
    const nested = extractVerificationArray(value);
    if (nested) return nested;
  }

  return null;
}
