import axios, { AxiosError, AxiosRequestConfig, Method } from "axios";
import { createUrl } from "@/utils/createUrl";
import { savePostLoginRedirect } from "@/utils/postLoginRedirect";
import {
  getStoredRefreshToken,
  setStoredRefreshToken,
  tryRefreshAccessToken,
  REFRESH_TOKEN_STORAGE_KEY,
} from "@/lib/authRefresh";

type ApiClientOptions = Omit<AxiosRequestConfig, "url" | "method" | "data"> & {
  token?: string;
  skipAuth?: boolean;
  method?: Method;
  data?: unknown;
};

type ApiResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; statusCode?: number };

function isProtectedAppRoute(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.location.pathname.startsWith("/dashboard") ||
    window.location.pathname.startsWith("/onboarding")
  );
}

function clearSessionAndRedirectToLogin(): void {
  if (typeof window === "undefined") return;
  savePostLoginRedirect();
  localStorage.removeItem("user");
  localStorage.removeItem("authToken");
  localStorage.removeItem("accessToken");
  localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
  localStorage.removeItem("userId");
  localStorage.removeItem("landlordId");
  localStorage.removeItem("lastCreatedPropertyId");
  sessionStorage.clear();
  window.location.href = "/auth/login";
}

async function handle401Response<T>(
  skipAuth: boolean | undefined,
  isRetry: boolean,
  retryRequest: () => Promise<ApiResult<T>>,
): Promise<ApiResult<T>> {
  if (skipAuth) {
    return {
      success: false,
      error: "Unauthorized",
      statusCode: 401,
    };
  }

  if (!isProtectedAppRoute()) {
    return {
      success: false,
      error: "Unauthorized",
      statusCode: 401,
    };
  }

  if (!isRetry && getStoredRefreshToken()) {
    const refreshed = await tryRefreshAccessToken();
    if (refreshed) {
      return retryRequest();
    }
  }

  clearSessionAndRedirectToLogin();
  return {
    success: false,
    error: "Your session has expired. Please sign in again.",
    statusCode: 401,
  };
}

/**
 * Centralized API client for making HTTP requests using Axios
 * Handles authentication, error handling, and response parsing
 */
