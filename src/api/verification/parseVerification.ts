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
  if (Array.isArray(raw)) {
    return raw.map((item) => verificationSchema.parse(item));
  }
  if (raw && typeof raw === "object" && "data" in raw) {
    const inner = (raw as { data: unknown }).data;
    if (Array.isArray(inner)) {
      return inner.map((item) => verificationSchema.parse(item));
    }
  }
  throw new Error("Expected verification list array or { data: array }");
}
