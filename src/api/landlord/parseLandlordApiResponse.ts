import type { LandlordDTO } from "./landlord.schema";
import { landlordResponseSchema, landlordSchema } from "./landlord.schema";

export type ParseLandlordResult =
  | { success: true; data: LandlordDTO }
  | { success: false; error: string };

const filledString = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim() ? value.trim() : undefined;

/** API often returns phone on `user.phoneNumber` while `businessPhoneNumber` stays null. */
export function resolveLandlordBusinessPhone(
  landlord?: LandlordDTO | null,
): string {
  return (
    landlord?.businessPhoneNumber?.trim() ||
    landlord?.kyb?.businessPhoneNumber?.trim() ||
    landlord?.phoneNumber?.trim() ||
    landlord?.user?.phoneNumber?.trim() ||
    ""
  );
}

function resolveLandlordBusinessName(landlord?: LandlordDTO | null): string {
  return (
    filledString(landlord?.businessName) ||
    filledString(landlord?.kyb?.businessName) ||
    filledString(landlord?.landLordName) ||
    filledString(landlord?.name) ||
    filledString(landlord?.user?.fullName) ||
    ""
  );
}

function resolveLandlordBusinessEmail(landlord?: LandlordDTO | null): string {
  return (
    filledString(landlord?.businessEmail) ||
    filledString(landlord?.kyb?.businessEmail) ||
    filledString(landlord?.email) ||
    filledString(landlord?.user?.email) ||
    ""
  );
}

function enrichLandlordBusinessFields(landlord: LandlordDTO): LandlordDTO {
  const businessName = resolveLandlordBusinessName(landlord);
  const businessEmail = resolveLandlordBusinessEmail(landlord);
  const businessPhoneNumber = resolveLandlordBusinessPhone(landlord);

  return {
    ...landlord,
    businessName: businessName || landlord.businessName,
    landLordName: filledString(landlord.landLordName) || businessName,
    businessEmail: businessEmail || landlord.businessEmail,
    businessPhoneNumber: businessPhoneNumber || landlord.businessPhoneNumber,
  };
}

function nestedKybString(
  row: Record<string, unknown>,
  key: string,
): string | undefined {
  const kyb = row.kyb;
  if (!kyb || typeof kyb !== "object") return undefined;
  const value = (kyb as Record<string, unknown>)[key];
  return filledString(value);
}

function normalizeLandlordEnvelope(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return raw;
  const envelope = raw as Record<string, unknown>;
  const data = envelope.data;
  if (!data || typeof data !== "object") return raw;

  const row = data as Record<string, unknown>;
  const businessName =
    filledString(row.businessName) ??
    nestedKybString(row, "businessName") ??
    filledString(row.landLordName) ??
    filledString(row.name) ??
    "";
  const landLordName =
    filledString(row.landLordName) ??
    filledString(row.businessName) ??
    nestedKybString(row, "businessName") ??
    filledString(row.name) ??
    "";
  const businessEmail =
    filledString(row.businessEmail) ??
    nestedKybString(row, "businessEmail") ??
    filledString(row.email);
  const businessPhoneNumber =
    filledString(row.businessPhoneNumber) ??
    nestedKybString(row, "businessPhoneNumber") ??
    filledString(row.phoneNumber);

  return {
    ...envelope,
    data: {
      ...row,
      businessName,
      businessEmail,
      businessPhoneNumber,
      landLordName,
    },
  };
}

function normalizeLandlordRecord(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return raw;

  const row = raw as Record<string, unknown>;
  const businessName =
    filledString(row.businessName) ??
    nestedKybString(row, "businessName") ??
    filledString(row.landLordName) ??
    filledString(row.name) ??
    "";
  const landLordName =
    filledString(row.landLordName) ??
    filledString(row.businessName) ??
    nestedKybString(row, "businessName") ??
    filledString(row.name) ??
    "";
  const businessEmail =
    filledString(row.businessEmail) ??
    nestedKybString(row, "businessEmail") ??
    filledString(row.email);
  const businessPhoneNumber =
    filledString(row.businessPhoneNumber) ??
    nestedKybString(row, "businessPhoneNumber") ??
    filledString(row.phoneNumber);

  return {
    ...row,
    businessName,
    businessEmail,
    businessPhoneNumber,
    landLordName,
  };
}

/** Parse GET/PATCH landlord envelopes (`{ data, message, success }`). */
export function parseLandlordApiResponse(raw: unknown): ParseLandlordResult {
  const parsed = landlordResponseSchema.safeParse(raw);
  if (parsed.success) {
    const landlord = enrichLandlordBusinessFields(
      parsed.data.data || (parsed.data as unknown as LandlordDTO),
    );
    return { success: true, data: landlord };
  }

  const reparsed = landlordResponseSchema.safeParse(
    normalizeLandlordEnvelope(raw),
  );
  if (reparsed.success) {
    const landlord = enrichLandlordBusinessFields(
      reparsed.data.data || (reparsed.data as unknown as LandlordDTO),
    );
    return { success: true, data: landlord };
  }

  const direct = landlordSchema.safeParse(raw);
  if (direct.success) {
    return {
      success: true,
      data: enrichLandlordBusinessFields(direct.data),
    };
  }

  const normalizedDirect = landlordSchema.safeParse(
    normalizeLandlordRecord(raw),
  );
  if (normalizedDirect.success) {
    return {
      success: true,
      data: enrichLandlordBusinessFields(normalizedDirect.data),
    };
  }

  console.error(
    "parseLandlordApiResponse: all parse attempts failed:",
    normalizedDirect.error.issues,
  );
  return {
    success: false,
    error: "Invalid response data format received",
  };
}

export function parseLandlordListApiResponse(raw: unknown): ParseLandlordResult[] {
  const list = extractLandlordArray(raw);
  if (!list) {
    return [{ success: false, error: "Invalid response data format received" }];
  }

  return list.map((item) => {
    const direct = parseLandlordApiResponse({ data: item });
    if (direct.success) return direct;
    return parseLandlordApiResponse(item);
  });
}

function extractLandlordArray(raw: unknown): unknown[] | null {
  if (Array.isArray(raw)) return raw;
  if (!raw || typeof raw !== "object") return null;

  const record = raw as Record<string, unknown>;
  for (const key of ["data", "items", "results"]) {
    const value = record[key];
    if (Array.isArray(value)) return value;
    const nested = extractLandlordArray(value);
    if (nested) return nested;
  }

  return null;
}
