import * as React from "react";
import { getLandlordByUser } from "@/api/landlord";
import { getPropertyManagerByUser } from "@/api/property-managers";
import { getTenantByUser } from "@/api/tenants";
import {
  mapChat,
  mapChatMessage,
  subscribeChat,
  type ChatConversation,
  type ChatDTO,
  type ChatMessageDTO,
  type ChatSubscription,
} from "@/api/chat";
import { useSelectedLandlord } from "@/contexts/SelectedLandlordContext";
import { useUser } from "@/contexts/UserContext";

type ChatContextType = {
  conversations: ChatConversation[];
  selectedConversationId: string | null;
  selectedConversation: ChatConversation | null;
  isLoading: boolean;
  isConnected: boolean;
  error: string | null;
  currentRoleId: string | null;
  setSelectedConversationId: (conversationId: string | null) => void;
  refresh: () => void;
  loadMessages: (chatId: string) => void;
  createChat: (target: { role: string; roleId: string }) => void;
  sendMessage: (message: string, chatId?: string) => void;
  markConversationRead: (chatId: string) => void;
  deleteMessages: (chatId: string, messageIds: string[]) => void;
};

const ChatContext = React.createContext<ChatContextType | null>(null);
const START_CHAT_TIMEOUT_MS = 12000;

export const useChat = () => {
  const context = React.useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};

const getStoredSelectedLandlordId = (): string => {
  if (typeof window === "undefined") return "";

  const direct =
    localStorage.getItem("selectedLandlordId") ||
    localStorage.getItem("landlordId") ||
    "";
  if (direct) return direct;

  try {
    const stored = localStorage.getItem("selectedLandlord");
    if (!stored) return "";
    const parsed = JSON.parse(stored) as { id?: unknown };
    return typeof parsed.id === "string" ? parsed.id : "";
  } catch {
    return "";
  }
};

const mergeChats = (
  current: ChatConversation[],
  incoming: ChatDTO[],
): ChatConversation[] => {
  const mapped = incoming.map(mapChat);
  const byId = new Map(current.map((chat) => [chat.id, chat]));

  mapped.forEach((chat) => {
    const existing = byId.get(chat.id);
    byId.set(chat.id, {
      ...existing,
      ...chat,
      name: existing?.name && chat.name === "Conversation" ? existing.name : chat.name,
      subtitle:
        existing?.subtitle && chat.subtitle === "Chat"
          ? existing.subtitle
          : chat.subtitle,
      messages:
        chat.messages.length > 0 ? chat.messages : existing?.messages ?? [],
      participants:
        chat.participants.length > 0
          ? chat.participants
          : existing?.participants ?? [],
    });
  });

  return Array.from(byId.values()).sort((a, b) => {
    const aDate = a.messages[a.messages.length - 1]?.createdAt || "";
    const bDate = b.messages[b.messages.length - 1]?.createdAt || "";
    return bDate.localeCompare(aDate);
  });
};

const mergeMessages = (
  current: ChatConversation[],
  chatId: string,
  incoming: ChatMessageDTO[],
): ChatConversation[] => {
  const messages = incoming
    .map(mapChatMessage)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const latestMessage = messages[messages.length - 1];

  return current.map((chat) =>
    chat.id === chatId
      ? {
          ...chat,
          messages,
          lastMessage: latestMessage?.content || "No messages yet",
          lastMessageTime: latestMessage?.time || chat.lastMessageTime,
        }
      : chat,
  );
};

