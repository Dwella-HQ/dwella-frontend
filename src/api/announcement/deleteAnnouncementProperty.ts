import { apiDelete } from "@/lib/apiClient";
import {
  announcementActionResponseSchema,
  type AnnouncementActionResponseDTO,
} from "./announcement.schema";

export type DeleteAnnouncementPropertyResult =
  | { success: true; data: AnnouncementActionResponseDTO }
  | { success: false; error: string; statusCode?: number };

/**
 * Deletes a property-scoped announcement.
 * Backend path (per docs): DELETE /announcement/{id}/property
 *
 * Note: The docs screenshot sometimes labels the param as {propertyId},
 * but this should be the announcement id for deletion.
 */
export const deleteAnnouncementProperty = async (
  id: string,
): Promise<DeleteAnnouncementPropertyResult> => {
  const result = await apiDelete<AnnouncementActionResponseDTO>(
    `/announcement/${id}/property`,
  );

  if (!result.success) return result;

  const parsed = announcementActionResponseSchema.safeParse(result.data);
  if (parsed.success) {
    return { success: true, data: parsed.data };
  }

  return { success: true, data: { success: true, message: "Deleted" } };
};
