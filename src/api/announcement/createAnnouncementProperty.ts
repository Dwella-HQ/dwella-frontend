import { apiPost } from "@/lib/apiClient";
import {
  announcementActionResponseSchema,
  type AnnouncementActionResponseDTO,
} from "./announcement.schema";
import type { CreateAnnouncementPayload } from "./createAnnouncementLandlord";

export type CreateAnnouncementPropertyResult =
  | { success: true; data: AnnouncementActionResponseDTO }
  | { success: false; error: string; statusCode?: number };

export const createAnnouncementProperty = async (
  propertyId: string,
  payload: CreateAnnouncementPayload,
): Promise<CreateAnnouncementPropertyResult> => {
  console.log("createAnnouncementProperty request", {
    propertyId,
    payload,
  });
  const body = {
    ...payload,
    fileIds: Array.isArray(payload.fileIds) ? payload.fileIds : [],
  };
  const result = await apiPost<AnnouncementActionResponseDTO>(
    `/announcement/property/${propertyId}`,
    body,
  );

  if (!result.success) {
    console.log("createAnnouncementProperty response (error)", result);
    return result;
  }

  const parsed = announcementActionResponseSchema.safeParse(result.data);
  if (parsed.success) {
    console.log("createAnnouncementProperty response (success)", parsed.data);
    return { success: true, data: parsed.data };
  }

  console.log(
    "createAnnouncementProperty response (fallback success)",
    result.data,
  );
  return { success: true, data: { success: true, message: "Sent" } };
};
