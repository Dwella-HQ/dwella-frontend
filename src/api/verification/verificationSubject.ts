import type { VerificationDTO } from "./verification.schema";

/** File attachment shape returned on nested landlord/property payloads */
export type VerificationFileRef = {
  id?: string;
  label?: string | null;
  fileName?: string | null;
  mimeType?: string | null;
  url?: string | null;
};

export type VerificationLandlordNested = {
  id?: string;
  name?: string | null;
  landLordName?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  businessName?: string | null;
  businessEmail?: string | null;
  businessPhoneNumber?: string | null;
  kyb?: {
    businessName?: string | null;
    businessEmail?: string | null;
    businessPhoneNumber?: string | null;
  } | null;
  verificationStatus?: string | null;
  isActive?: boolean;
  isApproved?: boolean;
  user?: {
    fullName?: string | null;
    email?: string | null;
    phoneNumber?: string | null;
  } | null;
  address?: {
    address?: string | null;
    city?: string | null;
    state?: string | null;
    postalCode?: string | null;
    country?: string | null;
  } | null;
  profilePicture?: VerificationFileRef | null;
  /** API spelling */
  govermentIdDocument?: VerificationFileRef | null;
  landSurveyDocument?: VerificationFileRef | null;
  proofOfOwnershipDocument?: VerificationFileRef | null;
  taxIdentificationNumberDocument?: VerificationFileRef | null;
};

export type VerificationPropertyNested = {
  id?: string;
  name?: string | null;
  description?: string | null;
  yearBuilt?: string | null;
  numberOfUnits?: number | null;
  amenities?: string[] | null;
  address?: {
    address?: string | null;
    city?: string | null;
    state?: string | null;
    postalCode?: string | null;
    country?: string | null;
  } | null;
  photos?: VerificationFileRef[] | null;
  documents?: VerificationFileRef[] | null;
};

export type VerificationAdminNested = {
  fullName?: string | null;
  email?: string | null;
  role?: { name?: string | null } | null;
};

export function getLandlordNested(
  v: VerificationDTO,
): VerificationLandlordNested | null {
  const raw = (
    v as VerificationDTO & { landlord?: VerificationLandlordNested | null }
  ).landlord;
  return raw ?? null;
}

export function getPropertyNested(
  v: VerificationDTO,
): VerificationPropertyNested | null {
  const raw = (
    v as VerificationDTO & { property?: VerificationPropertyNested | null }
  ).property;
  return raw ?? null;
}

export function getVerifiedByNested(
  v: VerificationDTO,
): VerificationAdminNested | null {
  const raw = (
    v as VerificationDTO & { verifiedBy?: VerificationAdminNested | null }
  ).verifiedBy;
  return raw ?? null;
}

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function landlordDisplayName(
  land?: VerificationLandlordNested | null,
): string {
  return (
    cleanString(land?.businessName) ||
    cleanString(land?.kyb?.businessName) ||
    cleanString(land?.name) ||
    cleanString(land?.landLordName) ||
    cleanString(land?.user?.fullName) ||
    ""
  );
}

export function landlordDisplayEmail(
  land?: VerificationLandlordNested | null,
): string {
  return (
    cleanString(land?.businessEmail) ||
    cleanString(land?.kyb?.businessEmail) ||
    cleanString(land?.email) ||
    cleanString(land?.user?.email) ||
    ""
  );
}

export function landlordDisplayPhone(
  land?: VerificationLandlordNested | null,
): string {
  return (
    cleanString(land?.businessPhoneNumber) ||
    cleanString(land?.kyb?.businessPhoneNumber) ||
    cleanString(land?.phoneNumber) ||
    cleanString(land?.user?.phoneNumber) ||
    ""
  );
}

/** Primary label for list rows / detail headline */
export function verificationSubjectLabel(v: VerificationDTO): string {
  const prop = getPropertyNested(v);
  const land = getLandlordNested(v);
  if (prop?.name?.trim()) return prop.name.trim();
  const landlordName = landlordDisplayName(land);
  if (landlordName) return landlordName;
  const pid = prop?.id ?? (v as { propertyId?: string }).propertyId;
  const lid = land?.id ?? (v as { landlordId?: string }).landlordId;
  if (pid) return `Property ${pid.slice(0, 8)}…`;
  if (lid) return `Landlord ${lid.slice(0, 8)}…`;
  return v.id.slice(0, 8) + "…";
}

export function entityLandlordId(v: VerificationDTO): string | null {
  return (
    getLandlordNested(v)?.id ??
    (v as { landlordId?: string }).landlordId ??
    null
  );
}

export function entityPropertyId(v: VerificationDTO): string | null {
  return (
    getPropertyNested(v)?.id ??
    (v as { propertyId?: string }).propertyId ??
    null
  );
}

export function formatReason(reason: unknown): string | null {
  if (reason === null || reason === undefined) return null;
  const s = String(reason).trim();
  if (!s || s.toLowerCase() === "string") return null;
  return s;
}
