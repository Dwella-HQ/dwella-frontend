import type { LandlordVerificationStatus } from "@/api/landlord";
import type { VerificationDTO } from "./verification.schema";
import { queryVerifications } from "./queryVerifications";

type LatestLandlordVerificationStatusResult =
  | { success: true; status: LandlordVerificationStatus | null }
  | { success: false; error: string };

function normalizeVerificationStatus(
  value: unknown,
): LandlordVerificationStatus | null {
  if (typeof value !== "string") return null;
  const status = value.trim().toUpperCase();
  if (status === "VERIFIED" || status === "PENDING" || status === "REJECTED") {
    return status;
  }
  return null;
}

function verificationTimestamp(verification: VerificationDTO): number {
  const raw =
    verification.updatedAt ?? verification.createdAt ?? verification.verifiedAt;
  if (!raw) return 0;
  const time = new Date(raw).getTime();
  return Number.isFinite(time) ? time : 0;
}

export function latestLandlordVerificationStatusFromRows(
  verifications: VerificationDTO[],
): LandlordVerificationStatus | null {
  let latest: { status: LandlordVerificationStatus; timestamp: number } | null =
    null;

  for (const verification of verifications) {
    const status = normalizeVerificationStatus(verification.status);
    if (!status) continue;
    const timestamp = verificationTimestamp(verification);
    if (!latest || timestamp >= latest.timestamp) {
      latest = { status, timestamp };
    }
  }

  return latest?.status ?? null;
}

export async function getLatestLandlordVerificationStatus(
  landlordId: string,
): Promise<LatestLandlordVerificationStatusResult> {
  const result = await queryVerifications({
    landlordId,
    type: "LANDLORD_VERIFICATION",
    limit: 100,
  });

  if (!result.success) {
    return { success: false, error: result.error };
  }

  return {
    success: true,
    status: latestLandlordVerificationStatusFromRows(result.data),
  };
}
