import type { AnnouncementItemDTO } from "@/api/announcement";

const STORAGE_PREFIX = "dwella:announcements:";
const MAX_ITEMS = 200;

const keyFor = (userId: string | null | undefined): string =>
  `${STORAGE_PREFIX}${userId ?? "anon"}`;

/**
 * Reads the cached announcement list for the given user.
 *
 * Page refreshes and route changes both reset React state, so without a cache
 * the announcements page shows an empty list until the REST/socket round-trip
 * finishes. That window is what made freshly-created announcements appear to
 * disappear.
 */
export function loadCachedAnnouncements(
  userId: string | null | undefined,
): AnnouncementItemDTO[] {
  if (typeof window === "undefined") return [];
  try {
    const key = keyFor(userId);
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      console.warn(
        `[cache] loadCachedAnnouncements: invalid cache format for key=${key}`,
      );
      return [];
    }
    return parsed as AnnouncementItemDTO[];
  } catch (err) {
    console.error(`[cache] loadCachedAnnouncements error:`, err);
    return [];
  }
}

/**
 * Writes the cache for the given user. Trims to `MAX_ITEMS` newest entries to
 * keep storage bounded.
 */
export function saveCachedAnnouncements(
  userId: string | null | undefined,
  items: AnnouncementItemDTO[],
): void {
  if (typeof window === "undefined") return;
  try {
    const key = keyFor(userId);
    const trimmed = items.slice(0, MAX_ITEMS);
    window.localStorage.setItem(key, JSON.stringify(trimmed));
  } catch (err) {
    console.error(`[cache] saveCachedAnnouncements error:`, err);
  }
}

export function clearCachedAnnouncements(
  userId: string | null | undefined,
): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(keyFor(userId));
  } catch {
    // ignore
  }
}
