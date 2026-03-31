import { io, type Socket } from "socket.io-client";
import { z } from "zod";
import { createUrl } from "@/utils/createUrl";
import {
  announcementItemSchema,
  announcementListEventSchema,
  type AnnouncementItemDTO,
} from "./announcement.schema";

const announcementArrayPayloadSchema = z.array(announcementItemSchema);

type SubscribeAnnouncementsOptions = {
  token?: string;
  onLoad: (items: AnnouncementItemDTO[]) => void;
  onRaw?: (payload: unknown) => void;
  onError?: (error: string) => void;
};

export type AnnouncementSubscription = {
  disconnect: () => void;
};

/**
 * Subscribe to announcement updates over socket.io.
 * Backend contract:
 * - namespace: /announcement
 * - auth payload includes token
 * - event: load:announcements
 */
export const subscribeAnnouncements = (
  options: SubscribeAnnouncementsOptions,
): AnnouncementSubscription => {
  const socketUrl = createUrl("/announcement");
  const token =
    options.token ||
    (typeof window !== "undefined"
      ? localStorage.getItem("authToken") || localStorage.getItem("accessToken")
      : null) ||
    "";

  const socket: Socket = io(socketUrl, {
    transports: ["websocket", "polling"],
    auth: { token },
  });

  socket.on("connect", () => {
    console.log("Announcement socket connected", {
      namespace: "/announcement",
      socketId: socket.id,
    });
  });

  socket.on("connect_error", (error: Error) => {
    options.onError?.(error.message || "Failed to connect to announcements");
  });

  socket.on("error", (payload: unknown) => {
    const message =
      typeof payload === "string"
        ? payload
        : (payload as { message?: string })?.message || "Socket error";
    options.onError?.(message);
  });

  socket.on("load:announcements", (payload: unknown) => {
    options.onRaw?.(payload);
    const wrapped = announcementListEventSchema.safeParse(payload);
    if (wrapped.success) {
      options.onLoad(wrapped.data.data ?? []);
      return;
    }

    // Some backends emit the list directly as an array on this event.
    const listOnly = announcementArrayPayloadSchema.safeParse(payload);
    if (listOnly.success) {
      options.onLoad(listOnly.data);
      return;
    }

    options.onError?.("Invalid announcements payload");
  });

  return {
    disconnect: () => {
      socket.removeAllListeners("load:announcements");
      socket.removeAllListeners("connect");
      socket.removeAllListeners("connect_error");
      socket.removeAllListeners("error");
      socket.disconnect();
    },
  };
};
