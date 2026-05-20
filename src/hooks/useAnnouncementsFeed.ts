import * as React from "react";
import {
  subscribeAnnouncements,
  type AnnouncementItemDTO,
} from "@/api/announcement";
import {
  mergeAnnouncementLists,
  sortAnnouncementList,
} from "@/utils/mergeAnnouncementLists";
import { clearCachedAnnouncements } from "@/utils/announcementsCache";

export const readAnnouncementToken = (): string => {
  if (typeof window === "undefined") return "";
  return (
    window.localStorage.getItem("authToken") ||
    window.localStorage.getItem("accessToken") ||
    ""
  );
};

export const isBroadcastAnnouncement = (item: AnnouncementItemDTO) => {
  const level = (item.level || "").toUpperCase();
  return level === "LANDLORD" || level === "PROPERTY";
};

/** Stable identity — default param `(items) => items` would be a new fn every render. */
const passthroughAnnouncements = (items: AnnouncementItemDTO[]) => items;

export type UseAnnouncementsFeedOptions = {
  userId: string | null | undefined;
  userRole?: string;
  token?: string;
  enabled?: boolean;
  filterIncoming?: (items: AnnouncementItemDTO[]) => AnnouncementItemDTO[];
  /** @deprecated No longer used — localStorage cache removed. */
  filterCached?: (items: AnnouncementItemDTO[]) => AnnouncementItemDTO[];
  logLabel?: string;
};

/**
 * Shared announcements feed via socket.io only (backend does not support GET list).
 *
 * Each socket `onLoad` payload replaces in-memory state so every device converges
 * on the same server snapshot. Optimistic rows from `setAnnouncements` are kept until
 * the next socket load; use merge helpers when prepending a freshly-created row.
 */
export function useAnnouncementsFeed({
  userId,
  userRole,
  token,
  enabled = true,
  filterIncoming = passthroughAnnouncements,
  logLabel = "announcements",
}: UseAnnouncementsFeedOptions) {
  const [announcements, setAnnouncements] = React.useState<
    AnnouncementItemDTO[]
  >([]);
  const [isLoading, setIsLoading] = React.useState(false);

  const filterIncomingRef = React.useRef(filterIncoming);
  filterIncomingRef.current = filterIncoming;

  const hasReceivedSocketLoadRef = React.useRef(false);

  const applySocketLoad = React.useCallback((items: AnnouncementItemDTO[]) => {
    const filtered = filterIncomingRef.current(items);
    hasReceivedSocketLoadRef.current = true;
    setIsLoading(false);
    setAnnouncements(sortAnnouncementList(filtered));
  }, []);

  // Reset when the signed-in user changes; drop legacy per-device localStorage cache.
  React.useEffect(() => {
    if (!enabled || !userId) {
      hasReceivedSocketLoadRef.current = false;
      setAnnouncements([]);
      setIsLoading(false);
      return;
    }

    hasReceivedSocketLoadRef.current = false;
    setAnnouncements([]);
    setIsLoading(true);
    clearCachedAnnouncements(userId);
  }, [enabled, userId]);

  // Socket subscription — reconnect when auth identity changes.
  React.useEffect(() => {
    if (!enabled || !userId) return;

    const socketToken = token || readAnnouncementToken();
    if (!socketToken) {
      console.warn(`[${logLabel}] no token for announcement socket`);
      setIsLoading(false);
      return;
    }

    const subscription = subscribeAnnouncements({
      token: socketToken,
      onLoad: (items) => {
        if (process.env.NODE_ENV === "development") {
          console.log(`[${logLabel}] socket onLoad (replace)`, {
            role: userRole,
            count: items.length,
          });
        }
        applySocketLoad(items);
      },
      onError: (error) => {
        console.warn(`[${logLabel}] socket error:`, error);
        if (!hasReceivedSocketLoadRef.current) {
          setIsLoading(false);
        }
      },
    });

    return () => {
      subscription.disconnect();
    };
  }, [applySocketLoad, enabled, logLabel, token, userId, userRole]);

  /** Prepend an optimistic row until the next socket snapshot arrives. */
  const prependOptimistic = React.useCallback((item: AnnouncementItemDTO) => {
    setAnnouncements((prev) => mergeAnnouncementLists([item], prev));
  }, []);

  return {
    announcements,
    setAnnouncements,
    prependOptimistic,
    isLoading,
  };
}
