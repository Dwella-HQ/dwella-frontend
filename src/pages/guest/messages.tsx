import * as React from "react";
import Head from "next/head";
import {
  MoreVertical,
  Paperclip,
  Search,
  Send,
} from "lucide-react";
import { GuestLayout } from "@/components/guest/GuestLayout";
import type { NextPageWithLayout } from "../_app";

type MockThread = {
  id: string;
  name: string;
  role: string;
  preview: string;
  time: string;
  unread?: number;
  property?: string;
};

type MockMessage = {
  id: string;
  fromMe: boolean;
  text: string;
  time: string;
};

const THREADS: MockThread[] = [
  {
    id: "1",
    name: "Ada Emmanuel",
    role: "Landlord",
    preview: "The unit is available from next month...",
    time: "10 min ago",
    unread: 2,
    property: "Harmony Court - A101",
  },
  {
    id: "2",
    name: "James Okoro",
    role: "Property Manager",
    preview: "I've shared the viewing schedule.",
    time: "2 hours ago",
    unread: 1,
    property: "Palm Estate - C305",
  },
  {
    id: "3",
    name: "Sarah Okon",
    role: "Landlord",
    preview: "Thanks for your interest!",
    time: "Yesterday",
    property: "Greenfield Residences",
  },
  {
    id: "4",
    name: "Musa Ahmed",
    role: "Property Manager",
    preview: "Documents received, we'll review shortly.",
    time: "2 days ago",
    property: "Palm Estate - C305",
  },
];

const MESSAGES: Record<string, MockMessage[]> = {
  "1": [
    {
      id: "m1",
      fromMe: false,
      text: "Hi! Thanks for reaching out about Harmony Court.",
      time: "9:28 AM",
    },
    {
      id: "m2",
      fromMe: false,
      text: "The unit is available from next month. Would you like to schedule a viewing?",
      time: "9:30 AM",
    },
    {
      id: "m3",
      fromMe: true,
      text: "Yes please — Saturday afternoon works for me.",
      time: "9:32 AM",
    },
  ],
  "2": [
    {
      id: "m1",
      fromMe: false,
      text: "I've shared the viewing schedule for Palm Estate.",
      time: "11:00 AM",
    },
  ],
  "3": [
    {
      id: "m1",
      fromMe: false,
      text: "Thanks for your interest!",
      time: "4:12 PM",
    },
  ],
  "4": [
    {
      id: "m1",
      fromMe: false,
      text: "Documents received, we'll review shortly.",
      time: "1:05 PM",
    },
  ],
};

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

const GuestMessagesPage: NextPageWithLayout = () => {
  const [query, setQuery] = React.useState("");
  const [activeId, setActiveId] = React.useState(THREADS[0].id);
  const [draft, setDraft] = React.useState("");
  const [messagesByThread, setMessagesByThread] = React.useState(MESSAGES);

  const filteredThreads = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return THREADS;
    return THREADS.filter(
      (thread) =>
        thread.name.toLowerCase().includes(q) ||
        thread.role.toLowerCase().includes(q) ||
        thread.preview.toLowerCase().includes(q),
    );
  }, [query]);

  const activeThread =
    THREADS.find((thread) => thread.id === activeId) ?? THREADS[0];
  const messages = messagesByThread[activeId] ?? [];

  const handleSend = React.useCallback(() => {
    const text = draft.trim();
    if (!text) return;
    const next: MockMessage = {
      id: `local_${Date.now()}`,
      fromMe: true,
      text,
      time: new Date().toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      }),
    };
    setMessagesByThread((prev) => ({
      ...prev,
      [activeId]: [...(prev[activeId] ?? []), next],
    }));
    setDraft("");
  }, [activeId, draft]);

  return (
    <>
      <Head>
        <title>Messages | Dwelliva</title>
      </Head>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
          <p className="mt-1 text-sm text-gray-600">
            Communicate with Property owners and Managers
          </p>
        </div>

        <div className="grid min-h-[70vh] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm lg:grid-cols-[340px_1fr]">
          <aside className="border-b border-gray-200 lg:border-b-0 lg:border-r">
            <div className="border-b border-gray-100 p-4">
              <div className="flex items-center gap-2 rounded-xl bg-gray-100 px-3 py-2.5">
                <Search className="h-4 w-4 text-gray-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search messages..."
                  className="w-full bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
                />
              </div>
            </div>

            <ul className="max-h-[58vh] overflow-y-auto">
              {filteredThreads.map((thread) => {
                const active = thread.id === activeId;
                return (
                  <li key={thread.id}>
                    <button
                      type="button"
                      onClick={() => setActiveId(thread.id)}
                      className={`relative flex w-full gap-3 px-4 py-3.5 text-left transition ${
                        active
                          ? "bg-gray-100 before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-[var(--brand-main)]"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sm font-semibold text-[var(--brand-main)]">
                        {initials(thread.name)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-start justify-between gap-2">
                          <span>
                            <span className="block truncate text-sm font-semibold text-gray-900">
                              {thread.name}
                            </span>
                            <span className="block truncate text-xs text-gray-500">
                              {thread.role}
                            </span>
                          </span>
                          <span className="shrink-0 text-[11px] text-gray-400">
                            {thread.time}
                          </span>
                        </span>
                        <span className="mt-1 flex items-center justify-between gap-2">
                          <span className="truncate text-xs text-gray-600">
                            {thread.preview}
                          </span>
                          {thread.unread ? (
                            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--brand-main)] px-1.5 text-[10px] font-semibold text-white">
                              {thread.unread}
                            </span>
                          ) : null}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </aside>

          <section className="flex min-h-[50vh] flex-col">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-sky-100 text-sm font-semibold text-[var(--brand-main)]">
                  {initials(activeThread.name)}
                </span>
                <div>
                  <p className="font-semibold text-gray-900">
                    {activeThread.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {activeThread.property || activeThread.role}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-50 hover:text-gray-600"
                aria-label="Conversation options"
              >
                <MoreVertical className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto bg-[#F9FAFB] px-5 py-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.fromMe ? "justify-end" : "justify-start"}`}
                >
                  <div className="max-w-[75%]">
                    <div
                      className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                        message.fromMe
                          ? "bg-[var(--brand-main)] text-white"
                          : "bg-gray-200 text-gray-900"
                      }`}
                    >
                      {message.text}
                    </div>
                    <p
                      className={`mt-1 text-[11px] text-gray-400 ${
                        message.fromMe ? "text-right" : "text-left"
                      }`}
                    >
                      {message.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3 border-t border-gray-100 px-4 py-3">
              <button
                type="button"
                className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-50 hover:text-gray-600"
                aria-label="Attach file"
              >
                <Paperclip className="h-5 w-5" />
              </button>
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Type your message..."
                className="h-11 flex-1 rounded-full border border-gray-200 bg-white px-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--brand-main)]"
              />
              <button
                type="button"
                onClick={handleSend}
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--brand-main)] text-white transition hover:opacity-90"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </section>
        </div>
      </div>
    </>
  );
};

GuestMessagesPage.getLayout = (page) => <GuestLayout>{page}</GuestLayout>;

export default GuestMessagesPage;
