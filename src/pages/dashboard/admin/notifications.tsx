import Head from "next/head";
import * as React from "react";
import { Loader2, Search, Trash2 } from "lucide-react";
import type { NextPageWithLayout } from "@/pages/_app";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useNotifications } from "@/contexts/NotificationsContext";
import type { Notification } from "@/api/notifications";

const AdminNotificationsPage: NextPageWithLayout = () => {
  const {
    notifications,
    isLoading,
    error,
    refresh,
    markAsRead,
    deleteNotification,
  } = useNotifications();
  const [selectedNotification, setSelectedNotification] =
    React.useState<Notification | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  React.useEffect(() => {
    setSelectedNotification((prev) => {
      if (!notifications.length) return null;
      if (!prev) return notifications[0];
      return (
        notifications.find((notification) => notification.id === prev.id) ??
        notifications[0]
      );
    });
  }, [notifications]);

  const filteredNotifications = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return notifications;
    return notifications.filter(
      (notification) =>
        notification.title.toLowerCase().includes(query) ||
        notification.description.toLowerCase().includes(query) ||
        notification.fullDescription.toLowerCase().includes(query),
    );
  }, [notifications, searchQuery]);

  const handleSelectNotification = React.useCallback(
    (notification: Notification) => {
      setSelectedNotification(notification);
      if (!notification.isRead) {
        markAsRead([notification.apiId]);
      }
    },
    [markAsRead],
  );

  const handleDeleteNotification = React.useCallback(() => {
    if (!selectedNotification) return;
    const confirmed = window.confirm(
      "Delete this notification? This action cannot be undone.",
    );
    if (!confirmed) return;
    deleteNotification(selectedNotification.apiId);
    setSelectedNotification(null);
  }, [deleteNotification, selectedNotification]);

  return (
    <>
      <Head>
        <title>DWELLA NG · Notifications</title>
      </Head>
      <AdminLayout title="Notifications">
        <section className="w-full min-w-0 space-y-4">
          <div className="flex flex-col gap-3 rounded-lg border border-[#E2E8F0] bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex h-9 w-full min-w-0 items-center gap-2 rounded-md border border-[#E2E8F0] bg-white px-3">
              <Search className="h-3.5 w-3.5 shrink-0 text-[#64748B]" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="w-full min-w-0 bg-white text-xs text-[#0F172A] outline-none placeholder:text-[#94A3B8]"
                placeholder="Search notifications"
              />
            </div>
            <button
              type="button"
              onClick={refresh}
              className="shrink-0 rounded-md bg-[#111827] px-6 py-2 text-xs font-medium text-white"
            >
              Refresh
            </button>
          </div>
          <div className="flex flex-col gap-3 rounded-lg border border-[#E2E8F0] bg-white p-3 lg:grid lg:h-[620px] lg:grid-cols-[320px_1fr]">
            <div className="max-h-[min(40vh,320px)] space-y-2 overflow-y-auto border-b border-[#E2E8F0] pb-3 lg:max-h-none lg:border-b-0 lg:border-r lg:pb-0 lg:pr-3">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-[#1E66FF]" />
                </div>
              ) : error ? (
                <p className="rounded-md bg-red-50 p-3 text-xs text-red-700">
                  {error}
                </p>
              ) : filteredNotifications.length === 0 ? (
                <p className="rounded-md bg-[#F8FAFC] p-3 text-xs text-[#64748B]">
                  No notifications found.
                </p>
              ) : (
                filteredNotifications.map((notification) => (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => handleSelectNotification(notification)}
                    className={`w-full cursor-pointer rounded-md border p-2 text-left text-xs ${
                      selectedNotification?.id === notification.id
                        ? "border-[#BFDBFE] bg-[#EFF6FF]"
                        : "border-[#E2E8F0]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium">{notification.title}</p>
                      {!notification.isRead ? (
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#1E66FF]" />
                      ) : null}
                    </div>
                    <p className="text-[#64748B]">{notification.time}</p>
                  </button>
                ))
              )}
            </div>
            <div className="min-w-0 w-full">
              {selectedNotification ? (
                <div className="rounded-md border border-[#E2E8F0] p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold">
                        {selectedNotification.title}
                      </p>
                      <p className="mt-1 text-xs text-[#64748B]">
                        {selectedNotification.dateTime}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleDeleteNotification}
                      className="inline-flex items-center gap-1.5 rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[#475569]">
                    {selectedNotification.fullDescription}
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-center rounded-md border border-[#E2E8F0] p-4">
                  <p className="text-sm text-[#64748B]">
                    Select a notification to view details.
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

export default AdminNotificationsPage;
