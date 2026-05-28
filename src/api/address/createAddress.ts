import { apiPost } from "@/lib/apiClient";

import type { CreateAddressRequestDTO, AddressResponseDTO, AddressDTO } from "./address.schema";
import { addressResponseSchema } from "./address.schema";

type CreateAddressResult = 
  | { success: true; data: AddressDTO }
  | { success: false; error: string };

export const createAddress = async (
  data: CreateAddressRequestDTO
): Promise<CreateAddressResult> => {
  const { userId, street, ...rest } = data;
  const result = await apiPost<AddressResponseDTO>(
    `/address/user/${encodeURIComponent(userId)}`,
    {
      ...rest,
      address: street,
      street,
    },
  );

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
    console.error("Create address schema validation error:", parseError);
    return {
      success: false,
      error: "Invalid response data format received",
    };
  }
};