export const apiClient = async <T>(
  endpoint: string,
  options: ApiClientOptions = {},
): Promise<ApiResult<T>> => {
  const normalizeHeaderValue = (
    value: string | string[] | undefined,
  ): string | null => {
    if (typeof value === "string") {
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : null;
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        const trimmed = item.trim();
        if (trimmed.length > 0) return trimmed;
      }
    }
    return null;
  };

  const persistRefreshTokenFromResponse = (responseHeaders?: unknown): void => {
    if (typeof window === "undefined" || !responseHeaders) return;
    const headers = responseHeaders as Record<
      string,
      string | string[] | undefined
    >;
    const refreshFromHeader = normalizeHeaderValue(
      headers["x-refresh-token"] ?? headers["X-Refresh-Token"],
    );
    if (refreshFromHeader) {
      setStoredRefreshToken(refreshFromHeader);
    }
  };

  const run = async (isRetry: boolean): Promise<ApiResult<T>> => {
    try {
      const { token, skipAuth, headers, method, data, ...axiosOptions } =
        options;

      const url = createUrl(endpoint);

      const requestHeaders: Record<string, string> = {
        ...(headers as Record<string, string>),
      };

      if (!requestHeaders["Content-Type"] && !(data instanceof FormData)) {
        requestHeaders["Content-Type"] = "application/json";
      }

      if (!skipAuth) {
        const storedToken =
          typeof window !== "undefined"
            ? localStorage.getItem("authToken") ||
              localStorage.getItem("accessToken")
            : null;
        const authToken = storedToken || token || null;

        if (authToken) {
          requestHeaders.Authorization = `Bearer ${authToken}`;
        }
      }

      requestHeaders["ngrok-skip-browser-warning"] = "true";

      const response = await axios.request<T>({
        url,
        method,
        data,
        withCredentials:
          skipAuth === true
            ? (axiosOptions.withCredentials ?? false)
            : (axiosOptions.withCredentials ?? true),
        maxRedirects: 0,
        validateStatus: (status) => status >= 200 && status < 600,
        ...axiosOptions,
        headers: requestHeaders,
      });

      persistRefreshTokenFromResponse(response.headers);

      if (response.status >= 300 && response.status < 400) {
        const redirectUrl = response.headers.location || "unknown";
        console.warn("⚠️ Backend returned redirect instead of JSON:", {
          status: response.status,
          location: redirectUrl,
          message:
            "Backend should return JSON response, not redirects for API calls",
        });

        if (redirectUrl.includes("verified=true")) {
          console.log(
            "✅ Redirect indicates verification success, treating as success",
          );
          return {
            success: true,
            data: {
              success: true,
              message: "Email verified successfully",
            } as T,
          };
        }

        return {
          success: false,
          error: `Backend returned redirect to ${redirectUrl}. Backend should return JSON response instead.`,
          statusCode: response.status,
        };
      }

      if (response.status === 204) {
        return { success: true, data: {} as T };
      }

      if (response.status >= 200 && response.status < 300) {
        return { success: true, data: response.data };
      }

      const responseData = response.data as
        | { message?: string; error?: string }
        | undefined;

      if (response.status === 401) {
        return handle401Response(skipAuth, isRetry, () => run(true));
      }

      if (response.status === 413) {
        return {
          success: false,
          error: "File size too large. Please upload a file smaller than 10MB.",
          statusCode: response.status,
        };
      }

      return {
        success: false,
        error:
          (responseData &&
            typeof responseData === "object" &&
            (responseData.message || responseData.error)) ||
          `Request failed with status ${response.status}`,
        statusCode: response.status,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{
          message?: string;
          error?: string;
        }>;

        if (!axiosError.response) {
          return {
            success: false,
            error: "Network error: Unable to connect to server",
          };
        }

        const statusCode = axiosError.response.status;
        persistRefreshTokenFromResponse(axiosError.response.headers);
        const responseData = axiosError.response.data as
          | { message?: string; error?: string }
          | undefined;

        if (statusCode === 401) {
          return handle401Response(options.skipAuth, isRetry, () => run(true));
        }

        if (statusCode === 413) {
          return {
            success: false,
            error:
              "File size too large. Please upload a file smaller than 10MB.",
            statusCode,
          };
        }

        return {
          success: false,
          error:
            (responseData &&
              typeof responseData === "object" &&
              (responseData.message || responseData.error)) ||
            axiosError.message ||
            `Request failed: ${axiosError.response.statusText}`,
          statusCode,
        };
      }

      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      };
    }
  };

  return run(false);
};

export const apiGet = <T>(
  endpoint: string,
  options?: Omit<ApiClientOptions, "method" | "data">,
): Promise<ApiResult<T>> => {
  return apiClient<T>(endpoint, { ...options, method: "GET" });
};

export const apiPost = <T>(
  endpoint: string,
  body?: unknown,
  options?: Omit<ApiClientOptions, "method" | "data">,
): Promise<ApiResult<T>> => {
  return apiClient<T>(endpoint, {
    ...options,
    method: "POST",
    data: body,
  });
};

export const apiPatch = <T>(
  endpoint: string,
  body?: unknown,
  options?: Omit<ApiClientOptions, "method" | "data">,
): Promise<ApiResult<T>> => {
  return apiClient<T>(endpoint, {
    ...options,
    method: "PATCH",
    data: body,
  });
};

export const apiPut = <T>(
  endpoint: string,
  body?: unknown,
  options?: Omit<ApiClientOptions, "method" | "data">,
): Promise<ApiResult<T>> => {
  return apiClient<T>(endpoint, {
    ...options,
    method: "PUT",
    data: body,
  });
};

export const apiDelete = <T>(
  endpoint: string,
  options?: Omit<ApiClientOptions, "method" | "data">,
): Promise<ApiResult<T>> => {
  return apiClient<T>(endpoint, { ...options, method: "DELETE" });
};
