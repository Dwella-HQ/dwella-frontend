import { apiGet } from "@/lib/apiClient";

export type ChatContactDTO = {
  id: string;
  role: "tenant" | "property_manager" | "landlord";
  roleLabel: string;
  name: string;
  subtitle: string;
  properties: string[];
  unit?: string;
};

type GetChatContactsParams = {
  role: string;
  roleId: string;
  userId?: string | number;
};

type GetChatContactsResult =
  | { success: true; data: ChatContactDTO[] }
  | { success: false; error: string };

type ApiResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; statusCode?: number };

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

const asString = (value: unknown): string =>
  typeof value === "string" || typeof value === "number" ? String(value) : "";

const getNestedRecord = (
  record: Record<string, unknown>,
  key: string,
): Record<string, unknown> => asRecord(record[key]);

const unwrapData = (value: unknown): unknown => {
  const record = asRecord(value);
  return "data" in record && record.data !== undefined && record.data !== null
    ? record.data
    : value;
};

const unwrapArray = (value: unknown): unknown[] => {
  const unwrapped = unwrapData(value);
  if (Array.isArray(unwrapped)) return unwrapped;

  const record = asRecord(unwrapped);
  const keys = ["items", "results", "rows", "records", "users", "data"];
  for (const key of keys) {
    const item = record[key];
    if (Array.isArray(item)) return item;
    const nested = asRecord(item);
    for (const nestedKey of keys) {
      const nestedItem = nested[nestedKey];
      if (Array.isArray(nestedItem)) return nestedItem;
    }
  }

  return [];
};

const makeLabel = (
  record: Record<string, unknown>,
  fallback: string,
): string => {
  const user = getNestedRecord(record, "user");
  return (
    asString(record.fullName) ||
    asString(record.name) ||
    asString(record.landLordName) ||
    asString(record.businessName) ||
    asString(user.fullName) ||
    asString(user.name) ||
    asString(record.email) ||
    asString(record.businessEmail) ||
    asString(user.email) ||
    fallback
  );
};

const makeSubtitle = (
  record: Record<string, unknown>,
  fallback: string,
): string => {
  const user = getNestedRecord(record, "user");
  return (
    asString(record.email) ||
    asString(record.businessEmail) ||
    asString(user.email) ||
    asString(record.phoneNumber) ||
    asString(record.phone) ||
    asString(record.businessPhoneNumber) ||
    asString(user.phoneNumber) ||
    fallback
  );
};

const getPropertyName = (value: unknown): string => {
  const property = asRecord(value);
  return (
    asString(property.name) ||
    asString(property.propertyName) ||
    asString(property.title)
  );
};

const getRecordPropertyNames = (record: Record<string, unknown>): string[] => {
  const properties = record.properties;
  if (Array.isArray(properties)) {
    return properties.map(getPropertyName).filter(Boolean);
  }

  const property = getNestedRecord(record, "property");
  const propertyName = getPropertyName(property);
  return propertyName ? [propertyName] : [];
};

const getTenantPropertyNames = (tenant: Record<string, unknown>): string[] => {
  const currentUnit = getNestedRecord(tenant, "currentUnit");
  const property = getNestedRecord(currentUnit, "property");
  const propertyName = getPropertyName(property);
  return propertyName ? [propertyName] : getRecordPropertyNames(tenant);
};

const getTenantUnitName = (tenant: Record<string, unknown>): string => {
  const currentUnit = getNestedRecord(tenant, "currentUnit");
  return asString(currentUnit.name) || asString(tenant.unitName);
};

const tenantToContact = (value: unknown): ChatContactDTO | null => {
  const tenant = asRecord(value);
  const id = asString(tenant.id);
  if (!id) return null;

  return {
    id,
    role: "tenant",
    roleLabel: "Tenant",
    name: makeLabel(tenant, "Tenant"),
    subtitle: makeSubtitle(tenant, "Tenant"),
    properties: getTenantPropertyNames(tenant),
    unit: getTenantUnitName(tenant),
  };
};

const managerToContact = (value: unknown): ChatContactDTO | null => {
  const manager = asRecord(value);
  const id = asString(manager.id);
  if (!id) return null;

  return {
    id,
    role: "property_manager",
    roleLabel: "Property Manager",
    name: makeLabel(manager, "Property Manager"),
    subtitle: makeSubtitle(manager, "Property Manager"),
    properties: getRecordPropertyNames(manager),
  };
};

const landlordToContact = (value: unknown): ChatContactDTO | null => {
  const landlord = asRecord(value);
  const id = asString(landlord.id);
  if (!id) return null;

  return {
    id,
    role: "landlord",
    roleLabel: "Landlord",
    name: makeLabel(landlord, "Landlord"),
    subtitle: makeSubtitle(landlord, "Landlord"),
    properties: getRecordPropertyNames(landlord),
  };
};

const fetchArray = async <T>(
  endpoint: string,
  mapper: (value: unknown) => T | null,
): Promise<ApiResult<T[]>> => {
  const result = await apiGet<unknown>(endpoint);
  if (!result.success) return result;

  return {
    success: true,
    data: unwrapArray(result.data).map(mapper).filter(Boolean) as T[],
  };
};

