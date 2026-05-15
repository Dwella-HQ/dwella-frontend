import { z } from "zod";

const notificationIdSchema = z.union([z.string(), z.number()]).transform(String);

export const notificationSchema = z
  .object({
    id: notificationIdSchema,
    partner_id: z.union([z.number(), z.string()]).optional().nullable(),
    userId: z.string().optional().nullable(),
    title: z.string().optional().nullable(),
    message: z.string().optional().nullable(),
    content: z.string().optional().nullable(),
    body: z.string().optional().nullable(),
    type: z.string().optional().nullable(),
    isGeneral: z.boolean().optional().nullable(),
    read: z.boolean().optional().nullable(),
    isRead: z.boolean().optional().nullable(),
    createdAt: z.string().optional().nullable(),
    updatedAt: z.string().optional().nullable(),
    deletedAt: z.string().optional().nullable(),
  })
  .passthrough()
  .transform((notification) => {
    const now = new Date().toISOString();
    return {
      ...notification,
      title: notification.title || "Notification",
      message:
        notification.message ||
        notification.content ||
        notification.body ||
        "You have a new notification.",
      type: notification.type || "notification",
      isGeneral: Boolean(notification.isGeneral),
      read: Boolean(notification.read ?? notification.isRead),
      createdAt: notification.createdAt || now,
      updatedAt: notification.updatedAt || notification.createdAt || now,
      deletedAt: notification.deletedAt ?? null,
    };
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
  notificationIds: z.array(notificationIdSchema),
});

export const markNotificationsReadResponseSchema = z.object({
  status: z.string(),
});

export type NotificationDTO = z.infer<typeof notificationSchema>;
export type NotificationsPaginationDTO = z.infer<typeof notificationsPaginationSchema>;
export type NotificationsResponseDTO = z.infer<typeof notificationsResponseSchema>;
export type MarkNotificationsReadRequestDTO = z.infer<typeof markNotificationsReadRequestSchema>;
export type MarkNotificationsReadResponseDTO = z.infer<typeof markNotificationsReadResponseSchema>;

