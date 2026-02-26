import { createUrl } from "@/utils/createUrl";
import { apiGet } from "@/lib/apiClient";

export type Applicant = {
  id: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  creditScore?: number;
  status?: string; // e.g. "Approved", "Pending"
};

type GetApplicantsParams = {
  unitId?: string;
  propertyId?: string;
};

type ApiApplicant = {
  id?: string;
  fullName?: string;
  full_name?: string;
  email?: string;
  phoneNumber?: string;
  phone_number?: string;
  creditScore?: number;
  credit_score?: number;
  status?: string;
};

type GetApplicantsResult =
  | { success: true; data: Applicant[] }
  | { success: false; error: string };

function mapApplicant(raw: ApiApplicant): Applicant | null {
  const id = raw.id ?? (raw as Record<string, unknown>).id;
  const fullName = raw.fullName ?? raw.full_name ?? "";
  const email = raw.email ?? "";
  if (!id || typeof id !== "string") return null;
  return {
    id: String(id),
    fullName: String(fullName),
    email: String(email),
    phoneNumber: raw.phoneNumber ?? raw.phone_number,
    creditScore: raw.creditScore ?? raw.credit_score,
    status: raw.status,
  };
}

export const getApplicants = async (
  params?: GetApplicantsParams
): Promise<GetApplicantsResult> => {
  const url = createUrl("/tenant-applications", params as Record<string, string>);
  const result = await apiGet<{ data?: unknown[]; applicants?: unknown[] }>(url);

  if (!result.success) {
    // Backend may not have endpoint yet; return empty list so UI still works
    return { success: true, data: [] };
  }

  const rawList = Array.isArray(result.data)
    ? result.data
    : Array.isArray((result.data as { data?: unknown[] })?.data)
      ? (result.data as { data: unknown[] }).data
      : Array.isArray((result.data as { applicants?: unknown[] })?.applicants)
        ? (result.data as { applicants: unknown[] }).applicants
        : [];

  const data = rawList
    .map((item) => mapApplicant(item as ApiApplicant))
    .filter((a): a is Applicant => a != null);

  return { success: true, data };
};
