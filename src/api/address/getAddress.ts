import { apiGet } from "@/lib/apiClient";

import type { AddressResponseDTO, AddressDTO } from "./address.schema";
import { addressResponseSchema } from "./address.schema";

type GetAddressResult = 
  | { success: true; data: AddressDTO }
  | { success: false; error: string };

export const getAddress = async (id: string): Promise<GetAddressResult> => {
  const result = await apiGet<AddressResponseDTO>(`/address/${id}`);

  if (!result.success) {
    return result;
  }

  // Validate response with Zod
  try {
    const parsed = addressResponseSchema.parse(result.data);
    // Handle both direct address object and object with data property
    const address = parsed.data || (parsed as unknown as AddressDTO);
    return { success: true, data: address };
  } catch (parseError) {
    console.error("Get address schema validation error:", parseError);
    return {
      success: false,
      error: "Invalid response data format received",
    };
  }
};





