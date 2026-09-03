import { apiDelete, apiGet, apiPost } from "@/lib/apiClient";
import {
  recallSecurityAssignments,
  rememberSecurityAssignment,
  securityPhoneKey,
} from "@/lib/securitySession";

type ApiResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; statusCode?: number };

export type SecurityPropertySummary = {
  id: string;
  name: string;
};

export type SecurityOfficerProfile = {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  avatarUrl?: string;
};

export type SecurityLoginData = {
  accessToken: string;
  user: SecurityOfficerProfile;
  properties: SecurityPropertySummary[];
};

export type SecurityPersonnel = {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  assignedProperty: string;
  avatarUrl?: string;
};

export type AccessCodeRecord = {
  id: string;
  code: string;
  name: string;
  unitLabel: string;
  unitId: string | null;
  type: "visitor" | "resident";
  status: "active" | "used" | "revoked";
  validity: string;
  usage: string;
  createdBy: "landlord" | "manager" | "tenant";
  createdAt: string | null;
};

export type AccessCodeLog = {
  id: string;
  timestamp: string;
  person: string;
  unit: string;
  code: string;
  confirmedBy: string;
  outcome: "granted" | "denied";
  note: string;
  securityId: string | null;
};

export type LoginSecurityPayload = {
  phoneNumber: string;
  password: string;
};

export type RegisterSecurityPayload = {
  phoneNumber: string;
  password: string;
};

type SecurityRequestOptions = {
  token?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asString(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}

function pickString(
  source: Record<string, unknown> | null | undefined,
  keys: string[],
): string | null {
  if (!source) return null;
  for (const key of keys) {
    const found = asString(source[key]);
    if (found) return found;
  }
  return null;
}

function nestedRecord(
  source: Record<string, unknown> | null | undefined,
  keys: string[],
): Record<string, unknown> | null {
  if (!source) return null;
  for (const key of keys) {
    const value = source[key];
    if (isRecord(value)) return value;
  }
  return null;
}

function unwrapData(raw: unknown): unknown {
  if (!isRecord(raw)) return raw;
  if ("data" in raw && raw.data !== undefined) {
    const inner = raw.data;
    if (isRecord(inner) && "data" in inner && inner.data !== undefined) {
      return inner.data;
    }
    return inner;
  }
  return raw;
}

function unwrapList(raw: unknown): unknown[] {
  const data = unwrapData(raw);
  if (Array.isArray(data)) return data;
  if (isRecord(data)) {
    for (const key of [
      "items",
      "results",
      "records",
      "security",
      "personnel",
      "accessCodes",
      "codes",
      "logs",
      "usageLogs",
    ]) {
      if (Array.isArray(data[key])) return data[key] as unknown[];
    }
  }
  if (Array.isArray(raw)) return raw;
  return [];
}

function requestOptions(token?: string) {
  if (!token) {
    return { skipExpireRedirect: true };
  }
  return {
    skipAuth: true,
    skipExpireRedirect: true,
    headers: { Authorization: `Bearer ${token}` },
  };
}

function failIfUnsuccessful<T>(result: ApiResult<T>): ApiResult<T> {
  return result;
}

function extractAccessToken(raw: unknown): string | null {
  const root = isRecord(raw) ? raw : null;
  const data = isRecord(unwrapData(raw))
    ? (unwrapData(raw) as Record<string, unknown>)
    : root;
  const authorization = nestedRecord(data, ["authorization"]) ??
    nestedRecord(root, ["authorization"]);

  return (
    pickString(data, ["accessToken", "token", "access_token"]) ??
    pickString(authorization, ["token", "accessToken"]) ??
    pickString(root, ["accessToken", "token"])
  );
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function mapProperty(raw: unknown): SecurityPropertySummary | null {
  if (typeof raw === "string") {
    const id = raw.trim();
    if (!isUuid(id)) return null;
    return { id, name: "Assigned property" };
  }
  if (!isRecord(raw)) return null;
  const nested = nestedRecord(raw, ["property"]);
  if (nested) {
    const nestedMapped = mapProperty(nested);
    if (nestedMapped) {
      return {
        id: nestedMapped.id,
        name:
          pickString(nested, ["name", "propertyName", "title"]) ??
          nestedMapped.name,
      };
    }
  }
  const id =
    pickString(raw, ["propertyId", "assignedPropertyId", "property_id"]) ??
    pickString(raw, ["id"]);
  if (!id || !isUuid(id)) return null;
  return {
    id,
    name:
      pickString(raw, ["name", "propertyName", "title"]) ?? "Assigned property",
  };
}

const PROPERTY_COLLECTION_KEYS = new Set([
  "property",
  "assignedProperty",
  "properties",
  "assignedProperties",
  "propertyIds",
  "security",
  "securities",
  "assignments",
]);

function collectProperties(raw: unknown): SecurityPropertySummary[] {
  const seen = new Map<string, SecurityPropertySummary>();
  const add = (value: unknown) => {
    const mapped = mapProperty(value);
    if (mapped && !seen.has(mapped.id)) seen.set(mapped.id, mapped);
  };

  const walk = (value: unknown, depth = 0, fromPropertyKey = false) => {
    if (depth > 8 || value == null) return;
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (fromPropertyKey) add(item);
        walk(item, depth + 1, fromPropertyKey);
      });
      return;
    }
    if (!isRecord(value)) return;

    const directId = pickString(value, [
      "propertyId",
      "assignedPropertyId",
      "property_id",
    ]);
    if (directId && isUuid(directId) && !seen.has(directId)) {
      seen.set(directId, {
        id: directId,
        name:
          pickString(value, ["propertyName", "name", "title"]) ??
          "Assigned property",
      });
    }

    for (const [key, child] of Object.entries(value)) {
      const propertyKey = PROPERTY_COLLECTION_KEYS.has(key);
      if (propertyKey) add(child);
      if (isRecord(child) || Array.isArray(child)) {
        walk(child, depth + 1, propertyKey || fromPropertyKey);
      }
    }
  };

  walk(raw);
  return Array.from(seen.values());
}

