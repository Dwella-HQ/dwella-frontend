import { io, type Socket } from "socket.io-client";
import { z } from "zod";
import { createUrl } from "@/utils/createUrl";
import { chatMessageSchema, chatSchema, type ChatDTO } from "./chat.schema";

const chatArraySchema = z.array(chatSchema);
const messageArraySchema = z.array(chatMessageSchema);

type SocketAck<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

type SubscribeChatOptions = {
  token?: string;
  roleId: string;
  onChats: (chats: ChatDTO[]) => void;
  onConnectionChange?: (isConnected: boolean) => void;
  onError?: (error: string) => void;
};

type CreateChatPayload = {
  chatId?: string;
  receiverId?: string;
  message: string;
};

export type ChatSubscription = {
  loadChats: () => void;
  loadMessages: (chatId: string) => void;
  sendMessage: (payload: CreateChatPayload) => void;
  markRead: (chatId: string, messageIds?: string[]) => void;
  deleteMessages: (chatId: string, messageIds: string[]) => void;
  disconnect: () => void;
};

const unwrapPayload = (payload: unknown): unknown => {
  if (!payload || typeof payload !== "object") return payload;

  const data = payload as Record<string, unknown>;
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

  const emitWithAck = <T,>(
    event: string,
    payload?: unknown,
    onSuccess?: (data: T) => void,
  ) => {
    socket.emit(event, payload, (response: unknown) => {
      const responseData = unwrapPayload(response) as T;
      onSuccess?.(responseData);
    });
  };

  const loadChats = () => {
    emitWithAck<unknown[]>("findAllChat", undefined, (payload) => {
      const chats = extractChats(payload);
      if (chats) options.onChats(chats);
    });
  };

  const loadMessages = (chatId: string) => {
    emitWithAck<unknown>("getChatMessages", { chatId }, (payload) => {
      const messages = extractMessages(payload);
      if (!messages) return;

      options.onChats([
        {
          id: chatId,
          messages,
          lastMessage: messages[0]?.content || "",
          name: "Conversation",
          participants: [],
          unreadCount: 0,
          createdAt: messages[0]?.createdAt,
          updatedAt: messages[0]?.updatedAt,
        } as ChatDTO,
      ]);
    });
  };

  socket.on("connect", () => {
    options.onConnectionChange?.(true);
    emitWithAck<SocketAck<unknown>>("chat", options.roleId, () => {
      loadChats();
    });
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

  const reloadOnEvent = (payload: unknown) => {
    const chats = extractChats(payload);
    if (chats) {
      options.onChats(chats);
      return;
    }
    loadChats();
  };

  [
    "chat",
    "chat:load",
    "chat:created",
    "chat:updated",
    "message",
    "message:new",
    "messages:load",
    "createChat",
    "updateChat",
    "removeChat",
  ].forEach((event) => {
    socket.on(event, reloadOnEvent);
  });

  return {
    loadChats,
    loadMessages,
    sendMessage: ({ chatId, receiverId, message }) => {
      const payload = {
        chatId,
        id: chatId,
        receiverId,
        message,
        content: message,
        text: message,
      };
      emitWithAck("createChat", payload, loadChats);
    },
    markRead: (chatId: string, messageIds?: string[]) => {
      emitWithAck("readChatMessages", {
        chatId,
        messageIds,
        userId: options.roleId,
      });
    },
    deleteMessages: (chatId: string, messageIds: string[]) => {
      emitWithAck(
        "deleteChatMessages",
        {
          chatId,
          messageIds,
          userId: options.roleId,
        },
        loadChats,
      );
    },
    disconnect: () => {
      socket.removeAllListeners();
      socket.disconnect();
    },
  };
};
