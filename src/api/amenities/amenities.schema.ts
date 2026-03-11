import { z } from "zod";

export const amenitySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().optional().nullable(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type AmenityDTO = z.infer<typeof amenitySchema>;

export const amenitiesResponseSchema = z.object({
  success: z.boolean().optional(),
  message: z.string().optional(),
  data: z.array(amenitySchema).optional().default([]),
});

export type AmenitiesResponseDTO = z.infer<typeof amenitiesResponseSchema>;
