import * as React from "react";
import { logout } from "@/utils/auth";

/**
 * Hook to automatically log out user after a period of inactivity
 * @param inactivityMinutes - Minutes of inactivity before logout (default: 60)
 */
export const useInactivityLogout = (inactivityMinutes = 60) => {
  const inactivityTimeout = React.useRef<NodeJS.Timeout | null>(null);
  const INACTIVITY_MS = inactivityMinutes * 60 * 1000;

  const resetTimer = React.useCallback(() => {
    // Clear existing timer
    if (inactivityTimeout.current) {
      clearTimeout(inactivityTimeout.current);
    }

    // Only set timer if user is logged in
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("authToken");
      if (!token) {
        return;
      }

      // Set new timer
      inactivityTimeout.current = setTimeout(() => {
        logout();
      }, INACTIVITY_MS);
    }
  }, [INACTIVITY_MS]);

  React.useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") {
      return;
    }

    // Events that indicate user activity
    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];

    // Initialize timer
    resetTimer();

    // Add event listeners
    events.forEach((event) => {
      window.addEventListener(event, resetTimer, true);
    });

    // Cleanup
    return () => {
      if (inactivityTimeout.current) {
        clearTimeout(inactivityTimeout.current);
      }
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer, true);
      });
    };
  }, [resetTimer]);
};

