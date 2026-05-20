import * as React from "react";
import {
  subscribeAnnouncements,
  type AnnouncementItemDTO,
} from "@/api/announcement";
import { mergeAnnouncementLists } from "@/utils/mergeAnnouncementLists";
import {
  loadCachedAnnouncements,
  saveCachedAnnouncements,
} from "@/utils/announcementsCache";

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
  filterCached?: (items: AnnouncementItemDTO[]) => AnnouncementItemDTO[];
  logLabel?: string;
};

/**
 * Shared announcements feed: localStorage cache + socket subscription.
 * Used by landlord, property manager, and tenant dashboards/pages.
 */
export function useAnnouncementsFeed({
  userId,
  userRole,
  token,
  enabled = true,
  filterIncoming = passthroughAnnouncements,
  filterCached = passthroughAnnouncements,
  logLabel = "announcements",
}: UseAnnouncementsFeedOptions) {
  const [announcements, setAnnouncements] = React.useState<
    AnnouncementItemDTO[]
  >([]);

  const filterIncomingRef = React.useRef(filterIncoming);
  const filterCachedRef = React.useRef(filterCached);
  filterIncomingRef.current = filterIncoming;
  filterCachedRef.current = filterCached;

  const cacheLoadedForUserRef = React.useRef<string | null>(null);
  const lastSavedCacheKeyRef = React.useRef<string>("");

  const applyIncoming = React.useCallback((items: AnnouncementItemDTO[]) => {
    const filtered = filterIncomingRef.current(items);
    setAnnouncements((prev) => mergeAnnouncementLists(prev, filtered));
  }, []);

  // Hydrate from cache once per user session (not on every parent re-render).
  React.useEffect(() => {
    if (!enabled || !userId) {
      cacheLoadedForUserRef.current = null;
      return;
    }
    if (cacheLoadedForUserRef.current === userId) return;
    cacheLoadedForUserRef.current = userId;

    const cached = filterCachedRef.current(loadCachedAnnouncements(userId));
    if (cached.length > 0) {
      setAnnouncements((prev) => mergeAnnouncementLists(prev, cached));
    }
  }, [enabled, userId]);

  // Persist cache only when the list actually changes.
  React.useEffect(() => {
    if (!enabled || !userId) return;
    const snapshot = JSON.stringify(
      announcements.map((a) => a.id ?? `${a.title}:${a.createdAt}`),
    );
    if (snapshot === lastSavedCacheKeyRef.current) return;
    lastSavedCacheKeyRef.current = snapshot;
    saveCachedAnnouncements(userId, announcements);
  }, [announcements, enabled, userId]);

  // Socket subscription — reconnect only when auth identity changes, not filters.
  React.useEffect(() => {
    if (!enabled || !userId) return;

    const socketToken = token || readAnnouncementToken();
    if (!socketToken) {
      console.warn(`[${logLabel}] no token for announcement socket`);
      return;
    }

    const subscription = subscribeAnnouncements({
      token: socketToken,
      onLoad: (items) => {
        if (process.env.NODE_ENV === "development") {
          console.log(`[${logLabel}] socket onLoad`, {
            role: userRole,
            count: items.length,
          });
        }
        applyIncoming(items);
      },
      onError: (error) => {
        console.warn(`[${logLabel}] socket error:`, error);
      },
    });

    return () => {
      subscription.disconnect();
    };
  }, [applyIncoming, enabled, logLabel, token, userId, userRole]);

  return { announcements, setAnnouncements };
}
