import type { LandlordDTO } from "./landlord.schema";

export type LandlordVerificationStatus = "PENDING" | "VERIFIED" | "REJECTED";

function hasDocumentRef(value: unknown): boolean {
  if (typeof value === "string") return value.trim().length > 0;
  if (!value || typeof value !== "object") return false;

  const doc = value as { id?: unknown; url?: unknown; fileName?: unknown };
  return [doc.id, doc.url, doc.fileName].some(
    (item) => typeof item === "string" && item.trim().length > 0,
  );
}

export function hasRequiredLandlordVerificationDocuments(
  landlord?: LandlordDTO | null,
): boolean {
  if (!landlord) return false;

  return (
    (hasDocumentRef(landlord.govermentIdDocumentId) ||
      hasDocumentRef(landlord.govermentIdDocument) ||
      hasDocumentRef(landlord.governmentIdDocument)) &&
    (hasDocumentRef(landlord.landSurveyDocumentId) ||
      hasDocumentRef(landlord.landSurveyDocument)) &&
    (hasDocumentRef(landlord.proofOfOwnershipDocumentId) ||
      hasDocumentRef(landlord.proofOfOwnershipDocument)) &&
    (hasDocumentRef(landlord.taxIdentificationNumberDocumentId) ||
      hasDocumentRef(landlord.taxIdentificationNumberDocument))
  );
}

export function isApprovedLandlordVerificationComplete(
  landlord?: LandlordDTO | null,
): boolean {
  const status = getLandlordVerificationStatus(landlord);
  if (status) return status === "VERIFIED";

  return landlord?.isApproved === true;
}

export function getLandlordVerificationStatus(
  landlord?: LandlordDTO | null,
): LandlordVerificationStatus | null {
  if (!landlord) return null;

  const direct = normalizeVerificationStatus(landlord.verificationStatus);
  if (direct) return direct;

  const legacyApproval = normalizeApprovalStatus(landlord.approvalStatus);
  if (legacyApproval) return legacyApproval;

  if (landlord.isApproved === true) return "VERIFIED";
  if (landlord.isApproved === false) return "PENDING";

  return null;
}

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

function normalizeApprovalStatus(
  value: unknown,
): LandlordVerificationStatus | null {
  if (typeof value !== "string") return null;
  const status = value.trim().toUpperCase();
  if (status === "APPROVED" || status === "VERIFIED") return "VERIFIED";
  if (status === "REJECTED") return "REJECTED";
  if (status === "PENDING") return "PENDING";
  return null;
}
