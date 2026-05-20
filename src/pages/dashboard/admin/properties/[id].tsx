import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import * as React from "react";
import { useRouter } from "next/router";
import { ArrowLeft, Download, Home, MapPin, Waves } from "lucide-react";
import type { NextPageWithLayout } from "@/pages/_app";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { RecentPayments } from "@/components/RecentPayments";
import { MaintenanceRequests } from "@/components/MaintenanceRequests";
import { ADMIN_STAT_BG, ADMIN_STAT_LABEL } from "@/lib/adminDesignTokens";
import { getProperty, updateProperty, type PropertyDTO } from "@/api/properties";
import { getUnitsByProperty, type UnitDTO } from "@/api/units";
import { getTenantList } from "@/api/tenants";
import type { TenantRecordDTO } from "@/api/tenants/tenants.schema";
import {
  buildUnitIndexSets,
  resolveTenantUnitLabel,
  tenantRecordBelongsToProperty,
} from "@/lib/admin/tenantPropertyMatch";
import { getRentPayments } from "@/api/rent-payment";
import { getMaintenanceRequests } from "@/api/maintenance";
import type {
  MaintenanceRequest,
  MaintenanceRequestWithDetails,
  Payment,
} from "@/data/mockLandlordData";
import { useToast } from "@/components/Toast";

function formatAddress(property: PropertyDTO | null): string {
  if (!property?.address) return "Address unavailable";
  const a = property.address;
  return [a.address, a.street, a.city, a.state].filter(Boolean).join(", ");
}

function getPhotos(property: PropertyDTO | null): string[] {
  if (!property?.photos?.length) return [];
  return property.photos.map((p) => p.url).filter((u): u is string => !!u);
}

