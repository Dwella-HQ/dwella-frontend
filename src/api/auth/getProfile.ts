import { apiGet } from "@/lib/apiClient";

import type { ProfileResponseDTO } from "./auth.schema";
import { profileResponseSchema } from "./auth.schema";

const PROFILE_ROUTE = "/user/me";

type ProfileResult = 
  | { success: true; data: ProfileResponseDTO }
  | { success: false; error: string };

export const getProfile = async (token?: string): Promise<ProfileResult> => {
  const result = await apiGet<ProfileResponseDTO>(PROFILE_ROUTE, {
    token,
  });

  if (!result.success) {
    return result;
  }

  // Validate response with Zod
  try {
    // Log the actual account_mode value for debugging
    if (result.data?.data?.account_mode) {
      console.log(
        "Received account_mode value:",
        JSON.stringify(result.data.data.account_mode),
        "Type:",
        typeof result.data.data.account_mode
      );
    }
    const parsed = profileResponseSchema.parse(result.data);
    return { success: true, data: parsed };
  } catch (parseError) {
    // If schema validation fails, log it but don't crash
    console.error("Profile schema validation error:", parseError);
    console.error("Received payload:", JSON.stringify(result.data, null, 2));
    return {
      success: false,
      error: "Invalid profile data format received",
    };
  }
};

