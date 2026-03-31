import { apiGet } from "@/lib/apiClient";
import {
  announcementItemSchema,
  type AnnouncementItemDTO,
} from "./announcement.schema";

export type GetAnnouncementByIdResult =
  | { success: true; data: AnnouncementItemDTO }
  | { success: false; error: string; statusCode?: number };

export const getAnnouncementById = async (
  id: string,
): Promise<GetAnnouncementByIdResult> => {
  const result = await apiGet<{
    success?: boolean;
    message?: string;
    data?: unknown;
  }>(`/announcement/${id}`);

  if (!result.success) return result;

  const payload =
    (result.data as { data?: unknown })?.data ??
    (result.data as unknown as AnnouncementItemDTO);
  const parsed = announcementItemSchema.safeParse(payload);
  if (parsed.success) return { success: true, data: parsed.data };

  return { success: false, error: "Invalid announcement payload" };
};
