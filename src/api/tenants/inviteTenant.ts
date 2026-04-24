import { apiPost } from "@/lib/apiClient";

export type RentFrequency =
  | "weekly"
  | "biweekly"
  | "monthly"
  | "quarterly"
  | "yearly";
export type ServiceChargeFrequency = RentFrequency | "one_time";

export type IdType = "NATIONAL_ID" | "DRIVER_LICENSE" | "PASSPORT" | "OTHER";

export type TenantInviteRequest = {
  email: string;
  fullName: string;
  phoneNumber: string;
  unitId: string;
  idType: IdType;
  idNumber: string;
  idDocumentId: string; // UUID of uploaded ID document
  isEmployed: boolean;
  employerName: string;
  employerContact: string;
  leaseStartDate: string; // ISO date string
  leaseEndDate?: string;
  rentFrequency: RentFrequency;
  rentAmount: number;
  securityDeposit: number;
  serviceCharge: number;
  serviceChargeFrequency: ServiceChargeFrequency;
  leaseDocumentId?: string; // optional if auto-generating lease
};

type TenantInviteResponse = {
  success?: boolean;
  message?: string;
  data?: unknown;
};

type InviteTenantResult =
  | { success: true; data: unknown }
  | { success: false; error: string };

export const inviteTenant = async (
  data: TenantInviteRequest
): Promise<InviteTenantResult> => {
  const result = await apiPost<TenantInviteResponse>("/tenant/invite", data);

  if (!result.success) {
    return result;
  }

  return { success: true, data: result.data };
};
