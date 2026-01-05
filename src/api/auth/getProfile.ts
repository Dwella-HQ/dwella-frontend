import { createUrl } from "@/utils/createUrl";

import type { ProfileResponseDTO } from "./auth.schema";
import { profileResponseSchema } from "./auth.schema";

const PROFILE_ROUTE = "/partners/profile";

type ProfileResult = 
  | { success: true; data: ProfileResponseDTO }
  | { success: false; error: string };

export const getProfile = async (token: string): Promise<ProfileResult> => {
  try {
    const url = createUrl(PROFILE_ROUTE);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "ngrok-skip-browser-warning": "true",
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || `Failed to fetch profile: ${response.statusText}`,
      };
    }

    const payload = await response.json();
    
    // Wrap Zod parsing in try-catch to handle schema validation errors
    try {
      // Log the actual account_mode value for debugging
      if (payload?.data?.account_mode) {
        console.log("Received account_mode value:", JSON.stringify(payload.data.account_mode), "Type:", typeof payload.data.account_mode);
      }
      const parsed = profileResponseSchema.parse(payload);
      return { success: true, data: parsed };
    } catch (parseError) {
      // If schema validation fails, log it but don't crash
      console.error("Profile schema validation error:", parseError);
      console.error("Received payload:", JSON.stringify(payload, null, 2));
      return {
        success: false,
        error: "Invalid profile data format received",
      };
    }
  } catch (error) {
    // Handle network errors, fetch failures, etc.
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      return {
        success: false,
        error: "Network error: Unable to connect to server",
      };
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
};

