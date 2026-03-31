import { apiPatch } from "@/lib/apiClient";
import {
  announcementActionResponseSchema,
  type AnnouncementActionResponseDTO,
} from "./announcement.schema";
import type { CreateAnnouncementPayload } from "./createAnnouncementLandlord";

export type UpdateAnnouncementLandlordResult =
  | { success: true; data: AnnouncementActionResponseDTO }
  | { success: false; error: string; statusCode?: number };

export const updateAnnouncementLandlord = async (
  id: string,
  payload: CreateAnnouncementPayload,
): Promise<UpdateAnnouncementLandlordResult> => {
  const result = await apiPatch<AnnouncementActionResponseDTO>(
    `/announcement/${id}/landlord`,
    payload,
  );

  if (!result.success) return result;
  const parsed = announcementActionResponseSchema.safeParse(result.data);
  if (parsed.success) return { success: true, data: parsed.data };
  return { success: true, data: { success: true, message: "Updated" } };
};
