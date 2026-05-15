import type { WithdrawalRecipientDetailsDTO } from "./withdrawal.schema";

function pickString(
  obj: Record<string, unknown>,
  ...keys: string[]
): string | undefined {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.trim().length > 0) return v.trim();
  }
  return undefined;
}

/**
 * Normalizes `POST /withdrawal/resolve-account` bodies (Nest `{ data: ... }`,
 * double-wrapped payloads, snake_case keys, etc.) into `recipientDetails`.
 *
 * Some backends return the holder name as a plain string on `data`, e.g.
 * `{ "success": true, "message": "...", "data": "JANE DOE" }`.
 */
export function parseResolveAccountResponse(
  raw: unknown,
): WithdrawalRecipientDetailsDTO | null {
  if (typeof raw === "string") {
    const t = raw.trim();
    return t ? { accountName: t } : null;
  }

  let cur: unknown = raw;
  for (let depth = 0; depth < 6; depth++) {
    if (cur == null) return null;

    if (typeof cur === "string") {
      const t = cur.trim();
      return t ? { accountName: t } : null;
    }

    if (typeof cur !== "object") return null;
    const o = cur as Record<string, unknown>;

    if (typeof o.data === "string") {
      const name = o.data.trim();
      return name ? { accountName: name } : null;
    }

    if (typeof o.data === "object" && o.data !== null) {
      cur = o.data;
      continue;
    }
    if (typeof o.recipient === "object" && o.recipient !== null) {
      cur = o.recipient;
      continue;
    }
    if (typeof o.recipientDetails === "object" && o.recipientDetails !== null) {
      cur = o.recipientDetails;
      continue;
    }
    if (typeof o.result === "object" && o.result !== null) {
      cur = o.result;
      continue;
    }
    break;
  }

  if (cur == null || typeof cur !== "object") return null;
  const obj = cur as Record<string, unknown>;

  const accountName = pickString(
    obj,
    "accountName",
    "account_name",
    "accountHolderName",
    "account_holder_name",
    "name",
    "fullName",
    "full_name",
  );
  const accountNumber = pickString(
    obj,
    "accountNumber",
    "account_number",
    "nuban",
  );
  const bankCode = pickString(obj, "bankCode", "bank_code");
  const bankName = pickString(obj, "bankName", "bank_name");

  if (!accountName && !accountNumber && !bankCode) return null;

  return {
    accountName,
    accountNumber,
    bankCode,
    bankName,
  };
}
