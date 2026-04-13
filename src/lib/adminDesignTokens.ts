/**
 * Stat / highlight tile backgrounds and label colors (Figma).
 * Used on admin and landlord dashboard metric grids; pair bg + label from the same key.
 */
export const ADMIN_STAT_BG = {
  blue: "#EFF6FF",
  green: "#F0FDF4",
  purple: "#FAF5FF",
  orange: "#FFF7ED",
} as const;

export const ADMIN_STAT_LABEL = {
  blue: "#1D4ED8",
  green: "#15803D",
  purple: "#7E22CE",
  orange: "#C2410C",
} as const;

/** Default order for four-tile stat grids (dashboard + admin). */
export const ADMIN_STAT_CYCLE = ["blue", "green", "purple", "orange"] as const;

export type AdminStatCycleKey = (typeof ADMIN_STAT_CYCLE)[number];
