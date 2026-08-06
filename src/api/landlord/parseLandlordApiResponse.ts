import type { LandlordDTO } from "./landlord.schema";
import { landlordResponseSchema, landlordSchema } from "./landlord.schema";

export type ParseLandlordResult =
  | { success: true; data: LandlordDTO }
  | { success: false; error: string };

/** API often returns phone on `user.phoneNumber` while `businessPhoneNumber` stays null. */
export function resolveLandlordBusinessPhone(
  landlord?: LandlordDTO | null,
): string {
  return (
    landlord?.businessPhoneNumber?.trim() ||
    landlord?.phoneNumber?.trim() ||
    landlord?.user?.phoneNumber?.trim() ||
    ""
  );
}

function enrichLandlordBusinessPhone(landlord: LandlordDTO): LandlordDTO {
  const resolved = resolveLandlordBusinessPhone(landlord);
  if (!resolved || landlord.businessPhoneNumber?.trim()) {
    return landlord;
  }
  return { ...landlord, businessPhoneNumber: resolved };
}

function normalizeLandlordEnvelope(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return raw;
  const envelope = raw as Record<string, unknown>;
  const data = envelope.data;
  if (!data || typeof data !== "object") return raw;

  const row = data as Record<string, unknown>;
  const businessName =
    (row.businessName as string | undefined) ??
    (row.landLordName as string | undefined) ??
    (row.name as string | undefined) ??
    "";
  const landLordName =
    (row.landLordName as string | undefined) ??
    (row.businessName as string | undefined) ??
    (row.name as string | undefined) ??
    "";

  return {
    ...envelope,
    data: {
      ...row,
      businessName,
      landLordName,
    },
  };
}

function normalizeLandlordRecord(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return raw;

  const row = raw as Record<string, unknown>;
  const businessName =
    (row.businessName as string | undefined) ??
    (row.landLordName as string | undefined) ??
    (row.name as string | undefined) ??
    "";
  const landLordName =
    (row.landLordName as string | undefined) ??
    (row.businessName as string | undefined) ??
    (row.name as string | undefined) ??
    "";

  return {
    ...row,
    businessName,
    landLordName,
  };
}

/** Parse GET/PATCH landlord envelopes (`{ data, message, success }`). */
export function parseLandlordApiResponse(raw: unknown): ParseLandlordResult {
  const parsed = landlordResponseSchema.safeParse(raw);
  if (parsed.success) {
    const landlord = enrichLandlordBusinessPhone(
      parsed.data.data || (parsed.data as unknown as LandlordDTO),
    );
    return { success: true, data: landlord };
  }

  const reparsed = landlordResponseSchema.safeParse(
    normalizeLandlordEnvelope(raw),
  );
  if (reparsed.success) {
    const landlord = enrichLandlordBusinessPhone(
      reparsed.data.data || (reparsed.data as unknown as LandlordDTO),
    );
    return { success: true, data: landlord };
  }

  const direct = landlordSchema.safeParse(raw);
  if (direct.success) {
    return {
      success: true,
      data: enrichLandlordBusinessPhone(direct.data),
    };
  }

  const normalizedDirect = landlordSchema.safeParse(
    normalizeLandlordRecord(raw),
  );
  if (normalizedDirect.success) {
    return {
      success: true,
      data: enrichLandlordBusinessPhone(normalizedDirect.data),
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
