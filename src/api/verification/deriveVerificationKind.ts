import { getLandlordNested, getPropertyNested } from "./verificationSubject";
import type { VerificationDTO } from "./verification.schema";

/**
 * Chooses which PATCH path to use.
 * API sends `LANDLORD_VERIFICATION` | `PROPERTY_VERIFICATION` and nested landlord/property objects.
 */
export function deriveVerificationKind(
  v: VerificationDTO,
): "landlord" | "property" {
  const t = (v.type ?? "").toString().toUpperCase();
  if (t.includes("PROPERTY")) return "property";
  if (t.includes("LANDLORD")) return "landlord";

  const property = getPropertyNested(v);
  const landlord = getLandlordNested(v);
  if (property && !landlord) return "property";
  if (landlord && !property) return "landlord";

  const rec = v as VerificationDTO & {
    propertyId?: string | null;
    landlordId?: string | null;
  };
  if (rec.propertyId && !rec.landlordId) return "property";
  if (rec.landlordId && !rec.propertyId) return "landlord";
  if (rec.propertyId) return "property";
  return "landlord";
}
