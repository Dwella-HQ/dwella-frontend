import Head from "next/head";
import * as React from "react";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/DashboardLayout";
import { NewMessageModal } from "@/components/NewMessageModal";
import {
  Plus,
  Search,
  Paperclip,
  Send,
  MoreVertical,
  MessageSquare,
} from "lucide-react";
import { mockConversations } from "@/data/mockLandlordData";
import type { Conversation, Message } from "@/data/mockLandlordData";
import {
  mockTenantConversations,
  type TenantConversation,
} from "@/data/mockTenantData";
import { useUser } from "@/contexts/UserContext";
import type { NextPageWithLayout } from "../_app";

// Tenant Messages Component
const TenantMessagesPage = () => {
  const [selectedConversationId, setSelectedConversationId] = React.useState<
    string | null
  >(mockTenantConversations[0]?.id || null);
  const [messageText, setMessageText] = React.useState("");

  const selectedConversation = mockTenantConversations.find(
    (conv) => conv.id === selectedConversationId
  );

  const handleSendMessage = () => {
    if (messageText.trim() && selectedConversation) {
      // TODO: Send message to API
      console.log("Sending message:", messageText);
      setMessageText("");
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDateSeparator = (date: string) => {
    if (date.includes("Yesterday")) return "Yesterday";
    if (date.includes("Today")) return "Today";
    return date;
  };

  return (
    <section className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Messages</h1>
        <p className="mt-1 text-xs sm:text-sm text-gray-600">
          Chat with your landlord or property manager
        </p>
      </div>

      {/* Two Panel Layout */}
      <div className="flex flex-col lg:flex-row gap-0 rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden min-h-[600px]">
        {/* Left Panel - Contacts */}
        <div className="flex flex-col w-full lg:w-[300px] border-b lg:border-b-0 lg:border-r border-gray-200 bg-gray-50">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-900">Contacts</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {mockTenantConversations.map((conv) => (
              <motion.div
                key={conv.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => setSelectedConversationId(conv.id)}
                className={`cursor-pointer border-b border-gray-200 p-4 transition ${
                  selectedConversationId === conv.id
                    ? "bg-white"
                    : "hover:bg-white/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative flex-shrink-0">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${conv.avatarColor} text-xs font-semibold text-white`}
                    >
                      {getInitials(conv.contactName)}
                    </div>
                    {conv.isOnline && (
                      <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-green-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {conv.contactName}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      {conv.contactRole === "landlord" ? "Landlord" : "Property Manager"}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Right Panel - Chat */}
        <div className="flex flex-col flex-1">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="flex items-center justify-between border-b border-gray-200 p-4 bg-white">
                <div className="flex items-center gap-3">
                  <div className="relative flex-shrink-0">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${selectedConversation.avatarColor} text-xs font-semibold text-white`}
                    >
                      {getInitials(selectedConversation.contactName)}
                    </div>
                    {selectedConversation.isOnline && (
                      <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-green-500" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                      {getInitials(selectedConversation.contactName)}{" "}
                      {selectedConversation.contactName}
                      <span className="text-xs font-normal text-gray-500">
                        {selectedConversation.isOnline ? "Online" : "Offline"}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {/* Date Separator */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 border-t border-gray-300" />
                  <span className="text-xs text-gray-500">Yesterday</span>
                  <div className="flex-1 border-t border-gray-300" />
                </div>

                {selectedConversation.messages.map((message, index) => {
                  const isFromMe = message.senderId === "tenant";
                  return (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.03 }}
                      className={`flex ${isFromMe ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`flex flex-col ${
                          isFromMe ? "items-end" : "items-start"
                        } max-w-[75%]`}
                      >
                        <div
                          className={`rounded-lg px-4 py-2.5 ${
                            isFromMe
                              ? "bg-brand-main text-white"
                              : "bg-gray-200 text-gray-900"
                          }`}
                        >
                          <p className="text-sm">{message.text}</p>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          {message.timestamp}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Message Input */}
              <div className="border-t border-gray-200 p-4 bg-white">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleSendMessage();
                      }
                    }}
                    className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
                  />
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSendMessage}
                    className="rounded-lg bg-gray-900 px-4 py-2.5 text-white transition hover:bg-gray-800 flex items-center justify-center gap-2"
                  >
                    <Send className="h-4 w-4" />
                    <span className="text-sm font-medium">Send</span>
                  </motion.button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-12 px-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 mb-4">
                <MessageSquare className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-900 mb-1">
                No Conversation Selected
              </p>
              <p className="text-xs text-gray-500 text-center">
                Select a contact from the list to start chatting.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