const fetchOne = async <T>(
  endpoint: string,
  mapper: (value: unknown) => T | null,
): Promise<ApiResult<T | null>> => {
  const result = await apiGet<unknown>(endpoint);
  if (!result.success) return result;

  return {
    success: true,
    data: mapper(unwrapData(result.data)),
  };
};

const fetchRaw = async (
  endpoint: string,
): Promise<ApiResult<Record<string, unknown>>> => {
  const result = await apiGet<unknown>(endpoint);
  if (!result.success) return result;
  return { success: true, data: asRecord(unwrapData(result.data)) };
};

const readId = (value: unknown): string => asString(asRecord(value).id);

const getManagerPropertyIds = (manager: Record<string, unknown>): string[] => {
  const properties = manager.properties;
  if (!Array.isArray(properties)) return [];
  return properties.map(readId).filter(Boolean);
};

const getTenantPropertyId = (tenant: Record<string, unknown>): string => {
  const currentUnit = getNestedRecord(tenant, "currentUnit");
  const property = getNestedRecord(currentUnit, "property");
  return asString(property.id);
};

const getTenantUnitId = (tenant: Record<string, unknown>): string => {
  const currentUnit = getNestedRecord(tenant, "currentUnit");
  return asString(currentUnit.id);
};

const getPropertyLandlordId = (property: Record<string, unknown>): string =>
  asString(property.landlordId) ||
  asString(getNestedRecord(property, "landlord").id);

const uniqueContacts = (
  contacts: ChatContactDTO[],
  self?: { role: string; roleId: string },
): ChatContactDTO[] => {
  const byKey = new Map<string, ChatContactDTO>();
  contacts.forEach((contact) => {
    if (self?.role === contact.role && self.roleId === contact.id) return;
    byKey.set(`${contact.role}:${contact.id}`, contact);
  });
  return Array.from(byKey.values()).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
};

export const getChatContacts = async ({
  role,
  roleId,
  userId,
}: GetChatContactsParams): Promise<GetChatContactsResult> => {
  const contacts: ChatContactDTO[] = [];
  const failures: string[] = [];

  const addResult = <T>(
    label: string,
    result: ApiResult<T>,
    onSuccess: (data: T) => void,
  ) => {
    if (result.success) {
      onSuccess(result.data);
    } else {
      failures.push(`${label}: ${result.error}`);
    }
  };

  if (role === "landlord") {
    const [tenants, managers] = await Promise.all([
      fetchArray(`/tenant/landlord/${roleId}`, tenantToContact),
      fetchArray(`/property-manager/landlord/${roleId}`, managerToContact),
    ]);

    addResult("tenants", tenants, (data) => contacts.push(...data));
    addResult("property managers", managers, (data) => contacts.push(...data));
  } else if (role === "property_manager") {
    const manager = await fetchRaw(`/property-manager/${roleId}`);

    if (manager.success) {
      const landlordId = readId(manager.data.landlord);
      if (landlordId) {
        const [landlord, tenants] = await Promise.all([
          fetchOne(`/landlord/${landlordId}`, landlordToContact),
          fetchArray(`/tenant/landlord/${landlordId}`, tenantToContact),
        ]);

        addResult("landlord", landlord, (data) => {
          if (data) contacts.push(data);
        });
        addResult("tenants", tenants, (data) => contacts.push(...data));
      } else {
        const propertyIds = getManagerPropertyIds(manager.data);
        const tenantResults = await Promise.all(
          propertyIds.map((propertyId) =>
            fetchArray(`/tenant/property/${propertyId}`, tenantToContact),
          ),
        );
        tenantResults.forEach((result) =>
          addResult("tenants", result, (data) => contacts.push(...data)),
        );
      }
    } else {
      failures.push(`property manager: ${manager.error}`);
    }
  } else if (role === "tenant") {
    const tenant =
      userId !== undefined
        ? await fetchRaw(`/tenant/user/${userId}`)
        : await fetchRaw(`/tenant/${roleId}`);

    if (tenant.success) {
      const propertyId = getTenantPropertyId(tenant.data);
      const unitId = getTenantUnitId(tenant.data);

      if (propertyId) {
        const [property, managers] = await Promise.all([
          fetchRaw(`/property/${propertyId}`),
          fetchArray(
            `/property-manager/property/${propertyId}`,
            managerToContact,
          ),
        ]);

        if (property.success) {
          const landlordId = getPropertyLandlordId(property.data);
          if (landlordId) {
            const landlord = await fetchOne(
              `/landlord/${landlordId}`,
              landlordToContact,
            );
            addResult("landlord", landlord, (data) => {
              if (data) contacts.push(data);
            });
          }
        } else {
          failures.push(`property: ${property.error}`);
        }

        addResult("property managers", managers, (data) =>
          contacts.push(...data),
        );
      } else if (unitId) {
        const tenants = await fetchArray(
          `/tenant/unit/${unitId}`,
          tenantToContact,
        );
        addResult("unit tenants", tenants, (data) => contacts.push(...data));
      }
    } else {
      failures.push(`tenant: ${tenant.error}`);
    }
  }

  const data = uniqueContacts(contacts, { role, roleId });

  if (data.length === 0 && failures.length > 0) {
    return { success: false, error: failures.join("; ") };
  }

  return { success: true, data };
};
