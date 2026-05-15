import { z } from "zod";

export const announcementActionResponseSchema = z.object({
  success: z.boolean().optional(),
  message: z.string().optional(),
  data: z.unknown().optional(),
});

export const announcementItemSchema = z.preprocess(
  (value) => {
    if (!value || typeof value !== "object") return value;
    const raw = value as {
      fileIds?: unknown;
      files?: unknown;
      content?: unknown;
      message?: unknown;
      body?: unknown;
    };

    const normalized = {
      ...(value as Record<string, unknown>),
      content: raw.content ?? raw.message ?? raw.body,
    };

    if (Array.isArray(raw.fileIds)) return normalized;

    if (Array.isArray(raw.files)) {
      const fileIds = raw.files
        .map((file) => {
          if (typeof file === "string") return file;
          if (file && typeof file === "object") {
            return (file as { id?: unknown }).id;
          }
          return undefined;
        })
        .filter((id): id is string => typeof id === "string");

      return {
        ...normalized,
        fileIds,
      };
    }

    return normalized;
  },
  z
    .object({
      id: z.string().optional(),
      title: z.string(),
      content: z.string(),
      level: z.string().optional(),
      files: z
        .array(
          z
            .object({
              id: z.string().optional(),
              url: z.string().optional(),
              fileName: z.string().optional(),
              mimeType: z.string().optional(),
              label: z.string().optional(),
            })
            .passthrough(),
        )
        .optional(),
      fileIds: z.array(z.string()).optional().default([]),
      createdAt: z.string().optional(),
      updatedAt: z.string().optional(),
    })
    .passthrough(),
);

export const announcementListEventSchema = z.object({
  success: z.boolean().optional(),
  message: z.string().optional(),
  data: z.array(announcementItemSchema).optional().default([]),
});

export type AnnouncementActionResponseDTO = z.infer<
  typeof announcementActionResponseSchema
>;
export type AnnouncementItemDTO = z.infer<typeof announcementItemSchema>;
export type AnnouncementListEventDTO = z.infer<
  typeof announcementListEventSchema
>;
