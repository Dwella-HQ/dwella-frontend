import { io, type Socket } from "socket.io-client";
import { z } from "zod";
import { createUrl } from "@/utils/createUrl";
import {
  announcementItemSchema,
  announcementListEventSchema,
  type AnnouncementItemDTO,
} from "./announcement.schema";

const announcementArrayPayloadSchema = z.array(announcementItemSchema);

export const LOAD_ANNOUNCEMENTS_EVENT = "announcements:load";
const LOAD_ACK_TIMEOUT_MS = 5000;

type SubscribeAnnouncementsOptions = {
  token?: string;
  onLoad: (items: AnnouncementItemDTO[]) => void;
  onRaw?: (payload: unknown) => void;
  onError?: (error: string) => void;
};

export type AnnouncementSubscription = {
  disconnect: () => void;
};

const extractAnnouncementList = (
  payload: unknown,
): AnnouncementItemDTO[] | null => {
  const wrapped = announcementListEventSchema.safeParse(payload);
  if (wrapped.success) return wrapped.data.data ?? [];

  const listOnly = announcementArrayPayloadSchema.safeParse(payload);
  if (listOnly.success) return listOnly.data;

  if (!payload || typeof payload !== "object") return null;

  const data = payload as Record<string, unknown>;
  const nestedCandidates = [
    data.announcements,
    data.items,
    data.results,
    data.data,
  ];

  for (const candidate of nestedCandidates) {
    const nestedWrapped = announcementListEventSchema.safeParse(candidate);
    if (nestedWrapped.success) return nestedWrapped.data.data ?? [];

    const nestedList = announcementArrayPayloadSchema.safeParse(candidate);
    if (nestedList.success) return nestedList.data;
  }

  return null;
};

const readFreshToken = (fallback?: string): string => {
  if (typeof window !== "undefined") {
    const authToken = window.localStorage.getItem("authToken");
    const accessToken = window.localStorage.getItem("accessToken");
    const stored = authToken || accessToken;
    if (stored) return stored;
  }
  return fallback || "";
};

/**
 * Subscribe to announcements on `/announcement`: emit and listen for
 * `announcements:load` on connect (all roles).
 */
export const subscribeAnnouncements = (
  options: SubscribeAnnouncementsOptions,
): AnnouncementSubscription => {
  const socketUrl = createUrl("/announcement");
  const initialToken = readFreshToken(options.token);

  if (process.env.NODE_ENV === "development") {
    console.log("[announcements] opening socket", {
      tokenLength: initialToken.length,
      event: LOAD_ANNOUNCEMENTS_EVENT,
    });
  }

  let authRejected = false;

  const socket: Socket = io(socketUrl, {
    transports: ["websocket"],
    autoConnect: false,
    forceNew: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 800,
    reconnectionDelayMax: 5000,
    query: { token: initialToken },
    auth: (cb) => {
      cb({ token: readFreshToken(options.token) });
    },
  });

  const stopReconnectIfAuthRejected = (message: string) => {
    if (!/authentication failed/i.test(message)) return;
    if (authRejected) return;
    authRejected = true;
    socket.io.opts.reconnection = false;
    console.warn(
      "[announcements] stopping socket reconnect after authentication failure",
    );
  };

  socket.io.on("reconnect_attempt", () => {
    if (authRejected) return;
    const fresh = readFreshToken(options.token);
    socket.io.opts.query = { token: fresh };
  });

  const handleAnnouncementLoad = (payload: unknown) => {
    options.onRaw?.(payload);
    const items = extractAnnouncementList(payload);
    if (items) {
      options.onLoad(items);
      return;
    }

    console.warn(
      "[announcements] payload received but could not be parsed as announcement list",
      payload,
    );
    options.onError?.("Unable to read announcements");
  };

  socket.on("connect", () => {
    if (process.env.NODE_ENV === "development") {
      console.log("[announcements] socket connected", {
        namespace: "/announcement",
        socketId: socket.id,
      });
    }
    socket.timeout(LOAD_ACK_TIMEOUT_MS).emit(
      LOAD_ANNOUNCEMENTS_EVENT,
      (error: Error | null, payload: unknown) => {
        if (error) {
          if (process.env.NODE_ENV === "development") {
            console.warn("[announcements] load ack timed out", {
              event: LOAD_ANNOUNCEMENTS_EVENT,
            });
          }
          return;
        }
        handleAnnouncementLoad(payload);
      },
    );
  });

  socket.on("disconnect", (reason: string) => {
    if (process.env.NODE_ENV === "development") {
      console.log("[announcements] socket disconnected", { reason });
    }
  });

  socket.on("connect_error", (error: Error) => {
    const message = error.message || "Failed to connect to announcements";
    console.warn("[announcements] socket connect_error", message);
    stopReconnectIfAuthRejected(message);
    options.onError?.(message);
  });

  socket.on("error", (payload: unknown) => {
    console.warn("[announcements] socket 'error' event", payload);
    const message =
      typeof payload === "string"
        ? payload
        : (payload as { message?: string })?.message || "Socket error";
    stopReconnectIfAuthRejected(message);
    options.onError?.(message);
  });

  socket.on(LOAD_ANNOUNCEMENTS_EVENT, handleAnnouncementLoad);

  socket.connect();

  return {
    disconnect: () => {
      socket.removeAllListeners(LOAD_ANNOUNCEMENTS_EVENT);
      socket.removeAllListeners("connect");
      socket.removeAllListeners("disconnect");
      socket.removeAllListeners("connect_error");
      socket.removeAllListeners("error");
      socket.disconnect();
    },
  };
};
