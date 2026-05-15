import * as React from "react";
import {
  mapNotification,
  subscribeNotifications,
  type Notification,
  type NotificationSubscription,
} from "@/api/notifications";
import { useUser } from "@/contexts/UserContext";

type NotificationsContextType = {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  isConnected: boolean;
  error: string | null;
  refresh: () => void;
  markAsRead: (notificationIds: string[]) => void;
  markAllAsRead: () => void;
  deleteNotification: (notificationId: string) => void;
};

const NotificationsContext =
  React.createContext<NotificationsContextType | null>(null);

export const useNotifications = () => {
  const context = React.useContext(NotificationsContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationsProvider",
    );
  }
  return context;
};

export const NotificationsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { user } = useUser();
  const userId = user?.id ? String(user.id) : null;
  const token = user?.token ?? null;
  const subscriptionRef = React.useRef<NotificationSubscription | null>(null);
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isConnected, setIsConnected] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    subscriptionRef.current?.disconnect();
    subscriptionRef.current = null;

    if (!userId || !token) {
      setNotifications([]);
      setIsLoading(false);
      setIsConnected(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    const subscription = subscribeNotifications({
      token,
      userId,
      onConnectionChange: setIsConnected,
      onLoad: (items) => {
        setNotifications(items.map(mapNotification));
        setIsLoading(false);
        setError(null);
      },
      onError: (message) => {
        setError(message);
        setIsLoading(false);
      },
    });

    subscriptionRef.current = subscription;

    return () => {
      subscription.disconnect();
      if (subscriptionRef.current === subscription) {
        subscriptionRef.current = null;
      }
    };
  }, [token, userId]);

  const refresh = React.useCallback(() => {
    if (!userId || !token) return;
    setIsLoading(true);
    subscriptionRef.current?.load();
  }, [token, userId]);

  const markAsRead = React.useCallback((notificationIds: string[]) => {
    const ids = new Set(notificationIds.map(String));
    if (ids.size === 0) return;

    setNotifications((prev) =>
      prev.map((notification) =>
        ids.has(notification.apiId)
          ? { ...notification, isRead: true }
          : notification,
      ),
    );

    ids.forEach((notificationId) => {
      subscriptionRef.current?.markRead(notificationId);
    });

    window.setTimeout(() => subscriptionRef.current?.load(), 500);
  }, []);

  const markAllAsRead = React.useCallback(() => {
    const unreadIds = notifications
      .filter((notification) => !notification.isRead)
      .map((notification) => notification.apiId);
    markAsRead(unreadIds);
  }, [markAsRead, notifications]);

  const deleteNotification = React.useCallback((notificationId: string) => {
    setNotifications((prev) =>
      prev.filter((notification) => notification.apiId !== notificationId),
    );
    subscriptionRef.current?.delete(notificationId);
    window.setTimeout(() => subscriptionRef.current?.load(), 500);
  }, []);

  const unreadCount = React.useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications],
  );

  const value = React.useMemo(
    () => ({
      notifications,
      unreadCount,
      isLoading,
      isConnected,
      error,
      refresh,
      markAsRead,
      markAllAsRead,
      deleteNotification,
    }),
    [
      notifications,
      unreadCount,
      isLoading,
      isConnected,
      error,
      refresh,
      markAsRead,
      markAllAsRead,
      deleteNotification,
    ],
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};
