import type { NotificationDTO } from "./notifications.schema";

/**
 * Format time ago from ISO date string
 */
const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return `${diffInSeconds} second${diffInSeconds !== 1 ? "s" : ""} ago`;
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} min${diffInMinutes !== 1 ? "s" : ""} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours !== 1 ? "s" : ""} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) {
    return "Yesterday";
  }
  if (diffInDays < 30) {
    return `${diffInDays} days ago`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths !== 1 ? "s" : ""} ago`;
  }

  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears} year${diffInYears !== 1 ? "s" : ""} ago`;
};

/**
 * Format date and time from ISO string
 */
const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  };
  return date.toLocaleString("en-NG", options).replace(",", "");
};

export interface Notification {
  id: string;
  sender: string;
  time: string;
  title: string;
  description: string;
  fullDescription: string;
  dateTime: string;
  isRead: boolean;
  // Store original API data for marking as read
  apiId: number;
}

/**
 * Map notification from API to Notification type for UI
 */
export const mapNotification = (notification: NotificationDTO): Notification => {
  // Truncate message for description (first 100 chars)
  const truncatedMessage = notification.message.length > 100
    ? `${notification.message.substring(0, 100)}...`
    : notification.message;

  return {
    id: String(notification.id),
    sender: "NESCO",
    time: formatTimeAgo(notification.createdAt),
    title: notification.title,
    description: truncatedMessage,
    fullDescription: notification.message,
    dateTime: formatDateTime(notification.createdAt),
    isRead: notification.read,
    apiId: notification.id,
  };
};

