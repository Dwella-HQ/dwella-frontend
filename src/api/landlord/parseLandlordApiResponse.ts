import type { LandlordDTO } from "./landlord.schema";
import { landlordResponseSchema } from "./landlord.schema";

export type ParseLandlordResult =
  | { success: true; data: LandlordDTO }
  | { success: false; error: string };

/** API often returns phone on `user.phoneNumber` while `businessPhoneNumber` stays null. */
export function resolveLandlordBusinessPhone(
  landlord?: LandlordDTO | null,
): string {
  return (
    landlord?.businessPhoneNumber?.trim() ||
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
    "";
  const landLordName =
    (row.landLordName as string | undefined) ??
    (row.businessName as string | undefined) ??
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

  return {
    success: false,
    error: "Invalid response data format received",
  };
}
