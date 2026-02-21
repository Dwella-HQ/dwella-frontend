import { apiPost } from "@/lib/apiClient";
import type {
  InvitePropertyManagerRequestDTO,
  CreatePropertyManagerRequestDTO,
  CreatePropertyManagerResponseDTO,
  InvitePropertyManagerResponseDTO,
  PropertyManagerDTO,
  PropertyManagerInvitationDTO,
} from "./propertyManagers.schema";
import { invitePropertyManagerResponseSchema, createPropertyManagerResponseSchema } from "./propertyManagers.schema";

type InvitePropertyManagerResult =
  | { success: true; data: PropertyManagerInvitationDTO; message?: string }
  | { success: false; error: string };

type CreatePropertyManagerResult =
  | { success: true; data: PropertyManagerDTO }
  | { success: false; error: string };

export const invitePropertyManager = async (
  landlordId: string,
  data: InvitePropertyManagerRequestDTO
): Promise<InvitePropertyManagerResult> => {
  const result = await apiPost<InvitePropertyManagerResponseDTO>(
    `/property-manager/invite/${landlordId}`,
    data
  );

  if (!result.success) {
    return result;
  }

  // Validate response with Zod
  try {
    const parsed = invitePropertyManagerResponseSchema.parse(result.data);
    // The response contains invitation data
    const invitation = parsed.data;
    if (invitation) {
      return { 
        success: true, 
        data: invitation,
        message: parsed.message || "Invitation sent successfully"
      };
    }
    return {
      success: false,
      error: "Invalid response: missing invitation data",
    };
  } catch (parseError) {
    console.error("Invite property manager schema validation error:", parseError);
    console.error("Received data:", result.data);
    return {
      success: false,
      error: "Invalid response data format received",
    };
  }
};

// Legacy function for backward compatibility
export const createPropertyManager = async (
  data: CreatePropertyManagerRequestDTO
): Promise<CreatePropertyManagerResult> => {
  const result = await apiPost<CreatePropertyManagerResponseDTO>("/property-manager", data);

  if (!result.success) {
    return result;
  }

  // Validate response with Zod
  try {
    const parsed = createPropertyManagerResponseSchema.parse(result.data);
    // Handle both direct manager object and object with data property
    const manager = parsed.data || (parsed as unknown as PropertyManagerDTO);
    return { success: true, data: manager };
  } catch (parseError) {
    console.error("Create property manager schema validation error:", parseError);
    console.error("Received data:", result.data);
    return {
      success: false,
      error: "Invalid response data format received",
    };
  }
};

