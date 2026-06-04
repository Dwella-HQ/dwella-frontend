import { io, type Socket } from "socket.io-client";
import { z } from "zod";
import { createUrl } from "@/utils/createUrl";
import { chatMessageSchema, chatSchema, type ChatDTO } from "./chat.schema";

const chatArraySchema = z.array(chatSchema);
const messageArraySchema = z.array(chatMessageSchema);
const CHAT_ACK_TIMEOUT_MS = 10000;

type SubscribeChatOptions = {
  token?: string;
  roleId: string;
  onChats: (chats: ChatDTO[]) => void;
  onMessages?: (chatId: string, messages: ChatDTO["messages"]) => void;
  onConnectionChange?: (isConnected: boolean) => void;
  onError?: (error: string) => void;
};

type CreateChatPayload = {
  chatId: string;
  participantId: string;
  content: string;
  fileIds?: string[];
};

type CreateChatParticipantPayload = {
  roleId: string;
  role: string;
};

export type ChatSubscription = {
  loadChats: () => void;
  loadMessages: (chatId: string) => void;
  createChat: (participants: CreateChatParticipantPayload[]) => void;
  sendMessage: (payload: CreateChatPayload) => void;
  markRead: (chatId: string, messageIds?: string[]) => void;
  deleteMessages: (chatId: string, messageIds: string[]) => void;
  disconnect: () => void;
};

const unwrapPayload = (payload: unknown): unknown => {
  if (!payload || typeof payload !== "object") return payload;

  const data = payload as Record<string, unknown>;
  if ("response" in data) return unwrapPayload(data.response);
  if ("data" in data) return unwrapPayload(data.data);
  return payload;
};

const extractChats = (payload: unknown): ChatDTO[] | null => {
  const unwrapped = unwrapPayload(payload);
  const direct = chatArraySchema.safeParse(unwrapped);
  if (direct.success) return direct.data;

  if (!unwrapped || typeof unwrapped !== "object") return null;
  const data = unwrapped as Record<string, unknown>;
  const candidates = [data.chats, data.items, data.results];

  for (const candidate of candidates) {
    const parsed = chatArraySchema.safeParse(candidate);
    if (parsed.success) return parsed.data;
  }

  const single = chatSchema.safeParse(unwrapped);
  if (single.success) return [single.data];
  return null;
};

const extractMessages = (payload: unknown) => {
  const unwrapped = unwrapPayload(payload);
  const direct = messageArraySchema.safeParse(unwrapped);
  if (direct.success) return direct.data;

  const single = chatMessageSchema.safeParse(unwrapped);
  if (single.success) return [single.data];

  if (!unwrapped || typeof unwrapped !== "object") return null;
  const data = unwrapped as Record<string, unknown>;
  const candidates = [data.messages, data.items, data.results, data.message];

  for (const candidate of candidates) {
    const parsed = messageArraySchema.safeParse(candidate);
    if (parsed.success) return parsed.data;

    const singleParsed = chatMessageSchema.safeParse(candidate);
    if (singleParsed.success) return [singleParsed.data];
  }

  return null;
};

const getAckErrorMessage = (payload: unknown): string | null => {
  const unwrapped = unwrapPayload(payload);
  if (!unwrapped || typeof unwrapped !== "object") return null;

  const data = unwrapped as Record<string, unknown>;
  const status = typeof data.status === "string" ? data.status : "";
  const success = typeof data.success === "boolean" ? data.success : undefined;
  const message =
    (typeof data.message === "string" && data.message) ||
    (typeof data.error === "string" && data.error) ||
    "";

  if (status.toLowerCase() === "error" || success === false) {
    return message || "Chat request failed";
  }

  return null;
};

const getSocketAckErrorMessage = (event: string, error: Error): string => {
  const message = error.message || "";
  const isTimeout = message.toLowerCase().includes("timed out");

  if (!isTimeout) return message || `No response for ${event}`;
  return `The backend did not acknowledge ${event}.`;
};

const isAckTimeout = (error: Error): boolean =>
  (error.message || "").toLowerCase().includes("timed out");

const hasUsableParticipants = (chat: ChatDTO): boolean =>
  chat.participants.some((participant) => Boolean(participant.id));

const extractJoinedRoomCount = (payload: unknown): number | null => {
  const unwrapped = unwrapPayload(payload);
  if (!unwrapped || typeof unwrapped !== "object") return null;

  const message = (unwrapped as Record<string, unknown>).message;
  if (typeof message !== "string") return null;

  const match = message.match(/Joined\s+(\d+)\s+chat rooms?/i);
  return match ? Number(match[1]) : null;
};

