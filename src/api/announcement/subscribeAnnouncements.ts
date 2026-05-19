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

/**
 * Always read the freshest token available so reconnection attempts (e.g.
 * after the access token rotates or after Next.js Fast Refresh tears down the
 * page) authenticate with the current credentials.
 */
const readFreshToken = (fallback?: string): string => {
  if (typeof window !== "undefined") {
    const authToken = window.localStorage.getItem("authToken");
    const accessToken = window.localStorage.getItem("accessToken");
    const stored = authToken || accessToken;
    console.log(
      "[socket token] authToken exists:",
      !!authToken,
      "accessToken exists:",
      !!accessToken,
      "using:",
      stored ? "FOUND" : "NONE",
      "fallback:",
      fallback ? "PROVIDED" : "NONE",
    );
    if (stored) return stored;
  }
  return fallback || "";
};

/**
 * Subscribe to announcement updates over socket.io.
 * Backend contract:
 * - namespace: /announcement
 * - websocket transport only
 * - auth/query payload includes token
 */
export const subscribeAnnouncements = (
  options: SubscribeAnnouncementsOptions,
): AnnouncementSubscription => {
  const socketUrl = createUrl("/announcement");
  const initialToken = readFreshToken(options.token);
  console.log(
    "[socket] creating announcement socket, token length:",
    initialToken.length,
    "first 20 chars:",
    initialToken.slice(0, 20),
  );

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
    // `auth` accepts a callback so every (re)connect picks up the latest token
    // from storage. Avoids `Authentication failed: Invalid token` after the
    // access token rotates while the socket was alive.
    auth: (cb) => {
      const freshToken = readFreshToken(options.token);
      console.log("[socket auth callback] token length:", freshToken.length);
      cb({ token: freshToken });
    },
  });

  const loadEvents = [
    "load:announcements",
    "announcements:load",
    "announcement:load",
    "announcement",
    "announcements",
  ];

  const requestEvents = [
    "get:announcements",
    "announcements:get",
    "load:announcements",
    "findAllAnnouncements",
    "findAllAnnouncement",
  ];

  // Refresh the query string token on reconnect attempts too, since the
  // backend reads `client.handshake.query.token` before `auth.token`.
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

  socket.on("connect", () => {
    console.log("[announcements] socket connected", {
      namespace: "/announcement",
      socketId: socket.id,
    });

    requestEvents.forEach((event) => {
      socket.emit(event);
    });
  });

  socket.on("disconnect", (reason: string) => {
    console.log("[announcements] socket disconnected", { reason });
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

  // Catch-all: log every event the server emits so we can see event names
  // that are outside our expected list (useful for debugging role-based rooms).
  socket.onAny((event: string, ...args: unknown[]) => {
    console.log("[announcements] socket ANY event:", event, args);
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

  loadEvents.forEach((event) => {
    socket.on(event, handleAnnouncementLoad);
  });

  socket.connect();

  return {
    disconnect: () => {
      socket.offAny();
      loadEvents.forEach((event) => {
        socket.removeAllListeners(event);
      });
      socket.removeAllListeners("connect");
      socket.removeAllListeners("disconnect");
      socket.removeAllListeners("connect_error");
      socket.removeAllListeners("error");
      socket.disconnect();
    },
  };
};
