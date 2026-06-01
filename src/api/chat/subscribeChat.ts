import { io, type Socket } from "socket.io-client";
import { z } from "zod";
import { createUrl } from "@/utils/createUrl";
import { chatMessageSchema, chatSchema, type ChatDTO } from "./chat.schema";

const chatArraySchema = z.array(chatSchema);
const messageArraySchema = z.array(chatMessageSchema);

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

  if (!unwrapped || typeof unwrapped !== "object") return null;
  const data = unwrapped as Record<string, unknown>;
  const candidates = [data.messages, data.items, data.results];

  for (const candidate of candidates) {
    const parsed = messageArraySchema.safeParse(candidate);
    if (parsed.success) return parsed.data;
  }

  return null;
};

const extractChatIds = (payload: unknown): string[] | null => {
  const unwrapped = unwrapPayload(payload);
  if (!unwrapped || typeof unwrapped !== "object") return null;

  const data = unwrapped as Record<string, unknown>;
  const candidates = [data.chatIds, data.ids, data.chats];
  for (const candidate of candidates) {
    if (!Array.isArray(candidate)) continue;
    const ids = candidate
      .map((item) => {
        if (typeof item === "string" || typeof item === "number") {
          return String(item);
        }
        if (item && typeof item === "object" && "id" in item) {
          return String((item as { id?: string | number }).id || "");
        }
        return "";
      })
      .filter(Boolean);
    if (ids.length > 0) return ids;
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

  const emitWithAck = <T,>(
    event: string,
    payload?: unknown,
    onSuccess?: (data: T) => void,
    onError?: (error: string) => void,
  ) => {
    socket
      .timeout(10000)
      .emit(event, payload, (error: Error | null, response: unknown) => {
        if (error) {
          onError?.(error.message || `No response for ${event}`);
          return;
        }
        const ackError = getAckErrorMessage(response);
        if (ackError) {
          onError?.(ackError);
          return;
        }
        const responseData = unwrapPayload(response) as T;
        onSuccess?.(responseData);
      });
  };

  const loadChat = (chatId: string) => {
    emitWithAck<unknown>("findOneChat", chatId, (payload) => {
      const chats = extractChats(payload);
      if (chats) handleChats(chats);
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
    chats.forEach((chat) => registerChatMessageListener(String(chat.id)));
    options.onChats(chats);
  };

  const loadChats = () => {
    emitWithAck<unknown>("chat", options.roleId, (payload) => {
      const chats = extractChats(payload);
      if (chats) {
        handleChats(chats);
        return;
      }

      const chatIds = extractChatIds(payload);
      if (chatIds?.length) {
        chatIds.forEach((chatId) => {
          registerChatMessageListener(chatId);
          loadChat(chatId);
        });
        return;
      }

      handleChats([]);
    });

    emitWithAck<unknown[]>("findAllChat", undefined, (payload) => {
      const chats = extractChats(payload);
      if (chats) {
        handleChats(chats);
      }
    });
  };

  const loadMessages = (chatId: string) => {
    registerChatMessageListener(chatId);
    emitWithAck<unknown>("getChatMessages", { chatId }, (payload) => {
      const messages = extractMessages(payload);
      if (!messages) return;
      options.onMessages?.(chatId, messages);
    });
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

  socket.on("connect", () => {
    options.onConnectionChange?.(true);
    loadChats();
  });

  socket.on("disconnect", () => {
    options.onConnectionChange?.(false);
  });

  socket.on("connect_error", (error: Error) => {
    options.onConnectionChange?.(false);
    options.onError?.(error.message || "Unable to connect to messages");
  });

  socket.on("error", (payload: unknown) => {
    const message =
      typeof payload === "string"
        ? payload
        : (payload as { message?: string })?.message ||
          "Unable to connect to messages";
    options.onError?.(message);
  });

  const handleChatsEvent = (payload: unknown) => {
    const chats = extractChats(payload);
    if (chats) {
      handleChats(chats);
      return;
    }
    loadChats();
  };

  [
    "load:chats",
    "chat",
    "createChat",
    "updateChat",
    "removeChat",
  ].forEach((event) => {
    socket.on(event, handleChatsEvent);
  });

  socket.on("load:messages", (payload: unknown) => {
    const messages = extractMessages(payload);
    if (!messages) return;
    const chatId = messages[0]?.chatId;
    if (!chatId) return;
    options.onMessages?.(chatId, messages);
  });

  return {
    loadChats,
    loadMessages,
    createChat: (participants) => {
      emitWithAck<unknown>(
        "createChat",
        { participants },
        (payload) => {
          const chats = extractChats(payload);
          if (chats) {
            handleChats(chats);
          } else {
            handleChats([]);
          }
          loadChats();
        },
        (message) => options.onError?.(message || "Unable to start chat"),
      );
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
      socket.removeAllListeners();
      socket.disconnect();
    },
  };
};
