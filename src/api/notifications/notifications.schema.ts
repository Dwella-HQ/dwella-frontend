import { z } from "zod";

export const notificationSchema = z.object({
  id: z.number(),
  partner_id: z.number(),
  title: z.string(),
  message: z.string(),
  type: z.string(),
  isGeneral: z.boolean(),
  read: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable(),
});

export const notificationsPaginationSchema = z.object({
  prevPage: z.number().nullable(),
  currentPage: z.number(),
  nextPage: z.number().nullable(),
  pageTotal: z.number(),
  pageSize: z.number(),
});

export const notificationsResponseSchema = z.object({
  status: z.string(),
  message: z.string(),
  data: z.object({
    total: z.number(),
    pagination: notificationsPaginationSchema,
    notifications: z.array(notificationSchema),
  }),
});

export const markNotificationsReadRequestSchema = z.object({
  notificationIds: z.array(z.number()),
});

export const markNotificationsReadResponseSchema = z.object({
  status: z.string(),
});

export type NotificationDTO = z.infer<typeof notificationSchema>;
export type NotificationsPaginationDTO = z.infer<typeof notificationsPaginationSchema>;
export type NotificationsResponseDTO = z.infer<typeof notificationsResponseSchema>;
export type MarkNotificationsReadRequestDTO = z.infer<typeof markNotificationsReadRequestSchema>;
export type MarkNotificationsReadResponseDTO = z.infer<typeof markNotificationsReadResponseSchema>;

