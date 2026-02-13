import axios, { AxiosError, AxiosRequestConfig, Method } from "axios";
import { createUrl } from "@/utils/createUrl";

type ApiClientOptions = Omit<AxiosRequestConfig, "url" | "method" | "data"> & {
  token?: string;
  skipAuth?: boolean;
  method?: Method;
  data?: unknown;
};

type ApiResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; statusCode?: number };

/**
 * Centralized API client for making HTTP requests using Axios
 * Handles authentication, error handling, and response parsing
 */
export const apiClient = async <T>(
  endpoint: string,
  options: ApiClientOptions = {}
): Promise<ApiResult<T>> => {
  try {
    const { token, skipAuth, headers, method, data, ...axiosOptions } = options;

    const url = createUrl(endpoint);

    // Build headers
    const requestHeaders: Record<string, string> = {
      ...(headers as Record<string, string>),
    };

    // Add Content-Type header only if not FormData and not already set
    if (!requestHeaders["Content-Type"] && !(data instanceof FormData)) {
      requestHeaders["Content-Type"] = "application/json";
    }

    // Add authentication token
    if (!skipAuth) {
      const authToken =
        token ||
        (typeof window !== "undefined"
          ? localStorage.getItem("authToken") ||
            localStorage.getItem("accessToken")
          : null);

      if (authToken) {
        requestHeaders.Authorization = `Bearer ${authToken}`;
      }
    }

    // Add ngrok skip warning header (for development)
    requestHeaders["ngrok-skip-browser-warning"] = "true";

    // Make the request using axios
    // Prevent automatic redirect following to avoid CORS issues
    const response = await axios.request<T>({
      url,
      method,
      data,
      maxRedirects: 0, // Don't follow redirects automatically - backend should return JSON
      validateStatus: (status) => {
        // Accept all status codes - we'll handle them appropriately
        return status >= 200 && status < 600;
      },
      ...axiosOptions,
      headers: requestHeaders,
    });

    // Handle redirects (3xx status codes) - backend should return JSON, not redirects
    if (response.status >= 300 && response.status < 400) {
      const redirectUrl = response.headers.location || "unknown";
      console.warn("⚠️ Backend returned redirect instead of JSON:", {
        status: response.status,
        location: redirectUrl,
        message: "Backend should return JSON response, not redirects for API calls",
      });
      
      // If the redirect URL contains verified=true, treat it as success
      // This is a workaround for backends that redirect after verification
      if (redirectUrl.includes("verified=true")) {
        console.log("✅ Redirect indicates verification success, treating as success");
        return { 
          success: true, 
          data: { 
            success: true, 
            message: "Email verified successfully" 
          } as T 
        };
      }
      
      // Otherwise, return error
      return {
        success: false,
        error: `Backend returned redirect to ${redirectUrl}. Backend should return JSON response instead.`,
        statusCode: response.status,
      };
    }

    // Handle 204 No Content responses
    if (response.status === 204) {
      return { success: true, data: {} as T };
    }

    // Handle successful responses (2xx)
    if (response.status >= 200 && response.status < 300) {
      return { success: true, data: response.data };
    }

    // Handle error responses (4xx, 5xx)
    const responseData = response.data as { message?: string; error?: string } | undefined;
    
    // Special handling for 401 Unauthorized (expired/invalid token)
    if (response.status === 401) {
      // Clear user session
      if (typeof window !== "undefined") {
        // Only redirect if not already on login page to avoid redirect loops
        const currentPath = window.location.pathname;
        if (!currentPath.startsWith("/auth/login") && !currentPath.startsWith("/auth/signup")) {
          localStorage.removeItem("user");
          localStorage.removeItem("authToken");
          localStorage.removeItem("accessToken");
          localStorage.removeItem("userId");
          localStorage.removeItem("landlordId");
          localStorage.removeItem("lastCreatedPropertyId");
          sessionStorage.clear();
          
          // Redirect to login page
          window.location.href = "/auth/login";
        }
      }
      
      return {
        success: false,
        error: "Your session has expired. Please sign in again.",
        statusCode: response.status,
      };
    }
    
    // Special handling for 413 (Request Entity Too Large)
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
        (responseData && typeof responseData === "object" && (responseData.message || responseData.error)) ||
        `Request failed with status ${response.status}`,
      statusCode: response.status,
    };
  } catch (error) {
    // Handle Axios errors
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{ message?: string; error?: string }>;

      // Network errors
      if (!axiosError.response) {
        return {
          success: false,
          error: "Network error: Unable to connect to server",
        };
      }

      // HTTP errors with response
      const statusCode = axiosError.response.status;
      const responseData = axiosError.response.data as { message?: string; error?: string } | undefined;

      // Special handling for 401 Unauthorized (expired/invalid token)
      if (statusCode === 401) {
        // Clear user session
        if (typeof window !== "undefined") {
          // Only redirect if not already on login page to avoid redirect loops
          const currentPath = window.location.pathname;
          if (!currentPath.startsWith("/auth/login") && !currentPath.startsWith("/auth/signup")) {
            localStorage.removeItem("user");
            localStorage.removeItem("authToken");
            localStorage.removeItem("accessToken");
            localStorage.removeItem("userId");
            localStorage.removeItem("landlordId");
            localStorage.removeItem("lastCreatedPropertyId");
            sessionStorage.clear();
            
            // Redirect to login page
            window.location.href = "/auth/login";
          }
        }
        
        return {
          success: false,
          error: "Your session has expired. Please sign in again.",
          statusCode,
        };
      }

      // Special handling for 413 (Request Entity Too Large)
      if (statusCode === 413) {
        return {
          success: false,
          error: "File size too large. Please upload a file smaller than 10MB.",
          statusCode,
        };
      }

      return {
        success: false,
        error:
          (responseData && typeof responseData === "object" && (responseData.message || responseData.error)) ||
          axiosError.message ||
          `Request failed: ${axiosError.response.statusText}`,
        statusCode,
      };
    }

    // Handle other errors
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
};

/**
 * Helper function for GET requests
 */
export const apiGet = <T>(
  endpoint: string,
  options?: Omit<ApiClientOptions, "method" | "data">
): Promise<ApiResult<T>> => {
  return apiClient<T>(endpoint, { ...options, method: "GET" });
};

/**
 * Helper function for POST requests
 */
export const apiPost = <T>(
  endpoint: string,
  body?: unknown,
  options?: Omit<ApiClientOptions, "method" | "data">
): Promise<ApiResult<T>> => {
  return apiClient<T>(endpoint, {
    ...options,
    method: "POST",
    data: body, // Axios automatically handles JSON.stringify for objects and FormData
  });
};

/**
 * Helper function for PATCH requests
 */
export const apiPatch = <T>(
  endpoint: string,
  body?: unknown,
  options?: Omit<ApiClientOptions, "method" | "data">
): Promise<ApiResult<T>> => {
  return apiClient<T>(endpoint, {
    ...options,
    method: "PATCH",
    data: body,
  });
};

/**
 * Helper function for PUT requests
 */
export const apiPut = <T>(
  endpoint: string,
  body?: unknown,
  options?: Omit<ApiClientOptions, "method" | "data">
): Promise<ApiResult<T>> => {
  return apiClient<T>(endpoint, {
    ...options,
    method: "PUT",
    data: body,
  });
};

/**
 * Helper function for DELETE requests
 */
export const apiDelete = <T>(
  endpoint: string,
  options?: Omit<ApiClientOptions, "method" | "data">
): Promise<ApiResult<T>> => {
  return apiClient<T>(endpoint, { ...options, method: "DELETE" });
};
