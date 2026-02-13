import { z } from "zod";

// Upload File Request (form-data)
export type UploadFileRequest = {
  file: File;
  folder?: string;
  label?: string;
  token?: string; // auth token (not part of form data)
};

// File Response
export const fileSchema = z.object({
  id: z.string().uuid(),
  url: z.string().url(),
  filename: z.string().optional().nullable(),
  fileName: z.string().optional(),
  folder: z.string().nullable(),
  label: z.string().nullable(),
  size: z.number().optional(),
  mimeType: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type FileDTO = z.infer<typeof fileSchema>;

// File Upload Response
export const fileUploadResponseSchema = z.object({
  success: z.boolean().optional(),
  data: fileSchema,
  message: z.string().optional(),
});

export type FileUploadResponseDTO = z.infer<typeof fileUploadResponseSchema>;

// File Delete Response
export const fileDeleteResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export type FileDeleteResponseDTO = z.infer<typeof fileDeleteResponseSchema>;





