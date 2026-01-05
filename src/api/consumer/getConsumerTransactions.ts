import { createUrl } from "@/utils/createUrl";
import type { ConsumerTransactionsResponseDTO } from "./consumer.schema";
import { consumerTransactionsResponseSchema } from "./consumer.schema";

const CONSUMER_TRANSACTIONS_ROUTE = "/partners/consumer-transactions";

type ConsumerTransactionsResult =
  | { success: true; data: ConsumerTransactionsResponseDTO }
  | { success: false; error: string };

export const getConsumerTransactions = async (
  token: string,
  page?: number
): Promise<ConsumerTransactionsResult> => {
  try {
    const url = createUrl(
      CONSUMER_TRANSACTIONS_ROUTE,
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
        error: errorData.message || `Failed to fetch consumer transactions: ${response.statusText}`,
      };
    }

    const payload = await response.json();

    // Wrap Zod parsing in try-catch to handle schema validation errors
    try {
      const parsed = consumerTransactionsResponseSchema.parse(payload);
      return { success: true, data: parsed };
    } catch (parseError) {
      console.error("Consumer transactions schema validation error:", parseError);
      return {
        success: false,
        error: "Invalid consumer transactions data format received",
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

