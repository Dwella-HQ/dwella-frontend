import { z } from "zod";

export const announcementActionResponseSchema = z.object({
  success: z.boolean().optional(),
  message: z.string().optional(),
  data: z.unknown().optional(),
});

export type AnnouncementActionResponseDTO = z.infer<
  typeof announcementActionResponseSchema
>;