function getYearBuilt(property: PropertyDTO | null): string {
  if (!property?.yearBuilt) return "—";
  return String(property.yearBuilt);
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null;
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function readNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function getPropertyUnits(
  property: PropertyDTO | null,
): Record<string, unknown>[] {
  if (!property?.units || !Array.isArray(property.units)) return [];
  return property.units
    .map((unit) => asRecord(unit))
    .filter((unit): unit is Record<string, unknown> => unit !== null);
}

function unitStatusLabel(unit: Record<string, unknown>): string {
  const status = readString(unit.status);
  if (status) return status;
  const isAvailable = unit.isAvailable;
  if (isAvailable === true) return "Available";
  if (isAvailable === false) return "Occupied";
  return "—";
}

function getUnitTenant(
  unit: Record<string, unknown>,
): Record<string, unknown> | null {
  const direct = asRecord(unit.tenant) ?? asRecord(unit.currentTenant);
  if (direct) return direct;
  const lease = asRecord(unit.currentLease);
  if (!lease) return null;
  return asRecord(lease.tenant);
}

const AdminPropertyDetailPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { showToast } = useToast();
  const { id, mode: modeQuery } = router.query;
  const propertyId = typeof id === "string" ? id : null;
  const isEditMode =
    router.isReady &&
    typeof modeQuery === "string" &&
    modeQuery.toLowerCase() === "edit";

  const [tab, setTab] = React.useState<
    "overview" | "units" | "tenants" | "payments" | "maintenance" | "documents"
  >("overview");
  const [property, setProperty] = React.useState<PropertyDTO | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [unitsFromApi, setUnitsFromApi] = React.useState<UnitDTO[]>([]);
  const [overviewRentPayments, setOverviewRentPayments] = React.useState<
    Payment[]
  >([]);
  const [propertyMaintenanceFromApi, setPropertyMaintenanceFromApi] =
    React.useState<MaintenanceRequestWithDetails[]>([]);
  const [tenantRecords, setTenantRecords] = React.useState<TenantRecordDTO[]>(
    [],
  );

  const [editName, setEditName] = React.useState("");
  const [editDescription, setEditDescription] = React.useState("");
  const [editYearBuilt, setEditYearBuilt] = React.useState("");
  const [editNumberOfUnits, setEditNumberOfUnits] = React.useState("");
  const [editParkingSpace, setEditParkingSpace] = React.useState(false);
  const [editAddrLine, setEditAddrLine] = React.useState("");
  const [editAddrStreet, setEditAddrStreet] = React.useState("");
  const [editAddrCity, setEditAddrCity] = React.useState("");
  const [editAddrState, setEditAddrState] = React.useState("");
  const [editAddrPostal, setEditAddrPostal] = React.useState("");
  const [editAddrCountry, setEditAddrCountry] = React.useState("Nigeria");
  const [editAmenitiesText, setEditAmenitiesText] = React.useState("");
  const [isSavingEdit, setIsSavingEdit] = React.useState(false);

  React.useEffect(() => {
    if (!property) return;
    setEditName(property.name ?? "");
    setEditDescription(property.description ?? "");
    setEditYearBuilt(
      property.yearBuilt != null ? String(property.yearBuilt) : "",
    );
    setEditNumberOfUnits(String(property.numberOfUnits ?? ""));
    setEditParkingSpace(Boolean(property.parkingSpace));
    const a = property.address;
    setEditAddrLine(a?.address ?? "");
    setEditAddrStreet(a?.street ?? "");
    setEditAddrCity(a?.city ?? "");
    setEditAddrState(a?.state ?? "");
    setEditAddrPostal(a?.postalCode ?? "");
    setEditAddrCountry(a?.country ?? "Nigeria");
    setEditAmenitiesText((property.amenities ?? []).join(", "));
  }, [property]);

  const exitEditMode = React.useCallback(() => {
    if (!propertyId) return;
    void router.replace(`/dashboard/admin/properties/${propertyId}`, undefined, {
      shallow: true,
    });
  }, [propertyId, router]);

  const handleSavePropertyEdit = React.useCallback(async () => {
    if (!propertyId || !property) return;
    const name = editName.trim();
    if (!name) {
      showToast("Property name is required.", "error");
      return;
    }
    const city = editAddrCity.trim();
    const state = editAddrState.trim();
    const addrLine = editAddrLine.trim();
    if (!addrLine || !city || !state) {
      showToast(
        "Address line, city, and state are required to save.",
        "error",
      );
      return;
    }
    const numUnits = Number.parseInt(editNumberOfUnits, 10);
    if (!Number.isFinite(numUnits) || numUnits < 0) {
      showToast("Number of units must be a valid non-negative number.", "error");
      return;
    }
    let yearBuiltPayload: string | undefined;
    const yb = editYearBuilt.trim();
    if (yb.length > 0) {
      if (yb.length !== 4 || !/^\d{4}$/.test(yb)) {
        showToast("Year built must be exactly 4 digits (e.g. 2019).", "error");
        return;
      }
      yearBuiltPayload = yb;
    }

    const amenities = editAmenitiesText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const landlordId =
      property.landlordId ?? property.landlord?.id ?? undefined;

    setIsSavingEdit(true);
    const result = await updateProperty(propertyId, {
      ...(landlordId ? { landlordId } : {}),
      name,
      description: editDescription.trim() || undefined,
      yearBuilt: yearBuiltPayload,
      numberOfUnits: numUnits,
      parkingSpace: editParkingSpace,
      amenities,
      address: {
        address: addrLine,
        street: editAddrStreet.trim() || undefined,
        city,
        state,
        postalCode: editAddrPostal.trim() || undefined,
        country: editAddrCountry.trim() || "Nigeria",
      },
    });
    setIsSavingEdit(false);

    if (!result.success) {
      showToast(result.error || "Failed to update property.", "error");
      return;
    }

    setProperty(result.data);
    showToast("Property updated.", "success");
    exitEditMode();
  }, [
    editAddrCity,
    editAddrCountry,
    editAddrLine,
    editAddrPostal,
    editAddrState,
    editAddrStreet,
    editAmenitiesText,
    editDescription,
    editName,
    editNumberOfUnits,
    editParkingSpace,
    editYearBuilt,
    exitEditMode,
    property,
    propertyId,
    showToast,
  ]);

  const tabs = [
    "overview",
    "units",
    "tenants",
    "payments",
    "maintenance",
    "documents",
  ] as const;
  const photos = React.useMemo(() => getPhotos(property), [property]);
  const mainImage =
    photos[0] ??
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200";
  const title = property?.name || "Property details";
  const address = formatAddress(property);
  const embeddedUnits = React.useMemo(
    () => getPropertyUnits(property),
    [property],
  );
  const units = React.useMemo<Record<string, unknown>[]>(() => {
    if (unitsFromApi.length > 0) {
      return unitsFromApi.map((u) => u as unknown as Record<string, unknown>);
    }
    return embeddedUnits;
  }, [unitsFromApi, embeddedUnits]);
  const unitsCount =
    unitsFromApi.length > 0
      ? unitsFromApi.length
      : (property?.numberOfUnits ?? embeddedUnits.length ?? "—");
  const tenants = React.useMemo(() => {
    type Row = {
      id: string;
      name: string;
      email: string;
      phone: string;
      unitName: string;
      status: string;
    };
    if (!propertyId) return [];

    const fromEmbedded: Row[] = [];
    for (const unit of units) {
      const tenant = getUnitTenant(unit);
      if (!tenant) continue;
      const tid =
        readString(tenant.id) ??
        readString(asRecord(tenant.user)?.id) ??
        readString(tenant.email);
      if (!tid) continue;
      fromEmbedded.push({
        id: tid,
        name:
          readString(tenant.fullName) ??
          readString(tenant.name) ??
          readString(asRecord(tenant.user)?.fullName) ??
          readString(tenant.email) ??
          "—",
        email:
          readString(tenant.email) ??
          readString(asRecord(tenant.user)?.email) ??
          "—",
        phone:
          readString(tenant.phoneNumber) ??
          readString(tenant.phone) ??
          readString(asRecord(tenant.user)?.phoneNumber) ??
          "—",
        unitName:
          readString(unit.name) ??
          readString(unit.unitNumber) ??
          readString(unit.code) ??
          "—",
        status: unitStatusLabel(unit),
      });
    }

    const { unitIds, unitNamesLower } = buildUnitIndexSets(units);

    const fromTenantApi: Row[] = [];
    for (const tr of tenantRecords) {
      const r = tr as Record<string, unknown>;
      if (
        !tenantRecordBelongsToProperty(
          r,
          propertyId,
          unitIds,
          unitNamesLower,
        )
      ) {
        continue;
      }
      const tid = readString(r.id);
      if (!tid) continue;
      fromTenantApi.push({
        id: tid,
        name:
          readString(r.fullName) ??
          readString(r.name) ??
          readString(asRecord(r.user)?.fullName) ??
          readString(asRecord(r.user)?.email) ??
          "—",
        email:
          readString(r.email) ?? readString(asRecord(r.user)?.email) ?? "—",
        phone:
          readString(r.phoneNumber) ??
          readString(r.phone) ??
          readString(asRecord(r.user)?.phoneNumber) ??
          "—",
        unitName: resolveTenantUnitLabel(r, units),
        status: readString(r.status) ?? "Active",
      });
    }

    const merged = new Map<string, Row>();
    for (const row of fromTenantApi) merged.set(row.id, row);
    for (const row of fromEmbedded) merged.set(row.id, row);
    return Array.from(merged.values());
  }, [units, tenantRecords, propertyId]);

  const overviewMonthlyRent = React.useMemo(() => {
    let sum = 0;
    for (const u of units) {
      const n = readNumber((u as Record<string, unknown>).rentAmount);
      if (n != null && n > 0) sum += n;
    }
    if (sum <= 0) return "—";
    return formatMoney(sum);
  }, [units]);

  const overviewOccupancy = React.useMemo(() => {
    if (!propertyId || !units.length) return "—";
    const idx = buildUnitIndexSets(units);
    let occupied = 0;
    for (const unit of units) {
      if (getUnitTenant(unit)) {
        occupied += 1;
        continue;
      }
      const uid = readString(unit.id);
      const uname = readString(unit.name)?.trim().toLowerCase();
      const claimed = tenantRecords.some((tr) => {
        const r = tr as Record<string, unknown>;
        if (
          !tenantRecordBelongsToProperty(
            r,
            propertyId,
            idx.unitIds,
            idx.unitNamesLower,
          )
        ) {
          return false;
        }
        const cu = asRecord(r.currentUnit);
        if (cu) {
          if (uid && readString(cu.id) === uid) return true;
          const cname = readString(cu.name)?.trim().toLowerCase();
          if (uname && cname === uname) return true;
        }
        const leases = r.leases;
        if (!Array.isArray(leases)) return false;
        for (const raw of leases) {
          const lease = asRecord(raw);
          const ut = lease ? asRecord(lease.unit) : null;
          if (ut) {
            if (uid && readString(ut.id) === uid) return true;
            const tname = readString(ut.name)?.trim().toLowerCase();
            if (uname && tname === uname) return true;
          }
        }
        return false;
      });
      if (claimed) {
        occupied += 1;
        continue;
      }
      const ur = unit as Record<string, unknown>;
      if (
        ur.isOccupied === true ||
        ur.isAvailable === false ||
        readString(ur.status)?.toUpperCase() === "OCCUPIED" ||
        readString(ur.status)?.toLowerCase() === "occupied"
      ) {
        occupied += 1;
      }
    }
    return `${Math.round((occupied / units.length) * 100)}%`;
  }, [units, tenantRecords, propertyId]);
  const documents = property?.documents ?? [];
  const propertyNameBase = React.useMemo(
    () =>
      (property?.name ?? "")
        .split(" — ")[0]
        .split(" —")[0]
        .trim()
        .toLowerCase(),
    [property?.name],
  );
  const propertyPayments = React.useMemo(() => {
    if (!propertyId) return [];
    return overviewRentPayments.slice(0, 100).filter((p) => {
      if (p.propertyId && p.propertyId === propertyId) return true;
      return p.propertyName.trim().toLowerCase() === propertyNameBase;
    });
  }, [overviewRentPayments, propertyId, propertyNameBase]);
  const propertyMaintenance = React.useMemo((): MaintenanceRequest[] => {
    return propertyMaintenanceFromApi
      .filter((r) => {
        const n = (r.propertyName ?? "").trim().toLowerCase();
        return n === propertyNameBase || n.includes(propertyNameBase);
      })
      .map((r) => {
        const status: MaintenanceRequest["status"] =
          r.status === "resolved"
            ? "completed"
            : r.status === "in_progress"
              ? "in_progress"
              : "new";
        return {
          id: r.id,
          type: r.type || "Maintenance",
          description: r.subType || r.description || "",
          propertyName: r.propertyName || property?.name || "",
          unit: r.unit || "",
          status,
          priority: r.priority,
          timeAgo: r.reportedTime || "",
        };
      })
      .slice(0, 5);
  }, [propertyMaintenanceFromApi, propertyNameBase, property?.name]);

  React.useEffect(() => {
    if (!router.isReady || !propertyId) return;
    let cancelled = false;
    const run = async () => {
      setIsLoading(true);
      setLoadError(null);
      const result = await getProperty(propertyId);
      if (cancelled) return;
      setIsLoading(false);
      if (!result.success) {
        setLoadError(result.error);
        setProperty(null);
        return;
      }
      setProperty(result.data);
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [router.isReady, propertyId]);

  React.useEffect(() => {
    if (!propertyId) return;
    let cancelled = false;
    void getUnitsByProperty(propertyId).then((result) => {
      if (cancelled) return;
      setUnitsFromApi(result.success ? result.data : []);
    });
    return () => {
      cancelled = true;
    };
  }, [propertyId]);

  React.useEffect(() => {
    if (!propertyId) return;
    let cancelled = false;
    void getRentPayments({ limit: 100 }).then((result) => {
      if (cancelled) return;
      setOverviewRentPayments(result.success ? result.data : []);
    });
    return () => {
      cancelled = true;
    };
  }, [propertyId]);

  React.useEffect(() => {
    if (!propertyId) return;
    let cancelled = false;
    void getMaintenanceRequests({ limit: 100, useLegacyEndpoint: true }).then(
      (result) => {
        if (cancelled) return;
        setPropertyMaintenanceFromApi(result.success ? result.data : []);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [propertyId]);

  React.useEffect(() => {
    if (!propertyId) return;
    let cancelled = false;
    void getTenantList({ limit: 500 }).then((result) => {
      if (cancelled) return;
      setTenantRecords(result.success ? result.data : []);
    });
    return () => {
      cancelled = true;
    };
  }, [propertyId]);

  return (
    <>
      <Head>
        <title>DWELLA NG · Admin Property Detail</title>
      </Head>
      <AdminLayout title="Property Details">
        <section className="space-y-6">
          <div className="rounded-lg border border-[#E2E8F0] bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => router.push("/dashboard/admin/properties")}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[#0F172A] hover:bg-[#F1F5F9]"
                  aria-label="Go back to properties"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <div>
                  <h2 className="text-lg font-semibold">{title}</h2>
                  <p className="inline-flex items-center gap-1 text-xs text-[#64748B]">
                    <MapPin className="h-3 w-3 text-[#2563EB]" />
                    {address}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!isEditMode && propertyId ? (
                  <button
                    type="button"
                    onClick={() =>
                      void router.push(
                        `/dashboard/admin/properties/${propertyId}?mode=edit`,
                      )
                    }
                    className="inline-flex items-center gap-2 rounded-md border border-[#CBD5E1] bg-white px-3 py-1.5 text-xs hover:bg-[#F8FAFC]"
                  >
                    Edit property
                  </button>
                ) : null}
                <button className="inline-flex items-center gap-2 rounded-md border border-[#CBD5E1] px-3 py-1.5 text-xs">
                  <Download className="h-3.5 w-3.5" />
                  Export
                </button>
              </div>
            </div>
            <div className="grid gap-6 border-b border-[#E2E8F0] pb-4 lg:grid-cols-3 lg:items-stretch">
              <div className="lg:col-span-2 flex">
                <div className="flex w-full flex-col gap-4 pr-0 lg:flex-row lg:pr-4">
                  <div className="relative h-[400px] w-full overflow-hidden rounded-lg bg-gray-200 lg:h-[500px] lg:flex-1">
                    <Image
                      src={mainImage}
                      alt="Property"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex flex-row gap-4 lg:flex-col">
                    {(photos.length ? photos.slice(0, 3) : [mainImage]).map(
                      (photo, idx) => (
                        <div
                          key={`${photo}-${idx}`}
                          className="relative h-[100px] flex-1 overflow-hidden rounded-lg bg-gray-200 lg:h-[156px] lg:w-[156px] lg:flex-none"
                        >
                          <Image
                            src={photo}
                            alt={`thumb-${idx + 1}`}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ),
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-col space-y-6 border-l border-[#E2E8F0] pl-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div
                    className="rounded-lg border border-gray-200 p-4"
                    style={{ backgroundColor: ADMIN_STAT_BG.blue }}
                  >
                    <p
                      className="text-[10px] font-semibold uppercase"
                      style={{ color: ADMIN_STAT_LABEL.blue }}
                    >
                      Total Units
                    </p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">
                      {unitsCount}
                    </p>
                  </div>
                  <div
                    className="rounded-lg border border-gray-200 p-4"
                    style={{ backgroundColor: ADMIN_STAT_BG.purple }}
                  >
                    <p
                      className="text-[10px] font-semibold uppercase"
                      style={{ color: ADMIN_STAT_LABEL.purple }}
                    >
                      Monthly Rent
                    </p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">
                      {overviewMonthlyRent}
                    </p>
                  </div>
                  <div
                    className="rounded-lg border border-gray-200 p-4"
                    style={{ backgroundColor: ADMIN_STAT_BG.green }}
                  >
                    <p
                      className="text-[10px] font-semibold uppercase"
                      style={{ color: ADMIN_STAT_LABEL.green }}
                    >
                      Occupancy
                    </p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">
                      {overviewOccupancy}
                    </p>
                  </div>
                  <div
                    className="rounded-lg border border-gray-200 p-4"
                    style={{ backgroundColor: ADMIN_STAT_BG.orange }}
                  >
                    <p
                      className="text-[10px] font-semibold uppercase"
                      style={{ color: ADMIN_STAT_LABEL.orange }}
                    >
                      Landlord
                    </p>
                    <p className="mt-1 text-lg font-semibold text-gray-900">
                      {property?.landlord?.landLordName ||
                        property?.landlord?.user?.fullName ||
                        property?.landlord?.user?.email ||
                        "—"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Built</p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">
                      {getYearBuilt(property)}
                    </p>
                  </div>
                  <div className="h-10 w-px bg-gray-300" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase">
                      Parking Space
                    </p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">
                      {property?.parkingSpace ? "Available" : "N/A"}
                    </p>
                  </div>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <p className="mb-3 text-xs font-semibold uppercase text-gray-700">
                    Amenities
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {(property?.amenities?.length
                      ? property.amenities.map((a) => ({
                          icon: Home,
                          label: a,
                        }))
                      : [{ icon: Waves, label: "No amenities listed yet" }]
                    ).map((item) => (
                      <span
                        key={item.label}
                        className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-gray-700"
                      >
                        <item.icon className="h-3.5 w-3.5 text-gray-500" />
                        {item.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            {isLoading ? (
              <p className="mt-3 text-sm text-[#64748B]">
                Loading property details...
              </p>
            ) : null}
            {loadError ? (
              <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {loadError}
              </p>
            ) : null}

            {isEditMode && property && !loadError ? (
              <div className="mt-4 rounded-lg border border-[#BFDBFE] bg-[#EFF6FF] p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-[#0F172A]">
                    Edit property details
                  </h3>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={exitEditMode}
                      disabled={isSavingEdit}
                      className="rounded-md border border-[#CBD5E1] bg-white px-3 py-1.5 text-xs font-medium text-[#334155] hover:bg-[#F8FAFC] disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleSavePropertyEdit()}
                      disabled={isSavingEdit}
                      className="rounded-md bg-[#1E66FF] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#1857CC] disabled:opacity-50"
                    >
                      {isSavingEdit ? "Saving…" : "Save changes"}
                    </button>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-xs font-medium text-[#334155] sm:col-span-2">
                    Property name *
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="mt-1 w-full rounded-md border border-[#CBD5E1] px-3 py-2 text-sm text-[#0F172A]"
                    />
                  </label>
                  <label className="block text-xs font-medium text-[#334155] sm:col-span-2">
                    Description
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      rows={3}
                      className="mt-1 w-full rounded-md border border-[#CBD5E1] px-3 py-2 text-sm text-[#0F172A]"
                    />
                  </label>
                  <label className="block text-xs font-medium text-[#334155]">
                    Year built (YYYY)
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={4}
                      value={editYearBuilt}
                      onChange={(e) =>
                        setEditYearBuilt(e.target.value.replace(/\D/g, "").slice(0, 4))
                      }
                      placeholder="2019"
                      className="mt-1 w-full rounded-md border border-[#CBD5E1] px-3 py-2 text-sm text-[#0F172A]"
                    />
                  </label>
                  <label className="block text-xs font-medium text-[#334155]">
                    Number of units *
                    <input
                      type="number"
                      min={0}
                      value={editNumberOfUnits}
                      onChange={(e) => setEditNumberOfUnits(e.target.value)}
                      className="mt-1 w-full rounded-md border border-[#CBD5E1] px-3 py-2 text-sm text-[#0F172A]"
                    />
                  </label>
                  <label className="flex items-center gap-2 text-xs font-medium text-[#334155] sm:col-span-2">
                    <input
                      type="checkbox"
                      checked={editParkingSpace}
                      onChange={(e) => setEditParkingSpace(e.target.checked)}
                      className="rounded border-[#CBD5E1]"
                    />
                    Parking space available
                  </label>
                  <div className="sm:col-span-2">
                    <p className="mb-2 text-xs font-semibold uppercase text-[#64748B]">
                      Address
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="block text-xs font-medium text-[#334155] sm:col-span-2">
                        Street / address line *
                        <input
                          type="text"
                          value={editAddrLine}
                          onChange={(e) => setEditAddrLine(e.target.value)}
                          className="mt-1 w-full rounded-md border border-[#CBD5E1] px-3 py-2 text-sm text-[#0F172A]"
                        />
                      </label>
                      <label className="block text-xs font-medium text-[#334155]">
                        Line 2 (optional)
                        <input
                          type="text"
                          value={editAddrStreet}
                          onChange={(e) => setEditAddrStreet(e.target.value)}
                          className="mt-1 w-full rounded-md border border-[#CBD5E1] px-3 py-2 text-sm text-[#0F172A]"
                        />
                      </label>
                      <label className="block text-xs font-medium text-[#334155]">
                        City *
                        <input
                          type="text"
                          value={editAddrCity}
                          onChange={(e) => setEditAddrCity(e.target.value)}
                          className="mt-1 w-full rounded-md border border-[#CBD5E1] px-3 py-2 text-sm text-[#0F172A]"
                        />
                      </label>
                      <label className="block text-xs font-medium text-[#334155]">
                        State *
                        <input
                          type="text"
                          value={editAddrState}
                          onChange={(e) => setEditAddrState(e.target.value)}
                          className="mt-1 w-full rounded-md border border-[#CBD5E1] px-3 py-2 text-sm text-[#0F172A]"
                        />
                      </label>
                      <label className="block text-xs font-medium text-[#334155]">
                        Postal code
                        <input
                          type="text"
                          value={editAddrPostal}
                          onChange={(e) => setEditAddrPostal(e.target.value)}
                          className="mt-1 w-full rounded-md border border-[#CBD5E1] px-3 py-2 text-sm text-[#0F172A]"
                        />
                      </label>
                      <label className="block text-xs font-medium text-[#334155]">
                        Country
                        <input
                          type="text"
                          value={editAddrCountry}
                          onChange={(e) => setEditAddrCountry(e.target.value)}
                          className="mt-1 w-full rounded-md border border-[#CBD5E1] px-3 py-2 text-sm text-[#0F172A]"
                        />
                      </label>
                    </div>
                  </div>
                  <label className="block text-xs font-medium text-[#334155] sm:col-span-2">
                    Amenities (comma-separated)
                    <input
                      type="text"
                      value={editAmenitiesText}
                      onChange={(e) => setEditAmenitiesText(e.target.value)}
                      placeholder="Pool, Gym, Parking"
                      className="mt-1 w-full rounded-md border border-[#CBD5E1] px-3 py-2 text-sm text-[#0F172A]"
                    />
                  </label>
                </div>
              </div>
            ) : null}

            <div className="mt-2 overflow-x-auto border-b border-gray-200 scrollbar-hide">
              <div className="inline-flex min-w-max gap-4">
                {tabs.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTab(t)}
                    className={`relative border-b-2 px-1 py-4 text-sm capitalize ${tab === t ? "border-[#1E66FF] text-[#1E66FF]" : "border-transparent text-[#64748B]"}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            {tab === "overview" ? (
              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <RecentPayments payments={propertyPayments} />
                <MaintenanceRequests requests={propertyMaintenance} />
              </div>
            ) : null}
            {tab === "units" ? (
              <div className="mt-4 rounded-md border border-[#E2E8F0] p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold">
                    Units List{" "}
                    <span className="ml-1 text-xs text-[#0284C7]">
                      {units.length} Units
                    </span>
                  </p>
                  <button className="text-xs text-[#0284C7]">Export CSV</button>
                </div>
                <table className="w-full text-xs">
                  <thead className="text-[#64748B]">
                    <tr>
                      <th className="py-2 text-left">S/N</th>
                      <th className="py-2 text-left">Unit ID</th>
                      <th className="py-2 text-left">Type</th>
                      <th className="py-2 text-left">Status</th>
                      <th className="py-2 text-left">Tenant</th>
                      <th className="py-2 text-left">Rent</th>
                      <th className="py-2 text-left">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {units.length ? (
                      units.map((unit, i) => {
                        const unitId = readString(unit.id) ?? "1";
                        const tenant = getUnitTenant(unit);
                        const rentAmount = readNumber(unit.rentAmount);
                        return (
                          <tr
                            key={unitId + i}
                            className="border-t border-[#F1F5F9]"
                          >
                            <td className="py-2">
                              {String(i + 1).padStart(2, "0")}
                            </td>
                            <td className="py-2">
                              {readString(unit.name) ??
                                readString(unit.unitNumber) ??
                                unitId}
                            </td>
                            <td className="py-2">
                              {readString(unit.type) ??
                                `${readNumber(unit.numberOfBedrooms) ?? 0}BR`}
                            </td>
                            <td className="py-2">{unitStatusLabel(unit)}</td>
                            <td className="py-2">
                              {tenant
                                ? (readString(tenant.fullName) ??
                                  readString(tenant.name) ??
                                  readString(tenant.email) ??
                                  "—")
                                : "—"}
                            </td>
                            <td className="py-2">
                              {rentAmount !== null
                                ? formatMoney(rentAmount)
                                : "—"}
                            </td>
                            <td className="py-2">
                              <Link
                                href={`/dashboard/admin/properties/${propertyId ?? "1"}/units/${unitId}`}
                                className="text-[#0284C7] hover:underline"
                              >
                                View Details
                              </Link>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr className="border-t border-[#F1F5F9]">
                        <td
                          className="py-4 text-center text-[#64748B]"
                          colSpan={7}
                        >
                          No units available for this property.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : null}

            {tab === "tenants" ? (
              <div className="mt-4 rounded-md border border-[#E2E8F0] p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold">
                    Tenants List{" "}
                    <span className="ml-1 text-xs text-[#0284C7]">
                      {tenants.length} Tenants
                    </span>
                  </p>
                </div>
                <table className="w-full text-xs">
                  <thead className="text-[#64748B]">
                    <tr>
                      <th className="py-2 text-left">S/N</th>
                      <th className="py-2 text-left">Name</th>
                      <th className="py-2 text-left">Unit</th>
                      <th className="py-2 text-left">Phone</th>
                      <th className="py-2 text-left">Email</th>
                      <th className="py-2 text-left">Status</th>
                      <th className="py-2 text-left">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tenants.length ? (
                      tenants.map((tenant, i) => (
                        <tr
                          key={tenant.id}
                          className="border-t border-[#F1F5F9]"
                        >
                          <td className="py-2">
                            {String(i + 1).padStart(2, "0")}
                          </td>
                          <td className="py-2">{tenant.name}</td>
                          <td className="py-2">{tenant.unitName}</td>
                          <td className="py-2">{tenant.phone}</td>
                          <td className="py-2">{tenant.email}</td>
                          <td className="py-2">
                            <span className="rounded-full bg-[#E2E8F0] px-2 py-0.5 text-[11px] text-[#334155]">
                              {tenant.status}
                            </span>
                          </td>
                          <td className="py-2">
                            <Link
                              href={`/dashboard/admin/properties/${propertyId ?? "1"}/tenants/${tenant.id}`}
                              className="text-[#0284C7] hover:underline"
                            >
                              View Profile
                            </Link>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr className="border-t border-[#F1F5F9]">
                        <td
                          className="py-4 text-center text-[#64748B]"
                          colSpan={7}
                        >
                          No tenants are associated with this property in the
                          current data.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : null}

            {tab === "payments" ? (
              <div className="mt-4">
                <RecentPayments payments={propertyPayments} />
              </div>
            ) : null}

            {tab === "maintenance" ? (
              <div className="mt-4">
                <MaintenanceRequests requests={propertyMaintenance} />
              </div>
            ) : null}

            {tab === "documents" ? (
              <div className="mt-4 rounded-md border border-[#E2E8F0] p-3">
                <p className="mb-2 text-sm font-semibold">Property Documents</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {documents.length ? (
                    documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="rounded-md border border-[#E2E8F0] p-2"
                      >
                        <p className="truncate text-xs font-medium">
                          {doc.label ||
                            doc.fileName ||
                            doc.filename ||
                            "Document"}
                        </p>
                        <p className="text-[10px] text-[#64748B]">
                          {doc.mimeType || "File"}{" "}
                          {typeof doc.size === "number"
                            ? `· ${Math.round(doc.size / 1024)} KB`
                            : ""}
                        </p>
                        <div className="mt-2 flex gap-2">
                          {doc.url ? (
                            <a
                              href={doc.url}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded bg-[#EEF2FF] px-2 py-1 text-[10px] text-[#1D4ED8]"
                            >
                              View
                            </a>
                          ) : (
                            <span className="rounded bg-[#F1F5F9] px-2 py-1 text-[10px] text-[#64748B]">
                              No link
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="col-span-2 rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-4 text-sm text-[#64748B]">
                      No documents uploaded for this property.
                    </p>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </section>
      </AdminLayout>
    </>
  );
};

export default AdminPropertyDetailPage;
