import type { LandlordDTO } from "./landlord.schema";

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
  return landlord?.isApproved === true;
}
