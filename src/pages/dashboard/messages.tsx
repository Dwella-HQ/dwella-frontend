import Head from "next/head";
import * as React from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Loader2,
  MessageSquare,
  Plus,
  Search,
  Send,
  Smile,
  Trash2,
  X,
} from "lucide-react";

import { DashboardLayout } from "@/components/DashboardLayout";
import { useChat } from "@/contexts/ChatContext";
import { useUser } from "@/contexts/UserContext";
import {
  getChatContacts,
  type ChatContactDTO,
  type ChatConversation,
  type ChatMessage,
} from "@/api/chat";
import type { NextPageWithLayout } from "../_app";

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "DW";

const EMOJI_OPTIONS = [
  "😀",
  "😂",
  "😊",
  "😍",
  "🥳",
  "😎",
  "🙏",
  "👍",
  "👏",
  "🔥",
  "💙",
  "🏠",
  "🔑",
  "✅",
  "💬",
  "✨",
];

const getQueryValue = (value: string | string[] | undefined): string =>
  Array.isArray(value) ? value[0] ?? "" : value ?? "";

type PendingChatMessage = ChatMessage & {
  status: "sending";
};

const ChatBubble = ({
  message,
  currentUserId,
  onDelete,
}: {
  message: ChatMessage | PendingChatMessage;
  currentUserId?: string | number;
  onDelete: (messageId: string) => void;
}) => {
  const isFromMe =
    Boolean(currentUserId) && message.senderId === String(currentUserId);
  const isSending = "status" in message && message.status === "sending";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`flex ${isFromMe ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`group flex max-w-[86%] flex-col sm:max-w-[75%] ${
          isFromMe ? "items-end" : "items-start"
        }`}
      >
        <div
          className={`rounded-lg px-4 py-2.5 ${
            isFromMe
              ? isSending
                ? "bg-brand-main/80 text-white shadow-sm"
                : "bg-brand-main text-white"
              : "border border-gray-200 bg-white text-gray-900"
          }`}
        >
          <p className="text-sm">{message.content}</p>
        </div>
        <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
          {isSending ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Sending</span>
            </>
          ) : (
            <>
              <span>{message.time}</span>
              <button
                type="button"
                onClick={() => onDelete(message.id)}
                className="opacity-0 transition hover:text-red-600 group-hover:opacity-100"
                aria-label="Delete message"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const ConversationList = ({
  conversations,
  selectedConversationId,
  onSelect,
  searchQuery,
  onSearchChange,
  isMobileVisible,
}: {
  conversations: ChatConversation[];
  selectedConversationId: string | null;
  onSelect: (conversationId: string) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  isMobileVisible: boolean;
}) => {
  const filteredConversations = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return conversations;

    return conversations.filter(
      (conversation) =>
        conversation.name.toLowerCase().includes(query) ||
        conversation.subtitle.toLowerCase().includes(query) ||
        conversation.lastMessage.toLowerCase().includes(query),
    );
  }, [conversations, searchQuery]);

  return (
    <div
      className={`${
        isMobileVisible ? "flex" : "hidden"
      } h-full w-full flex-col border-gray-200 bg-white lg:flex lg:w-[350px] lg:border-r`}
    >
      <div className="border-b border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-main focus:outline-none focus:ring-2 focus:ring-brand-main"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length > 0 ? (
          filteredConversations.map((conversation) => (
            <button
              key={conversation.id}
              type="button"
              onClick={() => onSelect(conversation.id)}
              className={`w-full border-b border-gray-200 p-4 text-left transition ${
                selectedConversationId === conversation.id
                  ? "bg-gray-50"
                  : "hover:bg-gray-50"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-500 text-xs font-semibold text-white">
                  {getInitials(conversation.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {conversation.name}
                    </p>
                    <span className="flex-shrink-0 text-xs text-gray-400">
                      {conversation.lastMessageTime}
                    </span>
                  </div>
                  <p className="mb-1 truncate text-xs text-gray-500">
                    {conversation.subtitle}
                  </p>
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-xs text-gray-600">
                      {conversation.lastMessage}
                    </p>
                    {conversation.unreadCount > 0 ? (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1.5 text-xs font-semibold text-white">
                        {conversation.unreadCount}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            </button>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center px-6 py-12">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <MessageSquare className="h-8 w-8 text-gray-400" />
            </div>
            <p className="mb-1 text-sm font-medium text-gray-900">
              No conversations
            </p>
            <p className="text-center text-xs text-gray-500">
              New conversations will appear here when available.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const NewChatPanel = ({
  contacts,
  isLoading,
  error,
  onClose,
  onStart,
}: {
  contacts: ChatContactDTO[];
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
  onStart: (contact: ChatContactDTO) => void;
}) => (
  <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
    <div className="mb-3 flex items-center justify-between gap-3">
      <div>
        <p className="text-sm font-semibold text-gray-900">New chat</p>
        <p className="text-xs text-gray-500">Choose who to message.</p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
        aria-label="Close new chat"
      >
        <X className="h-4 w-4" />
      </button>
    </div>

    {isLoading ? (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-brand-main" />
      </div>
    ) : error ? (
      <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </p>
    ) : contacts.length > 0 ? (
      <div className="max-h-72 space-y-2 overflow-y-auto">
        {contacts.map((contact) => (
          <button
            key={`${contact.role}:${contact.id}`}
            type="button"
            onClick={() => onStart(contact)}
            className="w-full rounded-lg border border-gray-200 p-3 text-left transition hover:border-brand-main hover:bg-brand-main/5"
          >
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium text-gray-900">
                {contact.name}
              </p>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                {contact.roleLabel}
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-500">{contact.subtitle}</p>
            {contact.properties.length > 0 || contact.unit ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {contact.properties.map((property) => (
                  <span
                    key={property}
                    className="rounded-full border border-gray-200 px-2 py-0.5 text-xs text-gray-600"
                  >
                    {property}
                  </span>
                ))}
                {contact.unit ? (
                  <span className="rounded-full border border-gray-200 px-2 py-0.5 text-xs text-gray-600">
                    Unit: {contact.unit}
                  </span>
                ) : null}
              </div>
            ) : null}
          </button>
        ))}
      </div>
    ) : (
      <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">
        No contacts available.
      </p>
    )}
  </div>
);

const MessagesContent = () => {
  const router = useRouter();
  const { user } = useUser();
  const {
    conversations,
    selectedConversation,
    selectedConversationId,
    setSelectedConversationId,
    isLoading,
    isConnected,
    error,
    currentRoleId,
    refresh,
    loadMessages,
    createChat,
    sendMessage,
    markConversationRead,
    deleteMessages,
  } = useChat();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [messageText, setMessageText] = React.useState("");
  const [isNewChatOpen, setIsNewChatOpen] = React.useState(false);
  const [contacts, setContacts] = React.useState<ChatContactDTO[]>([]);
  const [contactsLoading, setContactsLoading] = React.useState(false);
  const [contactsError, setContactsError] = React.useState<string | null>(null);
  const [pendingMessages, setPendingMessages] = React.useState<
    Record<string, PendingChatMessage[]>
  >({});
  const [isEmojiOpen, setIsEmojiOpen] = React.useState(false);
  const [isMobileThreadOpen, setIsMobileThreadOpen] = React.useState(false);
  const messageInputRef = React.useRef<HTMLInputElement | null>(null);
  const didSetInitialChatStateRef = React.useRef(false);
  const processedChatTargetRef = React.useRef("");
  const queryTenantId = getQueryValue(router.query.tenantId);
  const queryRole = getQueryValue(router.query.role);
  const queryRoleId = getQueryValue(router.query.roleId);
  const targetRole = queryTenantId ? "tenant" : queryRoleId ? queryRole : "";
  const targetRoleId = queryTenantId || queryRoleId;
  const hasChatTarget = Boolean(targetRole && targetRoleId);

  const loadContacts = React.useCallback(async () => {
    if (!user?.role || !currentRoleId) {
      setContacts([]);
      setContactsError(
        "Could not load contacts: your chat profile is still loading.",
      );
      return;
    }
    setContactsLoading(true);
    setContactsError(null);

    try {
      const result = await getChatContacts({
        role: user.role,
        roleId: currentRoleId,
        userId: user.id,
      });

      if (result.success) {
        setContacts(result.data);
        setContactsError(null);
      } else {
        setContacts([]);
        setContactsError(`Could not load contacts: ${result.error}`);
      }
    } catch (err) {
      setContacts([]);
      setContactsError(
        err instanceof Error
          ? `Could not load contacts: ${err.message}`
          : "Could not load contacts.",
      );
    } finally {
      setContactsLoading(false);
    }
  }, [currentRoleId, user?.id, user?.role]);

  const openNewChat = React.useCallback(() => {
    setIsNewChatOpen(true);
    void loadContacts();
  }, [loadContacts]);

  const startChat = React.useCallback(
    (contact: ChatContactDTO) => {
      createChat({ role: contact.role, roleId: contact.id });
      setIsMobileThreadOpen(true);
      setIsNewChatOpen(false);
    },
    [createChat],
  );

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  React.useEffect(() => {
    if (!router.isReady || didSetInitialChatStateRef.current) return;
    didSetInitialChatStateRef.current = true;

    if (!hasChatTarget) {
      setSelectedConversationId(null);
      setIsMobileThreadOpen(false);
      setIsEmojiOpen(false);
    }
  }, [hasChatTarget, router.isReady, setSelectedConversationId]);

  React.useEffect(() => {
    if (!router.isReady) return;
    if (!currentRoleId || !isConnected) return;

    if (!targetRole || !targetRoleId) return;
    if (!["tenant", "property_manager", "landlord"].includes(targetRole)) {
      return;
    }
    const targetKey = `${targetRole}:${targetRoleId}`;
    if (processedChatTargetRef.current === targetKey) return;
    processedChatTargetRef.current = targetKey;

    setIsMobileThreadOpen(true);
    createChat({ role: targetRole, roleId: targetRoleId });
  }, [
    createChat,
    currentRoleId,
    isConnected,
    router.isReady,
    targetRole,
    targetRoleId,
  ]);

  React.useEffect(() => {
    if (!selectedConversationId) return;
    loadMessages(selectedConversationId);
    markConversationRead(selectedConversationId);
  }, [loadMessages, markConversationRead, selectedConversationId]);

  React.useEffect(() => {
    if (!selectedConversation || !currentRoleId) return;

    setPendingMessages((current) => {
      const pending = current[selectedConversation.id] ?? [];
      if (pending.length === 0) return current;

      const remaining = pending.filter(
        (message) =>
          !selectedConversation.messages.some(
            (sentMessage) =>
              sentMessage.content === message.content &&
              sentMessage.senderId === currentRoleId,
          ),
      );

      if (remaining.length === pending.length) return current;

      return {
        ...current,
        [selectedConversation.id]: remaining,
      };
    });
  }, [currentRoleId, selectedConversation]);

  const visibleMessages = React.useMemo(() => {
    if (!selectedConversation) return [];
    return [
      ...selectedConversation.messages,
      ...(pendingMessages[selectedConversation.id] ?? []),
    ];
  }, [pendingMessages, selectedConversation]);

  const insertEmoji = React.useCallback((emoji: string) => {
    const input = messageInputRef.current;
    const start = input?.selectionStart ?? messageText.length;
    const end = input?.selectionEnd ?? messageText.length;
    const nextValue =
      messageText.slice(0, start) + emoji + messageText.slice(end);

    setMessageText(nextValue);
    setIsEmojiOpen(false);

    window.requestAnimationFrame(() => {
      input?.focus();
      const nextCursor = start + emoji.length;
      input?.setSelectionRange(nextCursor, nextCursor);
    });
  }, [messageText]);

  const handleSendMessage = React.useCallback(() => {
    const value = messageText.trim();
    if (!value || !selectedConversationId) return;

    const pendingMessage: PendingChatMessage = {
      id: `pending-${Date.now()}`,
      chatId: selectedConversationId,
      participantId: "",
      participantRoleId: currentRoleId ?? "",
      senderId: currentRoleId ?? "",
      receiverId: "",
      content: value,
      time: "",
      isRead: false,
      isDeleted: false,
      createdAt: new Date().toISOString(),
      status: "sending",
    };

    setPendingMessages((current) => ({
      ...current,
      [selectedConversationId]: [
        ...(current[selectedConversationId] ?? []),
        pendingMessage,
      ],
    }));
    sendMessage(value, selectedConversationId);
    setMessageText("");
    setIsEmojiOpen(false);
  }, [currentRoleId, messageText, selectedConversationId, sendMessage]);

  const handleSelectConversation = React.useCallback(
    (conversationId: string) => {
      setSelectedConversationId(conversationId);
      setIsMobileThreadOpen(true);
    },
    [setSelectedConversationId],
  );

  const handleBackToConversations = React.useCallback(() => {
    setIsMobileThreadOpen(false);
    setIsEmojiOpen(false);
  }, []);

  const handleCloseConversation = React.useCallback(() => {
    setSelectedConversationId(null);
    setIsMobileThreadOpen(false);
    setIsEmojiOpen(false);
    setMessageText("");
  }, [setSelectedConversationId]);

  const title =
    user?.role === "tenant"
      ? "Chat with your landlord or property manager"
      : "Communicate with tenants and managers";

  return (
    <section className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
            Messages
          </h1>
          <p className="mt-1 text-xs text-gray-600 sm:text-sm">{title}</p>
          <p className="mt-1 text-xs text-gray-500">
            {isConnected ? "Connected" : "Connecting..."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={refresh}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={openNewChat}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-brand-main px-4 text-sm font-semibold text-white transition hover:bg-brand-main/90"
          >
            <Plus className="h-4 w-4" />
            New Chat
          </button>
        </div>
      </div>

      {isNewChatOpen ? (
        <NewChatPanel
          contacts={contacts}
          isLoading={contactsLoading}
          error={contactsError}
          onClose={() => setIsNewChatOpen(false)}
          onStart={startChat}
        />
      ) : null}

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="flex h-[calc(100dvh-300px)] min-h-[520px] flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm sm:h-[calc(100dvh-280px)] lg:h-[600px] lg:flex-row">
        <ConversationList
          conversations={conversations}
          selectedConversationId={selectedConversationId}
          onSelect={handleSelectConversation}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          isMobileVisible={!isMobileThreadOpen}
        />

        <div
          className={`${
            isMobileThreadOpen ? "flex" : "hidden"
          } min-h-0 flex-1 flex-col lg:flex`}
        >
          {isLoading && conversations.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-brand-main" />
            </div>
          ) : selectedConversation ? (
            <>
              <div className="flex items-center justify-between border-b border-gray-200 p-3 sm:p-4">
                <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={handleBackToConversations}
                    className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 lg:hidden"
                    aria-label="Back to conversations"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 text-xs font-semibold text-white">
                    {getInitials(selectedConversation.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {selectedConversation.name}
                    </p>
                    <p className="truncate text-xs text-gray-500">
                      {selectedConversation.subtitle}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCloseConversation}
                  className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                  aria-label="Close chat"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto bg-gray-50 p-3 sm:p-4">
                {visibleMessages.length > 0 ? (
                  visibleMessages.map((message) => (
                    <ChatBubble
                      key={message.id}
                      message={message}
                      currentUserId={currentRoleId ?? user?.id}
                      onDelete={(messageId) =>
                        deleteMessages(selectedConversation.id, [messageId])
                      }
                    />
                  ))
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-sm text-gray-500">
                      No messages in this conversation yet.
                    </p>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-200 bg-white p-3 sm:p-4">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsEmojiOpen((current) => !current)}
                      className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                      aria-label="Add emoji"
                      aria-expanded={isEmojiOpen}
                    >
                      <Smile className="h-5 w-5" />
                    </button>
                    {isEmojiOpen ? (
                      <div className="absolute bottom-12 left-0 z-20 grid w-56 grid-cols-8 gap-1 rounded-lg border border-gray-200 bg-white p-2 shadow-lg">
                        {EMOJI_OPTIONS.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => insertEmoji(emoji)}
                            className="flex h-7 w-7 items-center justify-center rounded-md text-lg transition hover:bg-gray-100"
                            aria-label={`Insert ${emoji}`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <input
                    ref={messageInputRef}
                    type="text"
                    placeholder="Type your message..."
                    value={messageText}
                    onChange={(event) => setMessageText(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") handleSendMessage();
                    }}
                    className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-main focus:outline-none focus:ring-2 focus:ring-brand-main sm:px-4"
                  />
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSendMessage}
                    disabled={!messageText.trim()}
                    className="rounded-lg bg-gray-900 p-2 text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Send className="h-5 w-5" />
                  </motion.button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center px-6 py-12">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                <MessageSquare className="h-8 w-8 text-gray-400" />
              </div>
              <p className="mb-1 text-sm font-medium text-gray-900">
                No conversation selected
              </p>
              <p className="text-center text-xs text-gray-500">
                Select a conversation from the list to start chatting.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

const MessagesPage: NextPageWithLayout = () => {
  const { isLoading } = useUser();

  if (isLoading) {
    return (
      <>
        <Head>
          <title>Messages | Dwelliva</title>
        </Head>
        <div className="flex min-h-[400px] items-center justify-center">
          <p className="text-gray-500">Loading...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Messages | Dwelliva</title>
      </Head>
      <MessagesContent />
    </>
  );
};

MessagesPage.getLayout = (page: React.ReactElement) => (
  <DashboardLayout>{page}</DashboardLayout>
);

export default MessagesPage;
