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
  const result = await apiPost<AnnouncementActionResponseDTO>(
    `/announcement/property/${propertyId}`,
    payload,
  );

  if (!result.success) return result;

  const parsed = announcementActionResponseSchema.safeParse(result.data);
  if (parsed.success) return { success: true, data: parsed.data };

  return { success: true, data: { success: true, message: "Sent" } };
};
