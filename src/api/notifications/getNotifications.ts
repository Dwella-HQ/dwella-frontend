import { createUrl } from "@/utils/createUrl";
import type { NotificationsResponseDTO } from "./notifications.schema";
import { notificationsResponseSchema } from "./notifications.schema";

const NOTIFICATIONS_ROUTE = "/partners/notifications";

type NotificationsResult =
  | { success: true; data: NotificationsResponseDTO }
  | { success: false; error: string };

export const getNotifications = async (
  token: string,
  page?: number
): Promise<NotificationsResult> => {
  try {
    const url = createUrl(
      NOTIFICATIONS_ROUTE,
      page ? { page: String(page) } : undefined
    );

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "ngrok-skip-browser-warning": "true",
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || `Failed to fetch notifications: ${response.statusText}`,
      };
    }

    const payload = await response.json();

    // Wrap Zod parsing in try-catch to handle schema validation errors
    try {
      const parsed = notificationsResponseSchema.parse(payload);
      return { success: true, data: parsed };
    } catch (parseError) {
      console.error("Notifications schema validation error:", parseError);
      return {
        success: false,
        error: "Invalid notifications data format received",
      };
    }
  } catch (error) {
    // Handle network errors, fetch failures, etc.
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      return {
        success: false,
        error: "Network error: Unable to connect to server",
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
};

