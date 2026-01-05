import { createUrl } from "@/utils/createUrl";
import type { DashboardAnalyticsResponseDTO } from "./analytics.schema";
import { dashboardAnalyticsResponseSchema } from "./analytics.schema";

const DASHBOARD_ANALYTICS_ROUTE = "/partners/dashboard/analytics";

type DashboardAnalyticsResult =
  | { success: true; data: DashboardAnalyticsResponseDTO }
  | { success: false; error: string };

export const getDashboardAnalytics = async (
  token: string
): Promise<DashboardAnalyticsResult> => {
  try {
    const url = createUrl(DASHBOARD_ANALYTICS_ROUTE);

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
        error: errorData.message || `Failed to fetch dashboard analytics: ${response.statusText}`,
      };
    }

    const payload = await response.json();

    // Wrap Zod parsing in try-catch to handle schema validation errors
    try {
      const parsed = dashboardAnalyticsResponseSchema.parse(payload);
      return { success: true, data: parsed };
    } catch (parseError) {
      console.error("Dashboard analytics schema validation error:", parseError);
      return {
        success: false,
        error: "Invalid dashboard analytics data format received",
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