// Landlord/Manager Messages Page (existing)
const LandlordMessagesPage = () => {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedConversationId, setSelectedConversationId] = React.useState<string | null>(
    mockConversations[0]?.id || null
  );
  const [messageText, setMessageText] = React.useState("");
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  // Filter conversations based on search
  const filteredConversations = mockConversations.filter(
    (conv) =>
      conv.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.propertyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.unit?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get selected conversation
  const selectedConversation = mockConversations.find(
    (conv) => conv.id === selectedConversationId
  );

  const handleSendMessage = () => {
    if (messageText.trim() && selectedConversation) {
      // TODO: Send message to API
      console.log("Sending message:", messageText);
      setMessageText("");
    }
  };

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getPropertyUnitText = (conv: Conversation) => {
    if (conv.propertyName && conv.unit) {
      return `${conv.propertyName} - ${conv.unit}`;
    }
    if (conv.userType === "manager") {
      return "Property Manager";
    }
    return "";
  };

  return (
    <>
      <Head>
        <title>Messages | DWELLA NG</title>
      </Head>

      <section className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Messages</h1>
            <p className="mt-1 text-sm text-gray-600">Communicate with tenants and managers</p>
          </div>
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsModalOpen(true)}
            className="w-[50%] h-10 sm:w-auto rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 flex items-center justify-center gap-2"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Message</span>
            <span className="sm:hidden">New</span>
          </motion.button>
        </div>

        {/* Two Panel Layout */}
        <div className="flex flex-col lg:flex-row gap-0 rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
          {/* Left Panel - Conversation List */}
          <div className="flex flex-col w-full lg:w-[350px] border-b lg:border-b-0 lg:border-r border-gray-200">
            {/* Search */}
            <div className="border-b border-gray-200 p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search messages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
                />
              </div>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto">
              {filteredConversations.length > 0 ? (
                filteredConversations.map((conv, index) => (
                  <motion.div
                    key={conv.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    onClick={() => handleSelectConversation(conv.id)}
                    className={`cursor-pointer border-b border-gray-200 p-4 transition ${
                      selectedConversationId === conv.id ? "bg-gray-50" : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 text-xs font-semibold text-white flex-shrink-0">
                        {getInitials(conv.userName)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {conv.userName}
                          </p>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-xs text-gray-400">
                              {conv.lastMessageTime}
                            </span>
                            {conv.unreadCount > 0 && (
                              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
                                {conv.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 truncate mb-1">
                          {getPropertyUnitText(conv)}
                        </p>
                        <p className="text-xs text-gray-600 truncate">
                          {conv.lastMessage}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 px-6">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 mb-4">
                    <MessageSquare className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-900 mb-1">No Conversations</p>
                  <p className="text-xs text-gray-500 text-center">
                    Start a new conversation to get started.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Active Chat */}
          <div className="flex flex-col flex-1 min-h-[500px] lg:min-h-[600px]">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="flex items-center justify-between border-b border-gray-200 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 text-xs font-semibold text-white">
                      {getInitials(selectedConversation.userName)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {selectedConversation.userName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {getPropertyUnitText(selectedConversation)}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
                  >
                    <MoreVertical className="h-5 w-5" />
                  </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {[...selectedConversation.messages].reverse().map((message, index) => {
                    const isFromMe = message.senderId === "landlord";
                    return (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: index * 0.05 }}
                        className={`flex ${isFromMe ? "justify-end" : "justify-start"}`}
                      >
                        <div className={`flex flex-col ${isFromMe ? "items-end" : "items-start"} max-w-[70%]`}>
                          <div
                            className={`rounded-lg px-4 py-2.5 ${
                              isFromMe
                                ? "bg-gray-200 text-gray-900"
                                : "bg-white border border-gray-200 text-gray-900"
                            }`}
                          >
                            <p className="text-sm">{message.text}</p>
                          </div>
                          <p className="mt-1 text-xs text-gray-500">
                            {message.timestamp}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Message Input */}
                <div className="border-t border-gray-200 p-4">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
                    >
                      <Paperclip className="h-5 w-5" />
                    </button>
                    <input
                      type="text"
                      placeholder="Type your message..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          handleSendMessage();
                        }
                      }}
                      className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
                    />
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleSendMessage}
                      className="rounded-lg bg-gray-900 p-2 text-white transition hover:bg-gray-800"
                    >
                      <Send className="h-5 w-5" />
                    </motion.button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-12 px-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 mb-4">
                  <MessageSquare className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-900 mb-1">No Conversation Selected</p>
                <p className="text-xs text-gray-500 text-center">
                  Select a conversation from the list to start chatting.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <NewMessageModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        conversations={mockConversations}
        onSelectConversation={handleSelectConversation}
      />
    </>
  );
};

// Main Messages Page Component
const MessagesPage: NextPageWithLayout = () => {
  const { user, isLoading } = useUser();

  // Show loading state while checking user
  if (isLoading) {
    return (
      <>
        <Head>
          <title>Messages | DWELLA NG</title>
        </Head>
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-gray-500">Loading...</p>
        </div>
      </>
    );
  }

  // Determine which view to show based on role
  const renderMessagesPage = () => {
    if (!user) {
      return (
        <div className="text-center py-12 text-gray-500">
          <p>Please log in to view messages</p>
        </div>
      );
    }

    if (user.role === "tenant") {
      return <TenantMessagesPage />;
    } else {
      return <LandlordMessagesPage />;
    }
  };

  return (
    <>
      <Head>
        <title>Messages | DWELLA NG</title>
      </Head>
      {renderMessagesPage()}
    </>
  );
};

MessagesPage.getLayout = (page: React.ReactElement) => (
  <DashboardLayout>{page}</DashboardLayout>
);

export default MessagesPage;