export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useUser();
  const { selectedLandlord } = useSelectedLandlord();
  const subscriptionRef = React.useRef<ChatSubscription | null>(null);
  const conversationsRef = React.useRef<ChatConversation[]>([]);
  const selectedConversationIdRef = React.useRef<string | null>(null);
  const pendingChatTargetRef = React.useRef<string | null>(null);
  const pendingChatTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const [roleId, setRoleId] = React.useState<string | null>(null);
  const [conversations, setConversations] = React.useState<ChatConversation[]>(
    [],
  );
  const [selectedConversationId, setSelectedConversationId] = React.useState<
    string | null
  >(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isConnected, setIsConnected] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const clearPendingChatTimer = React.useCallback(() => {
    if (!pendingChatTimerRef.current) return;
    clearTimeout(pendingChatTimerRef.current);
    pendingChatTimerRef.current = null;
  }, []);

  React.useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  React.useEffect(() => {
    selectedConversationIdRef.current = selectedConversationId;
  }, [selectedConversationId]);

  React.useEffect(() => {
    let cancelled = false;

    const resolveRoleId = async () => {
      if (!user?.id || !user.role) {
        setRoleId(null);
        return;
      }

      if (user.role === "landlord") {
        const result = await getLandlordByUser(String(user.id));
        if (cancelled) return;
        if (result.success) {
          if (typeof window !== "undefined") {
            localStorage.setItem("landlordId", result.data.id);
            if (localStorage.getItem("chatDebug") === "true") {
              console.info("[chat] resolved landlord roleId", result.data.id);
            }
          }
          setRoleId(result.data.id);
          return;
        }
      }

      if (user.role === "tenant") {
        const result = await getTenantByUser(String(user.id));
        if (cancelled) return;
        if (result.success) {
          if (typeof window !== "undefined") {
            localStorage.setItem("tenantId", result.data.id);
            if (localStorage.getItem("chatDebug") === "true") {
              console.info("[chat] resolved tenant roleId", result.data.id);
            }
          }
          setRoleId(result.data.id);
          return;
        }
      }

      if (user.role === "property_manager") {
        const result = await getPropertyManagerByUser(String(user.id));
        if (cancelled) return;
        const selectedLandlordId =
          selectedLandlord?.id || getStoredSelectedLandlordId();
        const manager = result.success
          ? result.data.find(
              (item) => item.landlord?.id === selectedLandlordId,
            ) ??
            result.data.find(
              (item) =>
                item.id ===
                (typeof window !== "undefined"
                  ? localStorage.getItem("propertyManagerId")
                  : null),
            ) ??
            result.data[0]
          : null;
        const managerId = manager?.id ?? null;
        if (managerId) {
          if (typeof window !== "undefined") {
            localStorage.setItem("propertyManagerId", managerId);
            if (localStorage.getItem("chatDebug") === "true") {
              console.info("[chat] resolved property manager roleId", {
                managerId,
                selectedLandlordId,
              });
            }
          }
          setRoleId(managerId);
          return;
        }
      }

      setRoleId(String(user.id));
    };

    void resolveRoleId();

    return () => {
      cancelled = true;
    };
  }, [selectedLandlord?.id, user?.id, user?.role]);

  React.useEffect(() => {
    subscriptionRef.current?.disconnect();
    subscriptionRef.current = null;

    if (!user?.token || !roleId) {
      setConversations([]);
      setSelectedConversationId(null);
      setIsConnected(false);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    const subscription = subscribeChat({
      token: user.token,
      roleId,
      onConnectionChange: setIsConnected,
      onChats: (chats) => {
        setConversations((current) => mergeChats(current, chats));
        setIsLoading(false);
        setError(null);
      },
      onMessages: (chatId, messages) => {
        setConversations((current) => mergeMessages(current, chatId, messages));
        if (selectedConversationIdRef.current === chatId) {
          const unreadMessageIds = messages
            .filter(
              (message) =>
                !message.isRead &&
                String(message.participant?.roleId ?? message.senderId) !==
                  roleId,
            )
            .map((message) => message.id);
          subscriptionRef.current?.markRead(chatId, unreadMessageIds);
        }
        setIsLoading(false);
        setError(null);
      },
      onError: (message) => {
        clearPendingChatTimer();
        pendingChatTargetRef.current = null;
        setError(message);
        setIsLoading(false);
      },
    });

    subscriptionRef.current = subscription;

    return () => {
      clearPendingChatTimer();
      subscription.disconnect();
      if (subscriptionRef.current === subscription) {
        subscriptionRef.current = null;
      }
    };
  }, [clearPendingChatTimer, roleId, user?.token]);

  React.useEffect(() => {
    setSelectedConversationId((current) => {
      if (pendingChatTargetRef.current) {
        const pending = conversations.find((chat) =>
          chat.participants.some(
            (participant) =>
              participant.roleId === pendingChatTargetRef.current,
          ),
        );
        if (pending) {
          clearPendingChatTimer();
          pendingChatTargetRef.current = null;
          subscriptionRef.current?.loadMessages(pending.id);
          return pending.id;
        }
      }

      if (current && conversations.some((chat) => chat.id === current)) {
        return current;
      }
      return conversations[0]?.id ?? null;
    });
  }, [clearPendingChatTimer, conversations]);

  const refresh = React.useCallback(() => {
    if (!roleId || !user?.token) return;
    setIsLoading(true);
    subscriptionRef.current?.loadChats();
  }, [roleId, user?.token]);

  const loadMessages = React.useCallback((chatId: string) => {
    subscriptionRef.current?.loadMessages(chatId);
  }, []);

  const createChat = React.useCallback(
    (target: { role: string; roleId: string }) => {
      if (!roleId || !user?.role || !target.roleId || !target.role) return;
      pendingChatTargetRef.current = target.roleId;

      const existing = conversationsRef.current.find((chat) =>
        chat.participants.some(
          (participant) => participant.roleId === target.roleId,
        ),
      );

      if (existing) {
        clearPendingChatTimer();
        pendingChatTargetRef.current = null;
        setSelectedConversationId(existing.id);
        subscriptionRef.current?.loadMessages(existing.id);
        return;
      }

      setIsLoading(true);
      clearPendingChatTimer();
      pendingChatTimerRef.current = setTimeout(() => {
        if (pendingChatTargetRef.current !== target.roleId) return;
        pendingChatTargetRef.current = null;
        pendingChatTimerRef.current = null;
        setIsLoading(false);
        setError(
          "The backend did not send the created conversation back. Please refresh or try again.",
        );
      }, START_CHAT_TIMEOUT_MS);
      subscriptionRef.current?.createChat([
        { role: user.role, roleId },
        { role: target.role, roleId: target.roleId },
      ]);
    },
    [clearPendingChatTimer, roleId, user],
  );

  const sendMessage = React.useCallback(
    (message: string, chatId?: string) => {
      const trimmed = message.trim();
      const targetChatId = chatId ?? selectedConversationId;
      if (!trimmed || !targetChatId) return;
      const targetChat = conversationsRef.current.find(
        (chat) => chat.id === targetChatId,
      );
      const participantId = targetChat?.participants.find(
        (participant) => participant.roleId === roleId,
      )?.id;

      if (!participantId) {
        setError("Unable to send message because your chat participant record was not found.");
        return;
      }

      subscriptionRef.current?.sendMessage({
        chatId: targetChatId,
        participantId,
        content: trimmed,
      });
    },
    [roleId, selectedConversationId],
  );

  const markConversationRead = React.useCallback((chatId: string) => {
    const chat = conversationsRef.current.find(
      (conversation) => conversation.id === chatId,
    );
    const messageIds =
      chat?.messages
        .filter((message) => !message.isRead && message.senderId !== roleId)
        .map((message) => message.id) ?? [];

    setConversations((current) =>
      current.map((chat) =>
        chat.id === chatId ? { ...chat, unreadCount: 0 } : chat,
      ),
    );
    subscriptionRef.current?.markRead(chatId, messageIds);
  }, [roleId]);

  const deleteMessages = React.useCallback(
    (chatId: string, messageIds: string[]) => {
      if (messageIds.length === 0) return;
      setConversations((current) =>
        current.map((chat) =>
          chat.id === chatId
            ? {
                ...chat,
                messages: chat.messages.filter(
                  (message) => !messageIds.includes(message.id),
                ),
              }
            : chat,
        ),
      );
      subscriptionRef.current?.deleteMessages(chatId, messageIds);
    },
    [],
  );

  const selectedConversation = React.useMemo(
    () =>
      conversations.find((chat) => chat.id === selectedConversationId) ?? null,
    [conversations, selectedConversationId],
  );

  const value = React.useMemo(
    () => ({
      conversations,
      selectedConversationId,
      selectedConversation,
      isLoading,
      isConnected,
      error,
      currentRoleId: roleId,
      setSelectedConversationId,
      refresh,
      loadMessages,
      createChat,
      sendMessage,
      markConversationRead,
      deleteMessages,
    }),
    [
      conversations,
      selectedConversationId,
      selectedConversation,
      isLoading,
      isConnected,
      error,
      roleId,
      refresh,
      loadMessages,
      createChat,
      sendMessage,
      markConversationRead,
      deleteMessages,
    ],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