function mapOfficer(raw: unknown): SecurityOfficerProfile {
  const data = isRecord(unwrapData(raw))
    ? (unwrapData(raw) as Record<string, unknown>)
    : isRecord(raw)
      ? raw
      : {};
  const user = nestedRecord(data, ["user"]) ?? data;
  const picture =
    nestedRecord(user, ["profilePicture"]) ??
    nestedRecord(data, ["profilePicture"]);

  return {
    id: pickString(user, ["id", "userId"]) ?? pickString(data, ["id"]) ?? "",
    fullName:
      pickString(user, ["fullName", "name", "displayName"]) ??
      pickString(data, ["fullName", "name"]) ??
      "Security officer",
    email: pickString(user, ["email"]) ?? pickString(data, ["email"]) ?? "",
    phoneNumber:
      pickString(user, ["phoneNumber", "phone"]) ??
      pickString(data, ["phoneNumber", "phone"]) ??
      "",
    avatarUrl: pickString(picture, ["url"]) ?? undefined,
  };
}

function mapPersonnel(
  raw: unknown,
  propertyName: string,
): SecurityPersonnel | null {
  if (!isRecord(raw) && typeof raw !== "string") return null;
  const record = isRecord(raw) ? raw : { id: raw };
  const nestedUser = nestedRecord(record, ["user", "security"]);
  const user = nestedUser ?? record;
  const id =
    pickString(record, ["id", "securityId", "userId"]) ??
    pickString(user, ["id", "userId", "securityId"]);
  const phoneNumber =
    pickString(user, ["phoneNumber", "phone"]) ??
    pickString(record, ["phoneNumber", "phone"]);
  if (!id && !phoneNumber) return null;
  const picture =
    nestedRecord(user, ["profilePicture"]) ??
    nestedRecord(record, ["profilePicture"]);
  const assigned =
    mapProperty(record.property) ??
    mapProperty(nestedRecord(record, ["assignedProperty"]));

  return {
    id: id ?? `security-${phoneNumber}`,
    name:
      pickString(user, ["fullName", "name"]) ??
      pickString(record, ["fullName", "name"]) ??
      "Security officer",
    email: pickString(user, ["email"]) ?? pickString(record, ["email"]) ?? "",
    phoneNumber: phoneNumber ?? "",
    assignedProperty: assigned?.name ?? propertyName,
    avatarUrl: pickString(picture, ["url"]) ?? undefined,
  };
}