export const subscribeChat = (
  options: SubscribeChatOptions,
): ChatSubscription => {
  const token =
    options.token ||
    (typeof window !== "undefined"
      ? localStorage.getItem("authToken") || localStorage.getItem("accessToken")
      : null) ||
    "";

  const socket: Socket = io(createUrl("/chat"), {
    transports: ["websocket"],
    auth: { token },
    query: { token },
  });
  const subscribedMessageEvents = new Set<string>();
  const hydratingChatIds = new Set<string>();
  const knownChatIds = new Set<string>();
  let loadChatsFallback: ReturnType<typeof setTimeout> | null = null;
  let pendingJoinedRoomCount = 0;

  const clearLoadChatsFallback = () => {
    if (!loadChatsFallback) return;
    clearTimeout(loadChatsFallback);
    loadChatsFallback = null;
  };

  const debug = (label: string, payload?: unknown) => {
    if (
      typeof window === "undefined" ||
      localStorage.getItem("chatDebug") !== "true"
    ) {
      return;
    }
    console.info(`[chat] ${label}`, payload);
  };

  const emitWithAck = <T,>(
    event: string,
    payload?: unknown,
    onSuccess?: (data: T) => void,
    onError?: (error: string) => void,
  ) => {
    debug(`emit ${event}`, payload);
    socket
      .timeout(CHAT_ACK_TIMEOUT_MS)
      .emit(event, payload, (error: Error | null, response: unknown) => {
        if (error) {
          debug(`ack error ${event}`, error);
          onError?.(getSocketAckErrorMessage(event, error));
          return;
        }
        debug(`ack ${event}`, response);
        const ackError = getAckErrorMessage(response);
        if (ackError) {
          onError?.(ackError);
          return;
        }
        const responseData = unwrapPayload(response) as T;
        onSuccess?.(responseData);
      });
  };

  const emitWithOptionalAck = <T,>(
    event: string,
    payload?: unknown,
    onSuccess?: (data: T) => void,
  ) => {
    debug(`emit ${event}`, payload);
    socket
      .timeout(CHAT_ACK_TIMEOUT_MS)
      .emit(event, payload, (error: Error | null, response: unknown) => {
        if (error) {
          debug(`optional ack error ${event}`, error);
          if (!isAckTimeout(error)) {
            options.onError?.(getSocketAckErrorMessage(event, error));
          }
          return;
        }
        debug(`optional ack ${event}`, response);
        const ackError = getAckErrorMessage(response);
        if (ackError) {
          options.onError?.(ackError);
          return;
        }
        onSuccess?.(unwrapPayload(response) as T);
      });
  };

  const registerChatMessageListener = (chatId: string) => {
    const event = `${chatId}:load:messages`;
    if (!chatId || subscribedMessageEvents.has(event)) return;

    subscribedMessageEvents.add(event);
    socket.on(event, (payload: unknown) => {
      const messages = extractMessages(payload);
      if (!messages) return;
      options.onMessages?.(chatId, messages);
    });
  };

  const handleChats = (chats: ChatDTO[]) => {
    clearLoadChatsFallback();
    pendingJoinedRoomCount = 0;
    chats.forEach((chat) => {
      const chatId = String(chat.id);
      knownChatIds.add(chatId);
      registerChatMessageListener(chatId);
    });
    options.onChats(chats);
  };

  const loadChat = (chatId: string) => {
    if (!chatId || hydratingChatIds.has(chatId)) return;
    hydratingChatIds.add(chatId);
    emitWithAck<unknown>(
      "findOneChat",
      chatId,
      (payload) => {
        hydratingChatIds.delete(chatId);
        const chats = extractChats(payload);
        if (chats) handleChats(chats);
      },
      () => {
        hydratingChatIds.delete(chatId);
      },
    );
  };

  const handleChatsPayload = (payload: unknown): boolean => {
    const chats = extractChats(payload);
    if (!chats) return false;
    handleChats(chats);
    chats
      .filter((chat) => !hasUsableParticipants(chat))
      .forEach((chat) => loadChat(String(chat.id)));
    return true;
  };

  const loadChats = () => {
    pendingJoinedRoomCount = 0;
    emitWithOptionalAck<unknown>("findChats", options.roleId, (payload) => {
      if (handleChatsPayload(payload)) return;
      pendingJoinedRoomCount = extractJoinedRoomCount(payload) ?? 0;
    });
    window.setTimeout(() => {
      if (!loadChatsFallback || pendingJoinedRoomCount > 0) return;
      emitWithOptionalAck<unknown>("chat", options.roleId, (payload) => {
        if (handleChatsPayload(payload)) return;
        pendingJoinedRoomCount = extractJoinedRoomCount(payload) ?? 0;
      });
    }, 1500);
    clearLoadChatsFallback();
    loadChatsFallback = setTimeout(() => {
      if (pendingJoinedRoomCount > 0) {
        clearLoadChatsFallback();
        options.onError?.(
          `The backend joined ${pendingJoinedRoomCount} chat room${
            pendingJoinedRoomCount === 1 ? "" : "s"
          } but did not send the chat list.`,
        );
        return;
      }
      handleChats([]);
    }, 5000);
  };

  const loadMessages = (chatId: string) => {
    registerChatMessageListener(chatId);
    emitWithAck<unknown>("getChatMessages", { chatId }, (payload) => {
      const messages = extractMessages(payload);
      if (!messages) return;
      options.onMessages?.(chatId, messages);
    });
  };

  const handleMessagesPayload = (
    payload: unknown,
    fallbackChatId = "",
  ): boolean => {
    const messages = extractMessages(payload);
    if (!messages) return false;
    const chatId = messages[0]?.chatId || fallbackChatId;
    if (!chatId) return false;
    if (!knownChatIds.has(chatId)) {
      registerChatMessageListener(chatId);
      loadChat(chatId);
      window.setTimeout(loadChats, 500);
    }
    options.onMessages?.(chatId, messages);
    return true;
  };

  const sendChatMessage = (payload: CreateChatPayload) => {
    const events = ["createMessage", "addChatMessage", "createChatMessage"];

    const tryEvent = (index: number) => {
      const event = events[index];
      if (!event) {
        options.onError?.("Unable to send message");
        return;
      }

      emitWithAck(
        event,
        payload,
        () => loadMessages(payload.chatId),
        () => tryEvent(index + 1),
      );
    };

    tryEvent(0);
  };

  const scheduleChatRefresh = () => {
    window.setTimeout(loadChats, 500);
    window.setTimeout(loadChats, 2000);
  };

  socket.on("connect", () => {
    debug("connect", { id: socket.id, roleId: options.roleId });
    options.onConnectionChange?.(true);
    loadChats();
  });

  socket.on("disconnect", () => {
    debug("disconnect");
    options.onConnectionChange?.(false);
  });

  socket.on("connect_error", (error: Error) => {
    debug("connect_error", error);
    options.onConnectionChange?.(false);
    options.onError?.(error.message || "Unable to connect to messages");
  });

  socket.on("error", (payload: unknown) => {
    debug("error", payload);
    const message =
      typeof payload === "string"
        ? payload
        : (payload as { message?: string })?.message ||
          "Unable to connect to messages";
    options.onError?.(message);
  });

  socket.on("exception", (payload: unknown) => {
    debug("exception", payload);
    const data =
      payload && typeof payload === "object"
        ? (payload as { message?: string; cause?: { pattern?: string } })
        : null;
    const pattern = data?.cause?.pattern;
    const message = data?.message || "Chat request failed on the backend";
    options.onError?.(pattern ? `${message} (${pattern})` : message);
  });

  const handleChatsEvent = (payload: unknown) => {
    if (handleChatsPayload(payload)) return;
    loadChats();
  };

  const knownChatEvents = new Set([
    "load:chats",
    "load:messages",
    "exception",
  ]);

  socket.onAny((event, payload) => {
    debug(`event ${event}`, payload);
    if (knownChatEvents.has(event)) return;
    if (handleChatsPayload(payload)) return;
    const messageEventSuffix = ":load:messages";
    const fallbackChatId = event.endsWith(messageEventSuffix)
      ? event.slice(0, -messageEventSuffix.length)
      : "";
    handleMessagesPayload(payload, fallbackChatId);
  });

  [
    "load:chats",
  ].forEach((event) => {
    socket.on(event, handleChatsEvent);
  });

  socket.on("load:messages", (payload: unknown) => {
    debug("event load:messages", payload);
    handleMessagesPayload(payload);
  });

  return {
    loadChats,
    loadMessages,
    createChat: (participants) => {
      emitWithOptionalAck<unknown>(
        "createChat",
        { participants },
        (payload) => {
          if (!handleChatsPayload(payload)) {
            loadChats();
          }
        },
      );
      scheduleChatRefresh();
    },
    sendMessage: sendChatMessage,
    markRead: (chatId: string, messageIds?: string[]) => {
      if (!messageIds || messageIds.length === 0) return;
      emitWithAck("readChatMessages", {
        chatId,
        messageIds,
      });
    },
    deleteMessages: (chatId: string, messageIds: string[]) => {
      emitWithAck(
        "deleteChatMessages",
        {
          chatId,
          messageIds,
        },
        () => loadMessages(chatId),
      );
    },
    disconnect: () => {
      clearLoadChatsFallback();
      socket.removeAllListeners();
      socket.disconnect();
    },
  };
};
