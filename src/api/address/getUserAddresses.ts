import { apiGet } from "@/lib/apiClient";

import type { AddressesResponseDTO, AddressDTO } from "./address.schema";
import { addressesResponseSchema } from "./address.schema";

type GetUserAddressesResult = 
  | { success: true; data: AddressDTO[] }
  | { success: false; error: string };

export const getUserAddresses = async (userId: string): Promise<GetUserAddressesResult> => {
  const result = await apiGet<AddressesResponseDTO>(`/address/user/${userId}`);

  if (!result.success) {
    return result;
  }

  // Validate response with Zod
  try {
    const parsed = addressesResponseSchema.parse(result.data);
    // Handle both array response and object with data array
    const addresses = Array.isArray(parsed.data) ? parsed.data : parsed.data || [];
    return { success: true, data: addresses };
  } catch (parseError) {
    console.error("Get user addresses schema validation error:", parseError);
    return {
      success: false,
      error: "Invalid response data format received",
    };
  }
};