function inferCodeType(record: Record<string, unknown>): "visitor" | "resident" {
  const raw =
    pickString(record, ["type", "codeType", "kind"])?.toLowerCase() ?? "";
  if (raw.includes("resident") || raw.includes("permanent")) return "resident";
  return "visitor";
}

function inferCodeStatus(
  record: Record<string, unknown>,
): AccessCodeRecord["status"] {
  const raw =
    pickString(record, ["status"])?.toLowerCase() ?? "";
  if (raw.includes("revok")) return "revoked";
  if (raw.includes("used") || raw.includes("expired") || raw.includes("inactive")) {
    return "used";
  }
  if (record.isRevoked === true || record.revoked === true) return "revoked";
  if (record.used === true || record.isUsed === true || record.isExpired === true) {
    return "used";
  }
  return "active";
}

function mapAccessCode(raw: unknown): AccessCodeRecord | null {
  if (!isRecord(raw)) return null;
  const unit = nestedRecord(raw, ["unit"]);
  const property = nestedRecord(raw, ["property"]) ?? nestedRecord(unit, ["property"]);
  const creator = nestedRecord(raw, ["createdBy", "creator", "user"]);
  const unitName = pickString(unit, ["name"]) ?? pickString(raw, ["unitName"]);
  const propertyName = pickString(property, ["name"]) ?? pickString(raw, ["propertyName"]);
  const roleName =
    pickString(nestedRecord(creator, ["role"]), ["name"])?.toLowerCase() ??
    pickString(creator, ["role"])?.toLowerCase() ??
    "";

  const usageCount =
    asString(raw.usageCount) ??
    asString(raw.uses) ??
    asString(raw.usedCount);
  const maxUsage = asString(raw.maxUsage) ?? asString(raw.maxUses);
  const expiresAt =
    pickString(raw, ["expiresAt", "expiryDate", "validUntil", "validity"]);

  return {
    id: pickString(raw, ["id"]) ?? `code-${pickString(raw, ["code"]) ?? Date.now()}`,
    code: pickString(raw, ["code", "accessCode", "pin"]) ?? "------",
    name:
      pickString(raw, ["name", "recipient", "label", "visitorName"]) ??
      "Access code",
    unitLabel: [unitName, propertyName].filter(Boolean).join(", ") || "—",
    unitId: pickString(unit, ["id"]) ?? pickString(raw, ["unitId"]),
    type: inferCodeType(raw),
    status: inferCodeStatus(raw),
    validity: expiresAt ?? (inferCodeStatus(raw) === "used" ? "Used" : "Active"),
    usage:
      usageCount || maxUsage
        ? `${usageCount ?? "0"} / ${maxUsage ?? "∞"} Uses`
        : "—",
    createdBy: roleName.includes("tenant")
      ? "tenant"
      : roleName.includes("manager")
        ? "manager"
        : "landlord",
    createdAt: pickString(raw, ["createdAt"]),
  };
}

function inferLogOutcome(
  record: Record<string, unknown>,
): AccessCodeLog["outcome"] {
  const raw =
    pickString(record, ["outcome", "status", "result"])?.toLowerCase() ?? "";
  if (
    raw.includes("den") ||
    raw.includes("fail") ||
    raw.includes("invalid") ||
    raw.includes("reject")
  ) {
    return "denied";
  }
  if (record.success === false || record.granted === false) return "denied";
  return "granted";
}

