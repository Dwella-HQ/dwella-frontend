import type {
  SecurityLoginData,
  SecurityPropertySummary,
} from "@/api/security";

export const SECURITY_SESSION_KEY = "dwelliva.security.session";
const SECURITY_ASSIGNMENTS_KEY = "dwelliva.security.assignments";

export type SecuritySession = {
  token: string;
  userId: string;
  displayName: string;
  email: string;
  phoneNumber: string;
  avatarUrl?: string;
  properties: SecurityPropertySummary[];
  selectedPropertyId: string | null;
};

export type SecurityAccessStatus = "granted" | "denied";

export type SecurityAccessLog = {
  id: string;
  name: string;
  role: string;
  location: string;
  timestamp: string;
  code: string;
  status: SecurityAccessStatus;
};

export type SecurityCodeLookup = {
  code: string;
  name: string;
  role: string;
  location: string;
};

const getStorage = (persist: boolean) =>
  persist ? window.localStorage : window.sessionStorage;

const readRawSession = (): { raw: string; persist: boolean } | null => {
  if (typeof window === "undefined") return null;
  const local = window.localStorage.getItem(SECURITY_SESSION_KEY);
  if (local) return { raw: local, persist: true };
  const session = window.sessionStorage.getItem(SECURITY_SESSION_KEY);
  if (session) return { raw: session, persist: false };
  return null;
};

export const normalizeSecurityCode = (value: string) =>
  value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 6);

export const sessionFromLogin = (
  login: SecurityLoginData,
): SecuritySession => ({
  token: login.accessToken,
  userId: login.user.id,
  displayName: login.user.fullName || "Security officer",
  email: login.user.email,
  phoneNumber: login.user.phoneNumber,
  avatarUrl: login.user.avatarUrl,
  properties: login.properties,
  selectedPropertyId: login.properties[0]?.id ?? null,
});

export const saveSecuritySession = (
  session: SecuritySession,
  persist: boolean,
) => {
  window.sessionStorage.removeItem(SECURITY_SESSION_KEY);
  window.localStorage.removeItem(SECURITY_SESSION_KEY);
  getStorage(persist).setItem(SECURITY_SESSION_KEY, JSON.stringify(session));
};

export const getSecuritySession = (): SecuritySession | null => {
  const stored = readRawSession();
  if (!stored) return null;
  try {
    const parsed = JSON.parse(stored.raw) as Partial<SecuritySession>;
    if (!parsed.token || typeof parsed.token !== "string") return null;
    return {
      token: parsed.token,
      userId: parsed.userId ?? "",
      displayName: parsed.displayName || "Security officer",
      email: parsed.email ?? "",
      phoneNumber: parsed.phoneNumber ?? "",
      avatarUrl: parsed.avatarUrl,
      properties: Array.isArray(parsed.properties) ? parsed.properties : [],
      selectedPropertyId: parsed.selectedPropertyId ?? parsed.properties?.[0]?.id ?? null,
    };
  } catch {
    return null;
  }
};

export const updateSecuritySession = (
  patch: Partial<SecuritySession>,
): SecuritySession | null => {
  const stored = readRawSession();
  const current = getSecuritySession();
  if (!stored || !current) return null;
  const next = { ...current, ...patch };
  getStorage(stored.persist).setItem(
    SECURITY_SESSION_KEY,
    JSON.stringify(next),
  );
  return next;
};

export const clearSecuritySession = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SECURITY_SESSION_KEY);
  window.sessionStorage.removeItem(SECURITY_SESSION_KEY);
};

export const getMainAppPath = () => {
  if (typeof window === "undefined") return "/auth/login";
  try {
    const user = window.localStorage.getItem("user");
    const token =
      window.localStorage.getItem("authToken") ||
      window.localStorage.getItem("accessToken");
    if (user && token) return "/dashboard";
  } catch {
    return "/auth/login";
  }
  return "/auth/login";
};

export const formatSecurityTimestamp = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const datePart = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const timePart = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${datePart} • ${timePart}`;
};

export const getSecurityInitials = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "SO";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

export const logFromAccessRecord = (
  log: {
    id: string;
    person: string;
    unit: string;
    timestamp: string;
    code: string;
    outcome: SecurityAccessStatus;
  },
): SecurityAccessLog => ({
  id: log.id,
  name: log.person,
  role: "Visitor",
  location: log.unit,
  timestamp: log.timestamp,
  code: log.code,
  status: log.outcome,
});

const phoneAssignmentKey = (phone: string) => {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0") && digits.length === 11) {
    digits = `234${digits.slice(1)}`;
  }
  if (digits.startsWith("2340") && digits.length === 14) {
    digits = `234${digits.slice(4)}`;
  }
  return digits;
};

export const securityPhoneKey = phoneAssignmentKey;

const readAssignmentMap = (): Record<string, SecurityPropertySummary[]> => {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(SECURITY_ASSIGNMENTS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, SecurityPropertySummary[]>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

export const rememberSecurityAssignment = (
  phoneNumber: string,
  property: SecurityPropertySummary,
) => {
  if (typeof window === "undefined") return;
  const key = phoneAssignmentKey(phoneNumber);
  if (!key || !property.id) return;
  const map = readAssignmentMap();
  const current = map[key] ?? [];
  map[key] = [
    property,
    ...current.filter((item) => item.id !== property.id),
  ];
  window.localStorage.setItem(SECURITY_ASSIGNMENTS_KEY, JSON.stringify(map));
};

export const recallSecurityAssignments = (
  phoneNumber: string,
): SecurityPropertySummary[] => {
  const key = phoneAssignmentKey(phoneNumber);
  if (!key) return [];
  return readAssignmentMap()[key] ?? [];
};

export const forgetSecurityAssignment = (
  phoneNumber: string,
  propertyId: string,
) => {
  if (typeof window === "undefined") return;
  const key = phoneAssignmentKey(phoneNumber);
  if (!key || !propertyId) return;
  const map = readAssignmentMap();
  const next = (map[key] ?? []).filter((item) => item.id !== propertyId);
  if (next.length === 0) {
    delete map[key];
  } else {
    map[key] = next;
  }
  window.localStorage.setItem(SECURITY_ASSIGNMENTS_KEY, JSON.stringify(map));
};
