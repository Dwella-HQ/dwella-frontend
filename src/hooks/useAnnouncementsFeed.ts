import * as React from "react";
import {
  subscribeAnnouncements,
  type AnnouncementItemDTO,
} from "@/api/announcement";
import {
  mergeAnnouncementLists,
  sortAnnouncementList,
} from "@/utils/mergeAnnouncementLists";

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

const passthroughAnnouncements = (items: AnnouncementItemDTO[]) => items;

export type UseAnnouncementsFeedOptions = {
  userId: string | null | undefined;
  userRole?: string;
  token?: string;
  enabled?: boolean;
  filterIncoming?: (items: AnnouncementItemDTO[]) => AnnouncementItemDTO[];
  logLabel?: string;
};

/**
 * Socket-only announcements feed via `announcements:load` on `/announcement`.
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

  const hasReceivedSocketLoadRef = React.useRef(false);

  React.useEffect(() => {
    filterIncomingRef.current = filterIncoming;
  }, [filterIncoming]);

  const applySocketLoad = React.useCallback((items: AnnouncementItemDTO[]) => {
    const filtered = filterIncomingRef.current(items);
    hasReceivedSocketLoadRef.current = true;
    setIsLoading(false);
    setAnnouncements((prev) => {
      if (prev.length === 0) return sortAnnouncementList(filtered);
      return mergeAnnouncementLists(prev, filtered);
    });
  }, []);

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
  }, [enabled, userId]);

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
          console.log(`[${logLabel}] announcements:load`, {
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
