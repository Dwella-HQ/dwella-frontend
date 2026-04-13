import Head from "next/head";
import * as React from "react";
import type { NextPageWithLayout } from "@/pages/_app";
import { AdminLayout } from "@/components/admin/AdminLayout";

const AdminMessagesPage: NextPageWithLayout = () => {
  const [openNew, setOpenNew] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState("Anya Ezenwa");
  const [draft, setDraft] = React.useState("");
  const [messages, setMessages] = React.useState<string[]>([
    "I wanted to ask about the late fee...",
    "Hello Adam! Your payment is due on Jan 2nd, 2025.",
    "Thank you for the quick response.",
  ]);
  const [pickedUser, setPickedUser] = React.useState("John Doe");

  const handleSend = () => {
    const value = draft.trim();
    if (!value) return;
    setMessages((prev) => [...prev, value]);
    setDraft("");
  };

  return (
    <>
      <Head>
        <title>DWELLA NG · Messages</title>
      </Head>
      <AdminLayout title="Messages">
        <section className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-[#E2E8F0] bg-white p-3">
            <input
              className="h-9 w-[420px] rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-3 text-xs"
              placeholder="Search by user, action type, log ID, or keywords."
            />
            <button
              onClick={() => setOpenNew(true)}
              className="rounded-md bg-[#111827] px-6 py-2 text-xs font-medium text-white"
            >
              New
            </button>
          </div>

          <div className="grid h-[620px] grid-cols-[280px_1fr] gap-3 rounded-lg border border-[#E2E8F0] bg-white p-3">
            <div className="space-y-2 border-r border-[#E2E8F0] pr-3">
              <input
                className="h-9 w-full rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-3 text-xs"
                placeholder="Search messages..."
              />
              {Array.from({ length: 5 }, (_, i) => (
                <div
                  key={i}
                  onClick={() =>
                    setSelectedUser(i === 0 ? "Anya Ezenwa" : "John Mike")
                  }
                  className={`cursor-pointer rounded-md border p-2 text-xs ${selectedUser === (i === 0 ? "Anya Ezenwa" : "John Mike") ? "border-[#BFDBFE] bg-[#EFF6FF]" : "border-[#E2E8F0]"}`}
                >
                  <p className="font-medium">
                    {i === 0 ? "Anya Ezenwa" : "John Mike"}
                  </p>
                  <p className="text-[#64748B]">Are we available? - 4:37 PM</p>
                </div>
              ))}
            </div>
            <div className="flex flex-col">
              <div className="flex-1 rounded-md border border-[#E2E8F0] p-3">
                <p className="mb-2 text-xs font-semibold text-[#0F172A]">
                  {selectedUser}
                </p>
                <div className="space-y-3 text-xs">
                  {messages.map((item, index) => (
                    <div
                      key={`${item}-${index}`}
                      className={`inline-block rounded-md p-2 ${index % 2 === 0 ? "bg-[#F1F5F9]" : "ml-auto block bg-[#0284C7] text-white"}`}
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <input
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  className="h-10 flex-1 rounded-md border border-[#E2E8F0] px-3 text-xs"
                  placeholder="Type your message..."
                />
                <button
                  onClick={handleSend}
                  className="rounded-md bg-[#0284C7] px-4 py-2 text-xs text-white"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </section>

        {openNew ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-lg bg-white p-4 shadow-xl">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold">
                  Select User to start Chat with
                </p>
                <button
                  onClick={() => setOpenNew(false)}
                  className="text-xs text-[#64748B]"
                >
                  Close
                </button>
              </div>
              <input
                className="mb-2 h-9 w-full rounded-md border border-[#E2E8F0] px-3 text-xs"
                placeholder="Account Type      All User"
              />
              <input
                className="mb-2 h-9 w-full rounded-md border border-[#E2E8F0] px-3 text-xs"
                placeholder="Search User"
              />
              <div className="max-h-56 space-y-1 overflow-auto rounded-md border border-[#E2E8F0] p-2 text-xs">
                {Array.from({ length: 8 }, (_, i) => (
                  <label key={i} className="flex items-center gap-2 py-1">
                    <input
                      type="radio"
                      name="chat-user"
                      checked={pickedUser === "John Doe"}
                      onChange={() => setPickedUser("John Doe")}
                    />
                    John Doe
                  </label>
                ))}
              </div>
              <div className="mt-3 flex justify-end gap-2">
                <button
                  onClick={() => setOpenNew(false)}
                  className="rounded-md border border-[#D1D5DB] px-4 py-2 text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setSelectedUser(pickedUser);
                    setOpenNew(false);
                  }}
                  className="rounded-md bg-[#111827] px-4 py-2 text-xs text-white"
                >
                  Start Chat
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </AdminLayout>
    </>
  );
};

export default AdminMessagesPage;
