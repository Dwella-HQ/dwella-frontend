import Head from "next/head";
import * as React from "react";
import { useRouter } from "next/router";
import { Search, X, Loader2, Trash2 } from "lucide-react";

import { DashboardLayout } from "@/components/DashboardLayout";
import type { Notification } from "@/api/notifications";
import { useProfile } from "@/contexts/ProfileContext";
import { useNotifications } from "@/contexts/NotificationsContext";

import type { NextPageWithLayout } from "../_app";

type NotificationFilter = "all" | "unread";

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const NotificationsPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { refetchProfile } = useProfile();
  const {
    notifications,
    isLoading,
    error,
    refresh,
    markAsRead,
    deleteNotification,
  } = useNotifications();
  const [filter, setFilter] = React.useState<NotificationFilter>("all");
  const [selectedNotification, setSelectedNotification] = React.useState<Notification | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");

  // Get notification ID from query params
  const notificationIdFromQuery = React.useMemo(() => {
    const id = router.query.id;
    return id ? String(id) : null;
  }, [router.query.id]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  React.useEffect(() => {
    if (!notificationIdFromQuery) return;

    const notificationToSelect = notifications.find(
      (notification) => notification.apiId === notificationIdFromQuery,
    );
    if (!notificationToSelect) return;

    setSelectedNotification(notificationToSelect);
    void router.replace("/dashboard/notifications", undefined, {
      shallow: true,
    });
  }, [notificationIdFromQuery, notifications, router]);

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

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const filteredNotifications = React.useMemo(() => {
    let filtered = notifications;

    if (filter === "unread") {
      filtered = filtered.filter((n) => !n.isRead);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (n) =>
          n.sender.toLowerCase().includes(query) ||
          n.title.toLowerCase().includes(query) ||
          n.description.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [notifications, filter, searchQuery]);

  const handleNotificationClick = React.useCallback((notification: Notification) => {
    setSelectedNotification(notification);

    if (!notification.isRead) {
      const updatedNotification = { ...notification, isRead: true };
      setSelectedNotification(updatedNotification);
      markAsRead([notification.apiId]);
      void refetchProfile();
    }
  }, [markAsRead, refetchProfile]);

  const handleDeleteNotification = React.useCallback(() => {
    if (!selectedNotification) return;
    const confirmed = window.confirm(
      "Delete this notification? This action cannot be undone.",
    );
    if (!confirmed) return;

    deleteNotification(selectedNotification.apiId);
    setSelectedNotification(null);
    void refetchProfile();
  }, [deleteNotification, refetchProfile, selectedNotification]);

  const handleCloseDetail = React.useCallback(() => {
    setSelectedNotification(null);
  }, []);

  return (
    <>
      <Head>
        <title>Dwelliva · Notifications</title>
      </Head>

      <section className="grid gap-6 lg:grid-cols-3">
        {/* Middle Column - Notifications List */}
        <div className="flex flex-col gap-6 min-w-0">
          {/* <div>
            <h1 className="text-xl font-semibold text-brand-black">Notifications</h1>
            <p className="mt-1 text-sm text-brand-ash">
              Stay informed with real-time updates and system alerts
            </p>
          </div> */}

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-brand-ash" />
            <input
              type="text"
              placeholder="Search notifications"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 w-full rounded-lg border-[0.3px] border-brand-border-light bg-brand-light-bg pl-10 pr-4 text-sm text-brand-black placeholder:text-brand-ash transition focus:ring-2 focus:ring-brand-main focus:outline-none"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-6 border-b border-brand-border-light">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`transition-fx relative flex cursor-pointer items-center gap-2 px-4 py-3 text-sm font-medium ${
                filter === "all"
                  ? "text-brand-main"
                  : "text-brand-ash hover:text-brand-black"
              }`}
            >
              <span>All</span>
              {filter === "all" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-main" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setFilter("unread")}
              className={`transition-fx relative flex cursor-pointer items-center gap-2 px-4 py-3 text-sm font-medium ${
                filter === "unread"
                  ? "text-brand-main"
                  : "text-brand-ash hover:text-brand-black"
              }`}
            >
              <span>Unread</span>
              {unreadCount > 0 && (
                <span className="inline-flex items-center justify-center rounded-full bg-brand-main px-2 py-0.5 text-xs font-medium text-brand-white">
                  {unreadCount}
                </span>
              )}
              {filter === "unread" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-main" />
              )}
            </button>
          </div>

          {/* Notifications List */}
          <div className="flex-1 space-y-2 overflow-y-auto max-h-[calc(100vh-300px)]">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-brand-main" />
              </div>
            ) : error ? (
              <div className="px-6 py-12 text-center">
                <p className="text-sm text-brand-failed-text">{error}</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <p className="text-sm text-brand-ash">No notifications found</p>
              </div>
            ) : (
              filteredNotifications.map((notification) => {
              const isSelected = selectedNotification?.id === notification.id;
              
              return (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => handleNotificationClick(notification)}
                  className={`transition-fx w-full text-left rounded-lg p-4 cursor-pointer ${
                    isSelected
                      ? "bg-brand-main-bg border border-brand-main"
                      : "bg-brand-white border border-brand-border-light hover:border-brand-main hover:bg-brand-light-bg"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-brand-main text-sm font-semibold text-brand-white">
                      {getInitials(notification.sender)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-brand-black">
                          {notification.sender}
                        </span>
                        {!notification.isRead && (
                          <span className="h-2 w-2 rounded-full bg-brand-main flex-shrink-0 mt-0.5" />
                        )}
                      </div>
                      <p className="text-xs text-brand-ash mb-1">{notification.time}</p>
                      <p className="text-sm text-brand-black line-clamp-2 break-words">
                        {notification.description}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })
            )}
          </div>
        </div>

        {/* Right Column - Notification Detail */}
        <div className="flex flex-col lg:col-span-2">
          {selectedNotification ? (
            <div className="rounded-2xl border border-brand-border-light bg-brand-white p-6 shadow-sm h-fit sticky top-6">
              {/* Detail Header */}
              <div className="flex items-start justify-between mb-6 pb-4 border-b border-brand-border-light">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-main text-sm font-semibold text-brand-white">
                    {getInitials(selectedNotification.sender)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-brand-black">
                      {selectedNotification.sender}
                    </p>
                    <p className="text-xs text-brand-ash">
                      {selectedNotification.dateTime}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCloseDetail}
                  className="flex-shrink-0 rounded-lg p-1.5 text-brand-ash hover:bg-brand-light-bg hover:text-brand-black transition-fx ml-4"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Detail Content */}
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-brand-black mb-3">
                    {selectedNotification.title}
                  </h2>
                  <p className="text-sm text-brand-black leading-relaxed">
                    {selectedNotification.fullDescription}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDeleteNotification}
                  className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete notification
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-brand-border-light bg-brand-white p-6 shadow-sm flex items-center justify-center h-fit sticky top-6">
              <p className="text-sm text-brand-ash">Select a notification to view details</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
};

NotificationsPage.getLayout = (page) => (
  <DashboardLayout>
    {page}
  </DashboardLayout>
);

export default NotificationsPage;
