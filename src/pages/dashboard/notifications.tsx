import Head from "next/head";
import * as React from "react";
import { useRouter } from "next/router";
import { Search, X, Loader2 } from "lucide-react";

import { DashboardLayout } from "@/components/DashboardLayout";
import { getNotifications, markNotificationsRead, mapNotification } from "@/api/notifications";
import type { Notification } from "@/api/notifications";
import { useProfile } from "@/contexts/ProfileContext";

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
  const [filter, setFilter] = React.useState<NotificationFilter>("all");
  const [selectedNotification, setSelectedNotification] = React.useState<Notification | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pagination, setPagination] = React.useState<{
    total: number;
    currentPage: number;
    pageTotal: number;
    pageSize: number;
    prevPage: number | null;
    nextPage: number | null;
  } | null>(null);

  const token = React.useMemo(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("authToken");
    }
    return null;
  }, []);

  // Get notification ID from query params
  const notificationIdFromQuery = React.useMemo(() => {
    const id = router.query.id;
    return id ? String(id) : null;
  }, [router.query.id]);

  // Fetch notifications
  const fetchNotifications = React.useCallback(async () => {
    if (!token) return;

    setIsLoading(true);
    setError(null);

    const result = await getNotifications(token, currentPage);

    if (result.success) {
      const mapped = result.data.data.notifications.map(mapNotification);
      setNotifications(mapped);
      setPagination({
        total: result.data.data.total,
        currentPage: result.data.data.pagination.currentPage,
        pageTotal: result.data.data.pagination.pageTotal,
        pageSize: result.data.data.pagination.pageSize,
        prevPage: result.data.data.pagination.prevPage,
        nextPage: result.data.data.pagination.nextPage,
      });
      
      // Select notification based on query param or first notification if available
      setSelectedNotification((prev) => {
        // If we have a query param with notification ID, select that notification
        if (notificationIdFromQuery) {
          const notificationToSelect = mapped.find(
            (n) => String(n.apiId) === notificationIdFromQuery
          );
          if (notificationToSelect) {
            // Clear the query param after selecting
            router.replace("/dashboard/notifications", undefined, { shallow: true });
            return notificationToSelect;
          }
        }
        // Otherwise, select first notification if none selected
        if (!prev && mapped.length > 0) {
          return mapped[0];
        }
        return prev;
      });
    } else {
      setError(result.error);
      setNotifications([]);
    }

    setIsLoading(false);
  }, [token, currentPage, notificationIdFromQuery, router]);

  React.useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

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

  const handleNotificationClick = React.useCallback(async (notification: Notification) => {
    setSelectedNotification(notification);

    // Mark as read if unread
    if (!notification.isRead && token) {
      const result = await markNotificationsRead(token, [notification.apiId]);
      
      if (result.success) {
        // Update local state
        const updatedNotification = { ...notification, isRead: true };
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id ? updatedNotification : n
          )
        );
        
        // Update selected notification state
        setSelectedNotification(updatedNotification);
        
        // Refetch profile to update notification count
        refetchProfile();
      }
    }
  }, [token, refetchProfile]);

  const handleCloseDetail = React.useCallback(() => {
    setSelectedNotification(null);
  }, []);

  return (
    <>
      <Head>
        <title>NESCO Partners · Notifications</title>
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
  <DashboardLayout
    heading="Notifications"
    byText="Stay informed with real-time updates and system alerts"
  >
    {page}
  </DashboardLayout>
);

export default NotificationsPage;
