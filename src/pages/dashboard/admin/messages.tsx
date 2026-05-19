import Head from "next/head";
import * as React from "react";
import { Loader2, Search, Send, Trash2 } from "lucide-react";
import type { NextPageWithLayout } from "@/pages/_app";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useChat } from "@/contexts/ChatContext";
import { useUser } from "@/contexts/UserContext";

const AdminMessagesPage: NextPageWithLayout = () => {
  const { user } = useUser();
  const {
    conversations,
    selectedConversation,
    selectedConversationId,
    setSelectedConversationId,
    isLoading,
    isConnected,
    error,
    refresh,
    loadMessages,
    sendMessage,
    markConversationRead,
    deleteMessages,
  } = useChat();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [draft, setDraft] = React.useState("");

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  React.useEffect(() => {
    if (!selectedConversationId) return;
    loadMessages(selectedConversationId);
    markConversationRead(selectedConversationId);
  }, [loadMessages, markConversationRead, selectedConversationId]);

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

  const handleSend = React.useCallback(() => {
    if (!draft.trim() || !selectedConversationId) return;
    sendMessage(draft, selectedConversationId);
    setDraft("");
  }, [draft, selectedConversationId, sendMessage]);

  return (
    <>
      <Head>
        <title>DWELLA NG · Messages</title>
      </Head>
      <AdminLayout title="Messages">
        <section className="w-full min-w-0 space-y-4">
          <div className="flex flex-col gap-3 rounded-lg border border-[#E2E8F0] bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex h-9 w-full min-w-0 items-center gap-2 rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-3">
              <Search className="h-3.5 w-3.5 shrink-0 text-[#64748B]" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="w-full min-w-0 bg-transparent text-xs outline-none placeholder:text-[#94A3B8]"
                placeholder="Search messages"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs text-[#64748B]">
                {isConnected ? "Connected" : "Connecting..."}
              </span>
              <button
                type="button"
                onClick={refresh}
                className="rounded-md bg-[#111827] px-6 py-2 text-xs font-medium text-white"
              >
                Refresh
              </button>
            </div>
          </div>

          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="flex flex-col gap-3 rounded-lg border border-[#E2E8F0] bg-white p-3 lg:grid lg:h-[620px] lg:grid-cols-[300px_1fr]">
            <div className="max-h-[min(40vh,320px)] space-y-2 overflow-y-auto border-b border-[#E2E8F0] pb-3 lg:max-h-none lg:border-b-0 lg:border-r lg:pb-0 lg:pr-3">
              {isLoading && conversations.length === 0 ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-[#1E66FF]" />
                </div>
              ) : filteredConversations.length === 0 ? (
                <p className="rounded-md bg-[#F8FAFC] p-3 text-xs text-[#64748B]">
                  No conversations found.
                </p>
              ) : (
                filteredConversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => setSelectedConversationId(conversation.id)}
                    className={`w-full rounded-md border p-2 text-left text-xs ${
                      selectedConversationId === conversation.id
                        ? "border-[#BFDBFE] bg-[#EFF6FF]"
                        : "border-[#E2E8F0]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium">{conversation.name}</p>
                      {conversation.unreadCount > 0 ? (
                        <span className="rounded-full bg-[#1E66FF] px-1.5 py-0.5 text-[10px] font-semibold text-white">
                          {conversation.unreadCount}
                        </span>
                      ) : null}
                    </div>
                    <p className="text-[#64748B]">{conversation.subtitle}</p>
                    <p className="truncate text-[#475569]">
                      {conversation.lastMessage}
                    </p>
                  </button>
                ))
              )}
            </div>

            <div className="flex min-h-[240px] min-w-0 w-full flex-col">
              {selectedConversation ? (
                <>
                  <div className="flex-1 overflow-y-auto rounded-md border border-[#E2E8F0] p-3">
                    <div className="mb-3 border-b border-[#E2E8F0] pb-3">
                      <p className="text-sm font-semibold text-[#0F172A]">
                        {selectedConversation.name}
                      </p>
                      <p className="text-xs text-[#64748B]">
                        {selectedConversation.subtitle}
                      </p>
                    </div>
                    <div className="space-y-3 text-xs">
                      {selectedConversation.messages.length > 0 ? (
                        selectedConversation.messages.map((message) => {
                          const isMine = message.senderId === String(user?.id);
                          return (
                            <div
                              key={message.id}
                              className={`group flex ${
                                isMine ? "justify-end" : "justify-start"
                              }`}
                            >
                              <div>
                                <div
                                  className={`max-w-xl rounded-md p-2 ${
                                    isMine
                                      ? "bg-[#0284C7] text-white"
                                      : "bg-[#F1F5F9] text-[#0F172A]"
                                  }`}
                                >
                                  {message.content}
                                </div>
                                <div className="mt-1 flex items-center gap-2 text-[10px] text-[#64748B]">
                                  <span>{message.time}</span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      deleteMessages(selectedConversation.id, [
                                        message.id,
                                      ])
                                    }
                                    className="opacity-0 transition hover:text-red-600 group-hover:opacity-100"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p className="py-12 text-center text-[#64748B]">
                          No messages in this conversation yet.
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <input
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") handleSend();
                      }}
                      className="h-10 flex-1 rounded-md border border-[#E2E8F0] px-3 text-xs"
                      placeholder="Type your message..."
                    />
                    <button
                      type="button"
                      onClick={handleSend}
                      disabled={!draft.trim()}
                      className="inline-flex items-center gap-2 rounded-md bg-[#0284C7] px-4 py-2 text-xs text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Send className="h-3.5 w-3.5" />
                      Send
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex h-full items-center justify-center rounded-md border border-[#E2E8F0] p-4">
                  <p className="text-sm text-[#64748B]">
                    Select a conversation to view messages.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      </AdminLayout>
    </>
  );
};

export default AdminMessagesPage;
