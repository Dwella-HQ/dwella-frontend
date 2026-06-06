import { isValidPhoneNumber } from "react-phone-number-input";

export function normalizePhoneNumberForApi(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return trimmed.replace(/[^\d+]/g, "").replace(/(?!^)\+/g, "");
}

export function isValidInternationalPhoneNumber(value: string): boolean {
  const normalized = normalizePhoneNumberForApi(value);
  return Boolean(normalized) && isValidPhoneNumber(normalized);
}