function mapAccessLog(raw: unknown): AccessCodeLog | null {
  if (!isRecord(raw)) return null;
  const accessCode = nestedRecord(raw, ["accessCode", "code"]);
  const unit = nestedRecord(raw, ["unit"]) ?? nestedRecord(accessCode, ["unit"]);
  const property =
    nestedRecord(raw, ["property"]) ?? nestedRecord(unit, ["property"]);
  const usedBy =
    nestedRecord(raw, ["usedBy", "security", "confirmedBy", "officer"]) ??
    nestedRecord(nestedRecord(raw, ["security"]), ["user"]);
  const timestamp =
    pickString(raw, [
      "usedAt",
      "createdAt",
      "timestamp",
      "scannedAt",
      "loggedAt",
    ]) ?? new Date().toISOString();
  const unitName = pickString(unit, ["name"]);
  const propertyName = pickString(property, ["name"]);

  return {
    id: pickString(raw, ["id"]) ?? `log-${timestamp}`,
    timestamp,
    person:
      pickString(raw, ["name", "visitorName", "recipient"]) ??
      pickString(accessCode, ["name", "recipient"]) ??
      "Visitor",
    unit: [unitName, propertyName].filter(Boolean).join(", ") || "—",
    code:
      pickString(raw, ["code", "accessCode"]) ??
      pickString(accessCode, ["code"]) ??
      "------",
    confirmedBy:
      pickString(usedBy, ["fullName", "name"]) ??
      pickString(raw, ["confirmedBy", "usedByName"]) ??
      "Security",
    outcome: inferLogOutcome(raw),
    note: pickString(raw, ["note", "reason", "message"]) ?? "",
    securityId:
      pickString(usedBy, ["id"]) ??
      pickString(raw, ["securityId", "usedById"]),
  };
}

function propertiesFromJwt(token: string): SecurityPropertySummary[] {
  try {
    const payloadPart = token.split(".")[1];
    if (!payloadPart) return [];
    const json = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const padded = json + "=".repeat((4 - (json.length % 4)) % 4);
    const payload = JSON.parse(atob(padded)) as Record<string, unknown>;
    return collectProperties(payload);
  } catch {
    return [];
  }
}

function mergeProperties(
  ...lists: SecurityPropertySummary[][]
): SecurityPropertySummary[] {
  const seen = new Map<string, SecurityPropertySummary>();
  for (const list of lists) {
    for (const item of list) {
      const existing = seen.get(item.id);
      if (!existing || existing.name === "Assigned property") {
        seen.set(item.id, item);
      }
    }
  }
  return Array.from(seen.values());
}

async function propertiesFromLandlordBrowserSession(): Promise<
  SecurityPropertySummary[]
> {
  if (typeof window === "undefined") return [];
  const landlordId = window.localStorage.getItem("landlordId");
  if (!landlordId) return [];
  const result = await apiGet<unknown>(
    `/property/landlord/${encodeURIComponent(landlordId)}`,
    { skipExpireRedirect: true },
  );
  if (!result.success) return [];
  return mergeProperties(collectProperties(result.data), unwrapList(result.data)
    .map(mapProperty)
    .filter((item): item is SecurityPropertySummary => Boolean(item)));
}

async function propertiesMatchingOfficerPhone(
  phoneNumber: string,
): Promise<SecurityPropertySummary[]> {
  const wanted = securityPhoneKey(phoneNumber);
  if (!wanted) return [];
  const properties = await propertiesFromLandlordBrowserSession();
  if (properties.length === 0) return [];
  const hits = await Promise.all(
    properties.map(async (property) => {
      const result = await apiGet<unknown>(
        `/security/property/${encodeURIComponent(property.id)}`,
        { skipExpireRedirect: true },
      );
      if (!result.success) return null;
      const raw = unwrapData(result.data);
      const items = unwrapList(result.data);
      const team = items.length > 0 ? items : raw != null ? [raw] : [];
      const assigned = team.some((item) => {
        const person = mapPersonnel(item, property.name);
        return Boolean(person && securityPhoneKey(person.phoneNumber) === wanted);
      });
      return assigned ? property : null;
    }),
  );
  return hits.filter((item): item is SecurityPropertySummary => Boolean(item));
}

