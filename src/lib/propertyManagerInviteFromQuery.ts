/** Reads property-manager invitation id from common query param names on signup URLs. */
export function getPropertyManagerInviteIdFromQuery(
  query: Record<string, string | string[] | undefined>,
): string {
  const keys = [
    "propertyManagerId",
    "token",
    "property-manager-id",
    "managerId",
    "property_manager_id",
  ];
  for (const key of keys) {
    const raw = query[key];
    const s = Array.isArray(raw) ? raw[0] : raw;
    if (typeof s === "string" && s.trim().length > 0) {
      return s.trim();
    }
  }
  return "";
}
