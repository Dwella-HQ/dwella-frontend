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

  console.log("[getAnnouncements] raw API data:", result.data);

  const rawList = extractAnnouncementList(result.data);
  console.log(
    "[getAnnouncements] extracted list length:",
    rawList.length,
    rawList,
  );

  const parseResults = rawList.map((item) => {
    const r = announcementItemSchema.safeParse(item);
    if (!r.success) {
      console.warn(
        "[getAnnouncements] item failed schema parse:",
        item,
        r.error.flatten(),
      );
    }
    return r;
  });

  const parsed = parseResults
    .filter(
      (item): item is { success: true; data: AnnouncementItemDTO } =>
        item.success,
    )
    .map((item) => item.data);

  console.log("[getAnnouncements] final parsed count:", parsed.length);
  return { success: true, data: parsed };
};