async function probeAssignedProperties(
  token: string,
  candidates: SecurityPropertySummary[],
): Promise<SecurityPropertySummary[]> {
  if (candidates.length === 0) return [];
  const matches = await Promise.all(
    candidates.map(async (property) => {
      const result = await apiGet<unknown>(
        `/security/property/${encodeURIComponent(property.id)}/access-codes`,
        requestOptions(token),
      );
      return result.success ? property : null;
    }),
  );
  return matches.filter((item): item is SecurityPropertySummary => Boolean(item));
}

export const resolveAssignedProperties = async (
  token: string,
  options?: {
    seeds?: unknown[];
    phoneNumber?: string;
    userId?: string;
  },
): Promise<SecurityPropertySummary[]> => {
  const fromSeeds = (options?.seeds ?? []).flatMap((seed) =>
    collectProperties(seed),
  );
  const fromJwt = propertiesFromJwt(token);
  const fromPhone = options?.phoneNumber
    ? recallSecurityAssignments(options.phoneNumber)
    : [];
  let resolved = mergeProperties(fromSeeds, fromJwt);

  const me = await apiGet<unknown>("/user/me", requestOptions(token));
  if (me.success) {
    resolved = mergeProperties(resolved, collectProperties(me.data));
  }

  if (options?.userId) {
    const user = await apiGet<unknown>(
      `/user/${encodeURIComponent(options.userId)}`,
      requestOptions(token),
    );
    if (user.success) {
      resolved = mergeProperties(resolved, collectProperties(user.data));
    }
  }

  if (resolved.length === 0) {
    const fromRoster = options?.phoneNumber
      ? await propertiesMatchingOfficerPhone(options.phoneNumber)
      : [];
    if (fromRoster.length > 0) {
      resolved = fromRoster;
    } else {
      const candidates = mergeProperties(
        fromPhone,
        await propertiesFromLandlordBrowserSession(),
      );
      const probed = await probeAssignedProperties(token, candidates);
      resolved = probed.length > 0 ? probed : fromPhone;
    }
  }

  if (options?.phoneNumber) {
    for (const property of resolved) {
      rememberSecurityAssignment(options.phoneNumber, property);
    }
  }

  return resolved;
};

function parseLoginPayload(raw: unknown): SecurityLoginData | null {
  const token = extractAccessToken(raw);
  if (!token) return null;
  const data = unwrapData(raw);
  const userSource = isRecord(data)
    ? nestedRecord(data, ["user"]) ?? data
    : raw;
  return {
    accessToken: token,
    user: mapOfficer(userSource),
    properties: mergeProperties(collectProperties(raw), propertiesFromJwt(token)),
  };
}

export const loginSecurity = async (
  payload: LoginSecurityPayload,
): Promise<ApiResult<SecurityLoginData>> => {
  const result = await apiPost<unknown>("/security/login", payload, {
    skipAuth: true,
  });
  if (!result.success) return failIfUnsuccessful(result);
  const parsed = parseLoginPayload(result.data);
  if (!parsed) {
    return {
      success: false,
      error: "Invalid security login response",
    };
  }
  parsed.user = {
    ...parsed.user,
    phoneNumber: parsed.user.phoneNumber || payload.phoneNumber,
  };
  parsed.properties = await resolveAssignedProperties(parsed.accessToken, {
    seeds: [result.data],
    phoneNumber: parsed.user.phoneNumber,
    userId: parsed.user.id,
  });
  return { success: true, data: parsed };
};

export const registerSecurityPersonnel = async (
  propertyId: string,
  payload: RegisterSecurityPayload,
  options?: SecurityRequestOptions,
): Promise<ApiResult<SecurityPersonnel>> => {
  const result = await apiPost<unknown>(
    `/security/property/${encodeURIComponent(propertyId)}/register`,
    payload,
    requestOptions(options?.token),
  );
  if (!result.success) return failIfUnsuccessful(result);
  const mapped =
    mapPersonnel(unwrapData(result.data), "Assigned property") ??
    mapPersonnel(result.data, "Assigned property") ?? {
      id: `security-${payload.phoneNumber}`,
      name: "Security officer",
      email: "",
      phoneNumber: payload.phoneNumber,
      assignedProperty: "Assigned property",
    };
  return { success: true, data: mapped };
};

