import { apiPost } from "@/lib/apiClient";
import type { CreateRentRequestDTO, RentItemDTO } from "./rent.schema";
import { createRentResponseSchema } from "./rent.schema";

type CreateRentResult =
  | { success: true; data: RentItemDTO }
  | { success: false; error: string; statusCode?: number };

export const createRent = async (
  payload: CreateRentRequestDTO,
): Promise<CreateRentResult> => {
  const result = await apiPost<unknown>("/rent", payload);
  if (!result.success) return result;

  try {
    const parsed = createRentResponseSchema.parse(result.data);
    if (!parsed.data) {
      return {
        success: false,
        error: "Rent was created but response had no data",
      };
    }
    return { success: true, data: parsed.data };
  } catch (error) {
    console.error("Create rent parse error:", error);
    return { success: false, error: "Invalid response data format received" };
  }
};
