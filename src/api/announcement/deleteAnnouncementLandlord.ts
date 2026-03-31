import { apiDelete } from "@/lib/apiClient";
import {
  announcementActionResponseSchema,
  type AnnouncementActionResponseDTO,
} from "./announcement.schema";

export type DeleteAnnouncementLandlordResult =
  | { success: true; data: AnnouncementActionResponseDTO }
  | { success: false; error: string; statusCode?: number };

export const deleteAnnouncementLandlord = async (
  id: string,
): Promise<DeleteAnnouncementLandlordResult> => {
  const result = await apiDelete<AnnouncementActionResponseDTO>(
    `/announcement/${id}/landlord`,
  );

  if (!result.success) return result;
  const parsed = announcementActionResponseSchema.safeParse(result.data);
  if (parsed.success) return { success: true, data: parsed.data };
  return { success: true, data: { success: true, message: "Deleted" } };
};
