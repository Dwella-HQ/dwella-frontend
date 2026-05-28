import { apiPatch } from "@/lib/apiClient";
import {
  announcementActionResponseSchema,
  type AnnouncementActionResponseDTO,
} from "./announcement.schema";
import type { UpdateAnnouncementPayload } from "./updateAnnouncementLandlord";

export type UpdateAnnouncementPropertyResult =
  | { success: true; data: AnnouncementActionResponseDTO }
  | { success: false; error: string; statusCode?: number };

export const updateAnnouncementProperty = async (
  id: string,
  payload: UpdateAnnouncementPayload,
): Promise<UpdateAnnouncementPropertyResult> => {
  const result = await apiPatch<AnnouncementActionResponseDTO>(
    `/announcement/${id}/property`,
    payload,
  );

  if (!result.success) return result;
  const parsed = announcementActionResponseSchema.safeParse(result.data);
  if (parsed.success) return { success: true, data: parsed.data };
  return { success: true, data: { success: true, message: "Updated" } };
};
