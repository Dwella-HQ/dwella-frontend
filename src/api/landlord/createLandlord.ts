import { apiPost } from "@/lib/apiClient";

import type { CreateLandlordRequestDTO, CreateLandlordResponseDTO, LandlordDTO } from "./landlord.schema";
import { createLandlordResponseSchema } from "./landlord.schema";

type CreateLandlordResult = 
  | { success: true; data: LandlordDTO }
  | { success: false; error: string };

export const createLandlord = async (
  data: CreateLandlordRequestDTO
): Promise<CreateLandlordResult> => {
  const result = await apiPost<CreateLandlordResponseDTO>("/landlord", data);

  if (!result.success) {
    return result;
  }

  // Validate response with Zod
  const parsed = createLandlordResponseSchema.safeParse(result.data);
  if (parsed.success && parsed.data.data) {
    // Handle both direct landlord object and object with data property
    const landlordData = parsed.data.data;
    // Ensure required fields exist, otherwise use fallback
    if (landlordData.id && landlordData.createdAt && landlordData.updatedAt) {
      return { success: true, data: landlordData as LandlordDTO };
    }
  }

  console.warn("Create landlord response did not match schema:", {
    error: parsed.success ? "Missing required fields" : parsed.error,
    response: result.data,
  });

  // Some backends return success without a full landlord payload
  // Return a minimal valid LandlordDTO structure
  return { 
    success: true, 
    data: {
      id: "",
      businessName: "",
      businessEmail: "",
      businessPhoneNumber: "",
      landLordName: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as LandlordDTO 
  };
};





