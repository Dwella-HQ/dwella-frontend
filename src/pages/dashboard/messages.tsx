import Head from "next/head";
import * as React from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import {
  Loader2,
  MessageSquare,
  MoreVertical,
  Paperclip,
  Plus,
  Search,
  Send,
  Trash2,
  X,
} from "lucide-react";

import { getLandlords } from "@/api/landlord";
import { getPropertyManagers } from "@/api/property-managers";
import { getTenants } from "@/api/tenants";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useChat } from "@/contexts/ChatContext";
import { useUser } from "@/contexts/UserContext";
import type { ChatConversation, ChatMessage } from "@/api/chat";
import type { NextPageWithLayout } from "../_app";

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "DW";

const ChatBubble = ({
  message,
  currentUserId,
  onDelete,
}: {
  message: ChatMessage;
  currentUserId?: string | number;
  onDelete: (messageId: string) => void;
}) => {
  const isFromMe =
    Boolean(currentUserId) && message.senderId === String(currentUserId);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isFromMe ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`group flex max-w-[75%] flex-col ${
          isFromMe ? "items-end" : "items-start"
        }`}
      >
        <div
          className={`rounded-lg px-4 py-2.5 ${
            isFromMe
              ? "bg-brand-main text-white"
              : "border border-gray-200 bg-white text-gray-900"
          }`}
        >
          <p className="text-sm">{message.content}</p>
        </div>
        <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
          <span>{message.time}</span>
          <button
            type="button"
            onClick={() => onDelete(message.id)}
            className="opacity-0 transition hover:text-red-600 group-hover:opacity-100"
            aria-label="Delete message"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
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
}: {
  conversations: ChatConversation[];
  selectedConversationId: string | null;
  onSelect: (conversationId: string) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
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
    <div className="flex w-full flex-col border-b border-gray-200 bg-white lg:w-[350px] lg:border-b-0 lg:border-r">
      <div className="border-b border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-main"
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

type ChatContact = {
  id: string;
  role: "tenant" | "property_manager" | "landlord";
  name: string;
  subtitle: string;
};

const NewChatPanel = ({
  contacts,
  isLoading,
  onClose,
  onStart,
}: {
  contacts: ChatContact[];
  isLoading: boolean;
  onClose: () => void;
  onStart: (contact: ChatContact) => void;
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
    ) : contacts.length > 0 ? (
      <div className="max-h-72 space-y-2 overflow-y-auto">
        {contacts.map((contact) => (
          <button
            key={`${contact.role}:${contact.id}`}
            type="button"
            onClick={() => onStart(contact)}
            className="w-full rounded-lg border border-gray-200 p-3 text-left transition hover:border-brand-main hover:bg-brand-main/5"
          >
            <p className="text-sm font-medium text-gray-900">{contact.name}</p>
            <p className="mt-1 text-xs text-gray-500">{contact.subtitle}</p>
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
  const [contacts, setContacts] = React.useState<ChatContact[]>([]);
  const [contactsLoading, setContactsLoading] = React.useState(false);

  const loadContacts = React.useCallback(async () => {
    if (!user?.role) return;
    setContactsLoading(true);

    const nextContacts: ChatContact[] = [];

    if (user.role !== "tenant") {
      const tenants = await getTenants({ limit: 100 });
      if (tenants.success) {
        nextContacts.push(
          ...tenants.data.map((tenant) => ({
            id: String(tenant.id),
            role: "tenant" as const,
            name: tenant.fullName || tenant.name || tenant.email,
            subtitle: tenant.email || tenant.phoneNumber || tenant.phone || "Tenant",
          })),
        );
      }
    }

    if (user.role !== "property_manager") {
      const managers = await getPropertyManagers();
      if (managers.success) {
        nextContacts.push(
          ...managers.data.map((manager) => ({
            id: String(manager.id),
            role: "property_manager" as const,
            name:
              manager.fullName ||
              manager.name ||
              manager.user?.fullName ||
              manager.email ||
              manager.user?.email ||
              "Property Manager",
            subtitle:
              manager.email ||
              manager.user?.email ||
              manager.phone ||
              manager.user?.phoneNumber ||
              "Property Manager",
          })),
        );
      }
    }

    if (user.role !== "landlord") {
      const landlords = await getLandlords();
      if (landlords.success) {
        nextContacts.push(
          ...landlords.data.map((landlord) => ({
            id: landlord.id,
            role: "landlord" as const,
            name:
              landlord.landLordName ||
              landlord.businessName ||
              landlord.user?.fullName ||
              landlord.businessEmail ||
              "Landlord",
            subtitle:
              landlord.businessEmail ||
              landlord.user?.email ||
              landlord.businessPhoneNumber ||
              "Landlord",
          })),
        );
      }
    }

    setContacts(nextContacts);
    setContactsLoading(false);
  }, [user?.role]);

  const openNewChat = React.useCallback(() => {
    setIsNewChatOpen(true);
    void loadContacts();
  }, [loadContacts]);

  const startChat = React.useCallback(
    (contact: ChatContact) => {
      createChat({ role: contact.role, roleId: contact.id });
      setIsNewChatOpen(false);
    },
    [createChat],
  );

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  React.useEffect(() => {
    if (!router.isReady) return;
    const role = typeof router.query.role === "string" ? router.query.role : "";
    const roleId =
      typeof router.query.roleId === "string" ? router.query.roleId : "";

    if (!role || !roleId) return;
    if (!["tenant", "property_manager", "landlord"].includes(role)) return;

    createChat({ role, roleId });
    void router.replace("/dashboard/messages", undefined, { shallow: true });
  }, [createChat, router]);

  React.useEffect(() => {
    if (!selectedConversationId) return;
    loadMessages(selectedConversationId);
    markConversationRead(selectedConversationId);
  }, [loadMessages, markConversationRead, selectedConversationId]);

  const handleSendMessage = React.useCallback(() => {
    const value = messageText.trim();
    if (!value || !selectedConversationId) return;

    sendMessage(value, selectedConversationId);
    setMessageText("");
  }, [messageText, selectedConversationId, sendMessage]);

  const title =
    user?.role === "tenant"
      ? "Chat with your landlord or property manager"
      : "Communicate with tenants and managers";

  return (
    <section className="space-y-6">
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
          onClose={() => setIsNewChatOpen(false)}
          onStart={startChat}
        />
      ) : null}

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="flex min-h-[600px] flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm lg:flex-row">
        <ConversationList
          conversations={conversations}
          selectedConversationId={selectedConversationId}
          onSelect={setSelectedConversationId}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        <div className="flex min-h-[500px] flex-1 flex-col lg:min-h-[600px]">
          {isLoading && conversations.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-brand-main" />
            </div>
          ) : selectedConversation ? (
            <>
              <div className="flex items-center justify-between border-b border-gray-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 text-xs font-semibold text-white">
                    {getInitials(selectedConversation.name)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedConversation.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {selectedConversation.subtitle}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                >
                  <MoreVertical className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto bg-gray-50 p-4">
                {selectedConversation.messages.length > 0 ? (
                  selectedConversation.messages.map((message) => (
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

              <div className="border-t border-gray-200 bg-white p-4">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                  >
                    <Paperclip className="h-5 w-5" />
                  </button>
                  <input
                    type="text"
                    placeholder="Type your message..."
                    value={messageText}
                    onChange={(event) => setMessageText(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") handleSendMessage();
                    }}
                    className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-main"
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
