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
import { getProperty, type PropertyDTO } from "@/api/properties";
import { getUnitsByProperty, type UnitDTO } from "@/api/units";
import { getRentPayments } from "@/api/rent-payment";
import { getMaintenanceRequests } from "@/api/maintenance";
import type {
  MaintenanceRequest,
  MaintenanceRequestWithDetails,
  Payment,
} from "@/data/mockLandlordData";

function formatAddress(property: PropertyDTO | null): string {
  if (!property?.address) return "Address unavailable";
  const a = property.address;
  return [a.address, a.street, a.city, a.state].filter(Boolean).join(", ");
}

function getPhotos(property: PropertyDTO | null): string[] {
  if (!property?.photos?.length) return [];
  return property.photos.map((p) => p.url).filter((u): u is string => !!u);
}

function getOccupancy(property: PropertyDTO | null): string {
  if (!property) return "—";
  const units = Array.isArray(property.units) ? property.units : [];
  if (!units.length) return "—";
  const occupied = units.filter((unit) => {
    if (!unit || typeof unit !== "object") return false;
    const u = unit as Record<string, unknown>;
    return (
      u.isOccupied === true ||
      u.isAvailable === false ||
      u.status === "OCCUPIED" ||
      u.status === "occupied"
    );
  }).length;
  return `${Math.round((occupied / units.length) * 100)}%`;
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
  const { id } = router.query;
  const propertyId = typeof id === "string" ? id : null;

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
      return unitsFromApi.map((u) => ({
        id: u.id,
        name: u.name,
        numberOfBedrooms: u.numberOfBedrooms,
        isAvailable: u.isAvailable,
        rentAmount: u.rentAmount,
      }));
    }
    return embeddedUnits;
  }, [unitsFromApi, embeddedUnits]);
  const unitsCount =
    unitsFromApi.length > 0
      ? unitsFromApi.length
      : (property?.numberOfUnits ?? embeddedUnits.length ?? "—");
  const tenants = React.useMemo(() => {
    const rows = units
      .map((unit) => {
        const tenant = getUnitTenant(unit);
        if (!tenant) return null;
        return {
          id:
            readString(tenant.id) ??
            readString(unit.id) ??
            Math.random().toString(36),
          name:
            readString(tenant.fullName) ??
            readString(tenant.name) ??
            readString(tenant.email) ??
            "Unnamed tenant",
          email: readString(tenant.email) ?? "—",
          phone:
            readString(tenant.phoneNumber) ?? readString(tenant.phone) ?? "—",
          unitName:
            readString(unit.name) ??
            readString(unit.unitNumber) ??
            readString(unit.code) ??
            "—",
          status: unitStatusLabel(unit),
        };
      })
      .filter(
        (
          row,
        ): row is {
          id: string;
          name: string;
          email: string;
          phone: string;
          unitName: string;
          status: string;
        } => row !== null,
      );
    const unique = new Map<string, (typeof rows)[number]>();
    rows.forEach((row) => unique.set(row.id, row));
    return Array.from(unique.values());
  }, [units]);
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
    void getMaintenanceRequests({ limit: 100 }).then((result) => {
      if (cancelled) return;
      setPropertyMaintenanceFromApi(result.success ? result.data : []);
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
              <button className="inline-flex items-center gap-2 rounded-md border border-[#CBD5E1] px-3 py-1.5 text-xs">
                <Download className="h-3.5 w-3.5" />
                Export
              </button>
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
                <div className="grid grid-cols-2 gap-4">
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
                    <p className="mt-1 text-2xl font-bold text-gray-900">—</p>
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
                      {getOccupancy(property)}
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
                          No tenants found on this property response.
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
                <div className="grid grid-cols-2 gap-3">
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
