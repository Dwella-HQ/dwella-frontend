import { apiPatch } from "@/lib/apiClient";

import type {
  AddressDTO,
  AddressResponseDTO,
  UpdateAddressRequestDTO,
} from "./address.schema";
import { addressResponseSchema } from "./address.schema";

type UpdateAddressResult =
  | { success: true; data: AddressDTO }
  | { success: false; error: string; statusCode?: number };

export const updateAddress = async (
  id: string,
  data: UpdateAddressRequestDTO,
): Promise<UpdateAddressResult> => {
  const { street, ...rest } = data;
  const body = {
    ...rest,
    ...(street ? { address: street, street } : {}),
  };
  const result = await apiPatch<AddressResponseDTO>(
    `/address/${encodeURIComponent(id)}`,
    body,
  );

  if (!result.success) return result;

  try {
    const parsed = addressResponseSchema.parse(result.data);
    const address = parsed.data || (parsed as unknown as AddressDTO);
    return { success: true, data: address };
  } catch (parseError) {
    console.error("Update address schema validation error:", parseError);
    return {
      success: false,
      error: "Invalid response data format received",
    };
  }
};
