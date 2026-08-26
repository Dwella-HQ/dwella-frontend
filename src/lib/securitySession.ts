export const SECURITY_SESSION_KEY = "dwelliva.security.session";
export const SECURITY_HISTORY_KEY = "dwelliva.security.history";

export type SecuritySession = {
  username: string;
  displayName: string;
  email: string;
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

const MOCK_VALID_CODES: SecurityCodeLookup[] = [
  {
    code: "Y452J9",
    name: "John Doe",
    role: "Maintenance",
    location: "Apt 4B, Lekki Haven",
  },
  {
    code: "849201",
    name: "John Doe",
    role: "Maintenance",
    location: "Unit 2A, Lekki Haven",
  },
  {
    code: "592103",
    name: "Sarah Smith",
    role: "Resident",
    location: "Unit 4B, Victoria Court",
  },
  {
    code: "103944",
    name: "Amazon Delivery",
    role: "Visitor",
    location: "Unit 1C, Ikeja Heights",
  },
];

const INITIAL_HISTORY: SecurityAccessLog[] = [
  {
    id: "hist-1",
    name: "John Doe",
    role: "Maintenance",
    location: "Apt 4B, Lekki Haven",
    timestamp: "2026-08-06T14:22:00",
    code: "Y452J9",
    status: "granted",
  },
  {
    id: "hist-2",
    name: "Sarah Smith",
    role: "Resident",
    location: "Unit 4B, Victoria Court",
    timestamp: "2026-08-06T11:04:00",
    code: "592103",
    status: "granted",
  },
  {
    id: "hist-3",
    name: "Unknown visitor",
    role: "Visitor",
    location: "Main gate",
    timestamp: "2026-08-05T18:41:00",
    code: "ZZ0000",
    status: "denied",
  },
];

const getStorage = (persist: boolean) =>
  persist ? window.localStorage : window.sessionStorage;

export const normalizeSecurityCode = (value: string) =>
  value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 6);

export const lookupSecurityCode = (code: string): SecurityCodeLookup | null => {
  const normalized = normalizeSecurityCode(code);
  return MOCK_VALID_CODES.find((entry) => entry.code === normalized) ?? null;
};

const displayNameFromUsername = (username: string) => {
  const local = username.includes("@") ? username.split("@")[0] : username;
  const words = local.replace(/[._-]+/g, " ").trim();
  if (!words) return "Security Officer";
  return words
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

export const createSecuritySession = (username: string): SecuritySession => {
  const trimmed = username.trim();
  const displayName = displayNameFromUsername(trimmed);
  return {
    username: trimmed,
    displayName,
    email: trimmed.includes("@") ? trimmed : `${trimmed}@dwelliva-security.local`,
  };
};

export const saveSecuritySession = (session: SecuritySession, persist: boolean) => {
  window.sessionStorage.removeItem(SECURITY_SESSION_KEY);
  window.localStorage.removeItem(SECURITY_SESSION_KEY);
  getStorage(persist).setItem(SECURITY_SESSION_KEY, JSON.stringify(session));
};

export const getSecuritySession = (): SecuritySession | null => {
  if (typeof window === "undefined") return null;
  const raw =
    window.localStorage.getItem(SECURITY_SESSION_KEY) ??
    window.sessionStorage.getItem(SECURITY_SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SecuritySession;
  } catch {
    return null;
  }
};

export const clearSecuritySession = () => {
  window.localStorage.removeItem(SECURITY_SESSION_KEY);
  window.sessionStorage.removeItem(SECURITY_SESSION_KEY);
};

export const getSecurityHistory = (): SecurityAccessLog[] => {
  if (typeof window === "undefined") return INITIAL_HISTORY;
  const raw = window.localStorage.getItem(SECURITY_HISTORY_KEY);
  if (!raw) {
    window.localStorage.setItem(SECURITY_HISTORY_KEY, JSON.stringify(INITIAL_HISTORY));
    return INITIAL_HISTORY;
  }
  try {
    return JSON.parse(raw) as SecurityAccessLog[];
  } catch {
    return INITIAL_HISTORY;
  }
};

export const appendSecurityHistory = (entry: Omit<SecurityAccessLog, "id">) => {
  const history = getSecurityHistory();
  const next: SecurityAccessLog[] = [
    { ...entry, id: `hist-${Date.now()}` },
    ...history,
  ];
  window.localStorage.setItem(SECURITY_HISTORY_KEY, JSON.stringify(next));
  return next;
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
