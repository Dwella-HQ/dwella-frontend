import { apiPost } from "@/lib/apiClient";

import type { RegisterRequestDTO, RegisterResponseDTO } from "./auth.schema";
import { registerResponseSchema } from "./auth.schema";

const REGISTER_ROUTE = "/auth/register";

type RegisterResult = 
  | { success: true; data: RegisterResponseDTO }
  | { success: false; error: string };

export const register = async (data: RegisterRequestDTO): Promise<RegisterResult> => {
  const result = await apiPost<RegisterResponseDTO>(REGISTER_ROUTE, data, {
    skipAuth: true,
  });

  if (!result.success) {
    return result;
  }

  // Validate response with Zod
  try {
    const parsed = registerResponseSchema.parse(result.data);
    // Note: Registration doesn't return accessToken - user needs to verify email first
    // We just return success and redirect to email verification page
    return { success: true, data: parsed };
  } catch (parseError) {
    console.error("Register schema validation error:", parseError);
    console.error("Received data:", JSON.stringify(result.data, null, 2));
    return {
      success: false,
      error: "Invalid response data format received",
    };
  }
};

