import { createUrl } from "@/utils/createUrl";
import { apiGet } from "@/lib/apiClient";

/** Tenant record returned by GET /tenant/user/:userId */
export type TenantByUserDTO = {
  id: string;
  idType?: string;
  idNumber?: string;
  isEmployed?: boolean;
  employerName?: string;
  employerContact?: string;
  nextOfKinDetails?: unknown;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    email: string;
    fullName?: string;
    phoneNumber?: string;
    role?: { id: string; name: string };
  };
  leases?: Array<{
    id: string;
    startDate: string;
    endDate: string;
    rentAmount: number;
    rentFrequency: string;
    isActive?: boolean;
  }>;
  currentUnit?: {
    id: string;
    name: string;
    rentAmount?: number;
    numberOfBedrooms?: number;
    numberOfBathrooms?: number;
    amenities?: string[];
  };
};

type TenantByUserResponse = {
  success?: boolean;
  message?: string;
  data?: TenantByUserDTO;
};

type GetTenantByUserResult =
  | { success: true; data: TenantByUserDTO }
  | { success: false; error: string; statusCode?: number };

/**
 * Fetch tenant details by user id (for logged-in tenant).
 * GET /tenant/user/:userId
 */
export const getTenantByUser = async (
  userId: string,
): Promise<GetTenantByUserResult> => {
  const url = createUrl(`/tenant/user/${userId}`);
  const result = await apiGet<TenantByUserResponse>(url);

  if (!result.success) {
    return {
      success: false,
      error: result.error ?? "Failed to fetch tenant",
      statusCode: result.statusCode,
    };
  }

  const data = (result.data as TenantByUserResponse)?.data;
  if (!data?.id) {
    return {
      success: false,
      error: "Invalid tenant response",
    };
  }

  return { success: true, data };
};
