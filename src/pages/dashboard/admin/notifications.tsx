import Head from "next/head";
import * as React from "react";
import type { NextPageWithLayout } from "@/pages/_app";
import { AdminLayout } from "@/components/admin/AdminLayout";

const AdminNotificationsPage: NextPageWithLayout = () => {
  const [showCompose, setShowCompose] = React.useState(false);
  const [selectedNotification, setSelectedNotification] =
    React.useState("System Maintenance");
  const [subject, setSubject] = React.useState("");
  const [content, setContent] = React.useState("");
  const [items, setItems] = React.useState([
    {
      title: "System Maintenance",
      time: "2 days ago",
      body: "System would be offline for routine maintenance for 3 hours, we would send a follow-up email when this is fixed. Please bear with us.",
    },
    {
      title: "Routine Maintenance",
      time: "1 week ago",
      body: "Routine maintenance has been scheduled to improve platform reliability and performance.",
    },
  ]);

  const handleCreate = () => {
    const title = subject.trim();
    if (!title) return;
    setItems((prev) => [{ title, time: "Just now", body: content }, ...prev]);
    setSelectedNotification(title);
    setSubject("");
    setContent("");
    setShowCompose(false);
  };
  const selectedItem =
    items.find((item) => item.title === selectedNotification) ?? items[0];
  return (
    <>
      <Head>
        <title>DWELLA NG · Notifications</title>
      </Head>
      <AdminLayout title="Notifications">
        <section className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-[#E2E8F0] bg-white p-3">
            <input
              className="h-9 w-[420px] rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-3 text-xs"
              placeholder="Search by user, action type, log ID, or keywords."
            />
            <button
              onClick={() => setShowCompose((v) => !v)}
              className="rounded-md bg-[#111827] px-6 py-2 text-xs font-medium text-white"
            >
              New
            </button>
          </div>
          <div className="grid h-[620px] grid-cols-[320px_1fr] gap-3 rounded-lg border border-[#E2E8F0] bg-white p-3">
            <div className="space-y-2 border-r border-[#E2E8F0] pr-3">
              <input
                className="h-9 w-full rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-3 text-xs"
                placeholder="Search message..."
              />
              {items.map((item, i) => (
                <div
                  key={`${item.title}-${i}`}
                  onClick={() => setSelectedNotification(item.title)}
                  className={`cursor-pointer rounded-md border p-2 text-xs ${selectedNotification === item.title ? "border-[#BFDBFE] bg-[#EFF6FF]" : "border-[#E2E8F0]"}`}
                >
                  <p className="font-medium">{item.title}</p>
                  <p className="text-[#64748B]">{item.time}</p>
                </div>
              ))}
            </div>
            {showCompose ? (
              <div className="rounded-md border border-[#E2E8F0] p-4">
                <p className="mb-4 text-sm font-semibold">
                  Create New Notification
                </p>
                <div className="space-y-3 text-xs">
                  <input
                    value={subject}
                    onChange={(event) => setSubject(event.target.value)}
                    className="h-10 w-full rounded-md border border-[#E2E8F0] px-3"
                    placeholder="Subject"
                  />
                  <input
                    className="h-10 w-full rounded-md border border-[#E2E8F0] px-3"
                    placeholder="Recipients      All Users"
                  />
                  <textarea
                    value={content}
                    onChange={(event) => setContent(event.target.value)}
                    className="h-56 w-full rounded-md border border-[#E2E8F0] p-3"
                    placeholder="Write your announcement here..."
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setShowCompose(false)}
                      className="rounded-md px-4 py-2"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreate}
                      className="rounded-md bg-[#111827] px-4 py-2 text-white"
                    >
                      Send Notification
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-md border border-[#E2E8F0] p-4">
                <p className="text-sm font-semibold">{selectedNotification}</p>
                <p className="mt-3 text-sm text-[#475569]">
                  {selectedItem?.body || "No notification body available."}
                </p>
                <div className="mt-8 grid grid-cols-3 gap-3 text-center">
                  <div className="rounded bg-[#F8FAFC] p-2">
                    <p className="text-lg font-semibold">24</p>
                    <p className="text-[11px] text-[#64748B]">Engagement</p>
                  </div>
                  <div className="rounded bg-[#F8FAFC] p-2">
                    <p className="text-lg font-semibold">32</p>
                    <p className="text-[11px] text-[#64748B]">Read Responses</p>
                  </div>
                  <div className="rounded bg-[#F8FAFC] p-2">
                    <p className="text-lg font-semibold">75%</p>
                    <p className="text-[11px] text-[#64748B]">Open Rate</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </AdminLayout>
    </>
  );
};

export default AdminNotificationsPage;
