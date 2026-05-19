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
  filterIncoming = (items) => items,
  filterCached = (items) => items,
  logLabel = "announcements",
}: UseAnnouncementsFeedOptions) {
  const [announcements, setAnnouncements] = React.useState<
    AnnouncementItemDTO[]
  >([]);

  const applyIncoming = React.useCallback(
    (items: AnnouncementItemDTO[]) => {
      const filtered = filterIncoming(items);
      setAnnouncements((prev) => mergeAnnouncementLists(prev, filtered));
    },
    [filterIncoming],
  );

  React.useEffect(() => {
    if (!enabled || !userId) return;
    const cached = filterCached(loadCachedAnnouncements(userId));
    if (cached.length > 0) {
      setAnnouncements((prev) => mergeAnnouncementLists(prev, cached));
    }
  }, [enabled, filterCached, userId]);

  React.useEffect(() => {
    if (!enabled || !userId) return;
    saveCachedAnnouncements(userId, announcements);
  }, [announcements, enabled, userId]);

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
        console.log(`[${logLabel}] socket onLoad`, {
          role: userRole,
          count: items.length,
        });
        applyIncoming(items);
      },
      onRaw: (payload) => {
        console.log(`[${logLabel}] socket raw payload:`, payload);
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
