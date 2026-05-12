import { apiGet } from "@/lib/apiClient";
import {
  announcementItemSchema,
  type AnnouncementItemDTO,
} from "./announcement.schema";

export type GetAnnouncementsResult =
  | { success: true; data: AnnouncementItemDTO[] }
  | { success: false; error: string; statusCode?: number };

const extractAnnouncementList = (payload: unknown): unknown[] => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];

  const data = payload as Record<string, unknown>;
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.announcements)) return data.announcements;

  const nested = data.data;
  if (nested && typeof nested === "object") {
    const nestedData = nested as Record<string, unknown>;
    if (Array.isArray(nestedData.data)) return nestedData.data;
    if (Array.isArray(nestedData.announcements)) {
      return nestedData.announcements;
    }
  }

  return [];
};

export const getAnnouncements = async (): Promise<GetAnnouncementsResult> => {
  const result = await apiGet<unknown>("/announcement");
  if (!result.success) return result;

  const parsed = extractAnnouncementList(result.data)
    .map((item) => announcementItemSchema.safeParse(item))
    .filter(
      (item): item is { success: true; data: AnnouncementItemDTO } =>
        item.success,
    )
    .map((item) => item.data);

  return { success: true, data: parsed };
};
