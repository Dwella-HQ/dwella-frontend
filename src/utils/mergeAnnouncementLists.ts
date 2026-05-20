import type { AnnouncementItemDTO } from "@/api/announcement";

const sortByNewest = (a: AnnouncementItemDTO, b: AnnouncementItemDTO) => {
  const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
  const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
  return tb - ta;
};

/**
 * Builds a stable identity key for an announcement.
 * Falls back to title+content+createdAt for optimistic rows that don't have
 * a server-issued id yet (POST /announcement only returns
 * `{ success, message }`). Without this, fresh rows are silently dropped
 * during a list merge.
 */
const identityFor = (item: AnnouncementItemDTO): string => {
  if (item.id != null && String(item.id).trim().length > 0) {
    return `id:${String(item.id)}`;
  }
  const t = (item.title ?? "").trim().toLowerCase();
  const c = (item.content ?? "").trim().toLowerCase();
  const created = item.createdAt ?? "";
  const level = (item.level ?? "").toLowerCase();
  return `pending:${level}:${t}:${created}:${c.slice(0, 64)}`;
};

/**
 * Union-merge announcement lists so a websocket payload that is stale or
 * missing freshly-created rows cannot wipe UI state. Server rows with the
 * same id overwrite optimistic rows. Optimistic rows without an id are
 * matched by `title + content + createdAt` so a real server row with the
 * same content (and an id) takes their place once it arrives.
 */
export function mergeAnnouncementLists(
  previous: AnnouncementItemDTO[],
  incoming: AnnouncementItemDTO[],
): AnnouncementItemDTO[] {
  if (incoming.length === 0) {
    return previous;
  }

  const map = new Map<string, AnnouncementItemDTO>();

  for (const item of previous) {
    map.set(identityFor(item), item);
  }

  for (const item of incoming) {
    const key = identityFor(item);
    map.set(key, item);

    // If this incoming row has a real id, drop any earlier optimistic row
    // matching the same content so we don't show duplicates.
    if (item.id != null && String(item.id).trim().length > 0) {
      const tentativeKey = identityFor({ ...item, id: undefined });
      if (tentativeKey !== key && map.has(tentativeKey)) {
        map.delete(tentativeKey);
      }
    }
  }

  const result = Array.from(map.values()).sort(sortByNewest);

  if (
    result.length === previous.length &&
    result.every(
      (item, index) => identityFor(item) === identityFor(previous[index]!),
    )
  ) {
    return previous;
  }

  if (process.env.NODE_ENV === "development") {
    console.log(
      `[merge] mergeAnnouncementLists: result=${result.length} items`,
    );
  }
  return result;
}
