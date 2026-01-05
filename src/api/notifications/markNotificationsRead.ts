import { createUrl } from "@/utils/createUrl";
import type { MarkNotificationsReadRequestDTO, MarkNotificationsReadResponseDTO } from "./notifications.schema";
import { markNotificationsReadResponseSchema } from "./notifications.schema";

const MARK_NOTIFICATIONS_READ_ROUTE = "/partners/notifications/open";

type MarkNotificationsReadResult =
  | { success: true; data: MarkNotificationsReadResponseDTO }
  | { success: false; error: string };

export const markNotificationsRead = async (
  token: string,
  notificationIds: number[]
): Promise<MarkNotificationsReadResult> => {
  try {
    const url = createUrl(MARK_NOTIFICATIONS_READ_ROUTE);

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "ngrok-skip-browser-warning": "true",
      },
      body: JSON.stringify({ notificationIds }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || `Failed to mark notifications as read: ${response.statusText}`,
      };
    }

    const payload = await response.json();

    // Wrap Zod parsing in try-catch to handle schema validation errors
    try {
      const parsed = markNotificationsReadResponseSchema.parse(payload);
      return { success: true, data: parsed };
    } catch (parseError) {
      console.error("Mark notifications read schema validation error:", parseError);
      return {
        success: false,
        error: "Invalid response data format received",
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

