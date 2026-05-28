import { apiPost } from "@/lib/apiClient";
import {
  announcementActionResponseSchema,
  type AnnouncementActionResponseDTO,
} from "./announcement.schema";

export type CreateAnnouncementPayload = {
  title: string;
  content: string;
  fileIds: string[];
  propertyIds: string[];
};

export type CreateAnnouncementLandlordResult =
  | { success: true; data: AnnouncementActionResponseDTO }
  | { success: false; error: string; statusCode?: number };

export const createAnnouncementLandlord = async (
  landlordId: string,
  payload: CreateAnnouncementPayload,
): Promise<CreateAnnouncementLandlordResult> => {
  console.log("createAnnouncementLandlord request", {
    landlordId,
    payload,
  });
  const body = {
    ...payload,
    fileIds: Array.isArray(payload.fileIds) ? payload.fileIds : [],
    propertyIds: Array.isArray(payload.propertyIds) ? payload.propertyIds : [],
  };
  const result = await apiPost<AnnouncementActionResponseDTO>(
    `/announcement/landlord/${landlordId}`,
    body,
  );

  if (!result.success) {
    console.log("createAnnouncementLandlord response (error)", result);
    return result;
  }

  const parsed = announcementActionResponseSchema.safeParse(result.data);
  if (parsed.success) {
    console.log("createAnnouncementLandlord response (success)", parsed.data);
    return { success: true, data: parsed.data };
  }

  console.log(
    "createAnnouncementLandlord response (fallback success)",
    result.data,
  );
  return { success: true, data: { success: true, message: "Sent" } };
};
