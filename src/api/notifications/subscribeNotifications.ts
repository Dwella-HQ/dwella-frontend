import { io, type Socket } from "socket.io-client";
import { z } from "zod";
import { createUrl } from "@/utils/createUrl";
import {
  notificationSchema,
  type NotificationDTO,
} from "./notifications.schema";

const notificationArrayPayloadSchema = z.array(notificationSchema);

type SubscribeNotificationsOptions = {
  token?: string;
  userId: string;
  page?: number;
  limit?: number;
  onLoad: (items: NotificationDTO[]) => void;
  onConnectionChange?: (isConnected: boolean) => void;
  onError?: (error: string) => void;
};

type NotificationLoadOptions = {
  page?: number;
  limit?: number;
};

export type NotificationSubscription = {
  load: (options?: NotificationLoadOptions) => void;
  markRead: (notificationId: string) => void;
  delete: (notificationId: string) => void;
  disconnect: () => void;
};

const extractNotifications = (payload: unknown): NotificationDTO[] | null => {
  const directList = notificationArrayPayloadSchema.safeParse(payload);
  if (directList.success) return directList.data;

  if (!payload || typeof payload !== "object") return null;

  const data = payload as Record<string, unknown>;
  const candidates = [
    data.data,
    data.notifications,
    data.items,
    data.results,
  ];

  for (const candidate of candidates) {
    const parsed = notificationArrayPayloadSchema.safeParse(candidate);
    if (parsed.success) return parsed.data;

    if (candidate && typeof candidate === "object") {
      const nested = candidate as Record<string, unknown>;
      const nestedParsed = notificationArrayPayloadSchema.safeParse(
        nested.notifications ?? nested.items ?? nested.results,
      );
      if (nestedParsed.success) return nestedParsed.data;
    }
  }

  return null;
};

export const subscribeNotifications = (
  options: SubscribeNotificationsOptions,
): NotificationSubscription => {
  const token =
    options.token ||
    (typeof window !== "undefined"
      ? localStorage.getItem("authToken") || localStorage.getItem("accessToken")
      : null) ||
    "";

  const socket: Socket = io(createUrl("/notifications"), {
    transports: ["websocket"],
    auth: { token },
    query: { token },
  });

  const load = (loadOptions?: NotificationLoadOptions) => {
    socket.emit("notification:load", {
      userId: options.userId,
      page: loadOptions?.page ?? options.page ?? 1,
      limit: loadOptions?.limit ?? options.limit,
    });
  };

  socket.on("connect", () => {
    options.onConnectionChange?.(true);
    load();
  });

  socket.on("disconnect", () => {
    options.onConnectionChange?.(false);
  });

  socket.on("connect_error", (error: Error) => {
    options.onConnectionChange?.(false);
    options.onError?.(error.message || "Unable to load notifications");
  });

  socket.on("error", (payload: unknown) => {
    const message =
      typeof payload === "string"
        ? payload
        : (payload as { message?: string })?.message ||
          "Unable to load notifications";
    options.onError?.(message);
  });

  socket.on("notifications:load", (payload: unknown) => {
    const notifications = extractNotifications(payload);
    if (notifications) {
      options.onLoad(notifications);
      return;
    }

    options.onError?.("Unable to read notifications");
  });

  return {
    load,
    markRead: (notificationId: string) => {
      socket.emit("notification:read", {
        notificationId,
        userId: options.userId,
      });
    },
    delete: (notificationId: string) => {
      socket.emit("notification:delete", {
        notificationId,
        userId: options.userId,
      });
    },
    disconnect: () => {
      socket.removeAllListeners();
      socket.disconnect();
    },
  };
};
