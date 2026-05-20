/** Match `GET /tenant` records to a property / its units (used admin property + unit views). */

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null;
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

export function tenantRecordBelongsToProperty(
  tenant: Record<string, unknown>,
  propertyId: string,
  unitIds: Set<string>,
  unitNamesLower: Set<string>,
): boolean {
  const pid =
    tenant.propertyId ??
    asRecord(tenant.property)?.id ??
    asRecord(tenant.currentProperty)?.id;
  if (pid != null && String(pid) === propertyId) return true;

  const currentUnit = asRecord(tenant.currentUnit);
  if (currentUnit) {
    const cup =
      currentUnit.propertyId ?? asRecord(currentUnit.property)?.id;
    if (cup != null && String(cup) === propertyId) return true;
    const uid = readString(currentUnit.id);
    if (uid && unitIds.has(uid)) return true;
    const unm = readString(currentUnit.name)?.trim().toLowerCase();
    if (unm && unitNamesLower.has(unm)) return true;
  }

  const leases = tenant.leases;
  if (Array.isArray(leases)) {
    for (const raw of leases) {
      const lease = asRecord(raw);
      if (!lease) continue;
      const unit = asRecord(lease.unit);
      if (!unit) continue;
      const up = unit.propertyId ?? asRecord(unit.property)?.id;
      if (up != null && String(up) === propertyId) return true;
      const uid = readString(unit.id);
      if (uid && unitIds.has(uid)) return true;
      const unm = readString(unit.name)?.trim().toLowerCase();
      if (unm && unitNamesLower.has(unm)) return true;
    }
  }

  return false;
}

/** True if a `GET /tenant` row references any property in the set (by id on tenant, unit, leases, etc.). */
export function tenantRecordReferencesPropertyInSet(
  tenant: Record<string, unknown>,
  propertyIds: Set<string>,
): boolean {
  const inSet = (id: unknown) =>
    id != null && propertyIds.has(String(id));

  if (inSet(tenant.propertyId)) return true;

  const prop = asRecord(tenant.property);
  if (prop && inSet(prop.id)) return true;

  const curP = asRecord(tenant.currentProperty);
  if (curP && inSet(curP.id)) return true;

  const cu = asRecord(tenant.currentUnit);
  if (cu) {
    if (inSet(cu.propertyId)) return true;
    const up = asRecord(cu.property);
    if (up && inSet(up.id)) return true;
  }

  const leases = tenant.leases;
  if (Array.isArray(leases)) {
    for (const raw of leases) {
      const lease = asRecord(raw);
      const unit = lease ? asRecord(lease.unit) : null;
      if (unit) {
        if (inSet(unit.propertyId)) return true;
        const up = asRecord(unit.property);
        if (up && inSet(up.id)) return true;
      }
    }
  }

  return false;
}

export function buildUnitIndexSets(units: Record<string, unknown>[]): {
  unitIds: Set<string>;
  unitNamesLower: Set<string>;
} {
  const unitIds = new Set<string>();
  const unitNamesLower = new Set<string>();
  for (const u of units) {
    const id = readString(u.id);
    if (id) unitIds.add(id);
    const n = readString(u.name)?.trim().toLowerCase();
    if (n) unitNamesLower.add(n);
  }
  return { unitIds, unitNamesLower };
}

export function resolveTenantUnitLabel(
  tenant: Record<string, unknown>,
  units: Record<string, unknown>[],
): string {
  const cu = asRecord(tenant.currentUnit);
  if (cu) {
    const name = readString(cu.name);
    if (name) return name;
    const id = readString(cu.id);
    if (id) {
      const found = units.find((x) => readString(x.id) === id);
      const fn = found ? readString(found.name) : undefined;
      if (fn) return fn;
    }
  }
  const leases = tenant.leases;
  if (Array.isArray(leases)) {
    for (const raw of leases) {
      const lease = asRecord(raw);
      const u = lease ? asRecord(lease.unit) : null;
      if (u) {
        const n = readString(u.name);
        if (n) return n;
      }
    }
  }
  return "—";
}
