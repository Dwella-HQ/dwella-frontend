import { apiPost } from "@/lib/apiClient";
import {
  announcementActionResponseSchema,
  type AnnouncementActionResponseDTO,
} from "./announcement.schema";

export type CreateAnnouncementPayload = {
  title: string;
  content: string;
  fileIds?: string[];
};

export type CreateAnnouncementLandlordResult =
  | { success: true; data: AnnouncementActionResponseDTO }
  | { success: false; error: string; statusCode?: number };

export const createAnnouncementLandlord = async (
  landlordId: string,
  payload: CreateAnnouncementPayload,
): Promise<CreateAnnouncementLandlordResult> => {
  const result = await apiPost<AnnouncementActionResponseDTO>(
    `/announcement/landlord/${landlordId}`,
    payload,
  );

  if (!result.success) return result;

  const parsed = announcementActionResponseSchema.safeParse(result.data);
  if (parsed.success) return { success: true, data: parsed.data };

  return { success: true, data: { success: true, message: "Sent" } };
};