export const removeSecurityPersonnel = async (
  propertyId: string,
  securityId: string,
  options?: SecurityRequestOptions,
): Promise<ApiResult<unknown>> => {
  const result = await apiDelete<unknown>(
    `/security/property/${encodeURIComponent(propertyId)}/${encodeURIComponent(securityId)}`,
    requestOptions(options?.token),
  );
  if (!result.success) return failIfUnsuccessful(result);
  return { success: true, data: unwrapData(result.data) };
};

export const listSecurityPersonnel = async (
  propertyId: string,
  propertyName: string,
  options?: SecurityRequestOptions,
): Promise<ApiResult<SecurityPersonnel[]>> => {
  const result = await apiGet<unknown>(
    `/security/property/${encodeURIComponent(propertyId)}`,
    requestOptions(options?.token),
  );
  if (!result.success) return failIfUnsuccessful(result);
  const mapped = unwrapList(result.data)
    .map((item) => mapPersonnel(item, propertyName))
    .filter((item): item is SecurityPersonnel => Boolean(item));
  return { success: true, data: mapped };
};

export const generateAccessCode = async (
  unitId: string,
  name: string,
  options?: SecurityRequestOptions,
): Promise<ApiResult<AccessCodeRecord>> => {
  const result = await apiPost<unknown>(
    `/security/unit/${encodeURIComponent(unitId)}/access-code`,
    { name },
    requestOptions(options?.token),
  );
  if (!result.success) return failIfUnsuccessful(result);
  const mapped =
    mapAccessCode(unwrapData(result.data)) ?? mapAccessCode(result.data);
  if (!mapped) {
    return {
      success: false,
      error: "Invalid access-code response",
    };
  }
  return { success: true, data: mapped };
};

export const getAccessCodes = async (
  propertyId: string,
  options?: SecurityRequestOptions,
): Promise<ApiResult<AccessCodeRecord[]>> => {
  const result = await apiGet<unknown>(
    `/security/property/${encodeURIComponent(propertyId)}/access-codes`,
    requestOptions(options?.token),
  );
  if (!result.success) return failIfUnsuccessful(result);
  return {
    success: true,
    data: unwrapList(result.data)
      .map(mapAccessCode)
      .filter((item): item is AccessCodeRecord => Boolean(item)),
  };
};

export const useAccessCode = async (
  propertyId: string,
  code: string,
  options?: SecurityRequestOptions,
): Promise<ApiResult<AccessCodeRecord>> => {
  const result = await apiPost<unknown>(
    `/security/property/${encodeURIComponent(propertyId)}/access-codes/use`,
    { code },
    requestOptions(options?.token),
  );
  if (!result.success) return failIfUnsuccessful(result);
  const mapped =
    mapAccessCode(unwrapData(result.data)) ?? mapAccessCode(result.data);
  if (!mapped) {
    return {
      success: true,
      data: {
        id: `used-${code}`,
        code,
        name: "Visitor",
        unitLabel: "—",
        unitId: null,
        type: "visitor",
        status: "used",
        validity: "Used",
        usage: "—",
        createdBy: "landlord",
        createdAt: new Date().toISOString(),
      },
    };
  }
  return { success: true, data: mapped };
};

export const getAccessCodeLogs = async (
  propertyId: string,
  options?: SecurityRequestOptions,
): Promise<ApiResult<AccessCodeLog[]>> => {
  const result = await apiGet<unknown>(
    `/security/property/${encodeURIComponent(propertyId)}/access-code-logs`,
    requestOptions(options?.token),
  );
  if (!result.success) return failIfUnsuccessful(result);
  return {
    success: true,
    data: unwrapList(result.data)
      .map(mapAccessLog)
      .filter((item): item is AccessCodeLog => Boolean(item)),
  };
};
