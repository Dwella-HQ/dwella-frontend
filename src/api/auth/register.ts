import { apiPost } from "@/lib/apiClient";
import { pickAccessTokenFromRegisterResponse } from "@/utils/invitePostRegisterAuth";

import type { RegisterRequestDTO, RegisterResponseDTO } from "./auth.schema";
import { registerResponseSchema } from "./auth.schema";

const REGISTER_ROUTE = "/auth/register";

type RegisterResult =
  | {
      success: true;
      data: RegisterResponseDTO;
      /** Present for some invite flows when the API returns a session token with register. */
      registerAccessToken: string | null;
    }
  | { success: false; error: string; statusCode?: number };

export const register = async (
  data: RegisterRequestDTO,
): Promise<RegisterResult> => {
  const result = await apiPost<RegisterResponseDTO>(REGISTER_ROUTE, data, {
    skipAuth: true,
  });

  if (!result.success) {
    return {
      success: false,
      error: result.error,
      statusCode: result.statusCode,
    };
  }

  // Validate response with Zod
  try {
    const registerAccessToken = pickAccessTokenFromRegisterResponse(
      result.data,
    );
    const parsed = registerResponseSchema.parse(result.data);
    return { success: true, data: parsed, registerAccessToken };
  } catch (parseError) {
    console.error("Register schema validation error:", parseError);
    console.error("Received data:", JSON.stringify(result.data, null, 2));
    return {
      success: false,
      error: "Invalid response data format received",
    };
  }
};
