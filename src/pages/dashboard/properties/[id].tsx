import * as React from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  Download,
  Plus,
  UserPlus,
  Users,
  Megaphone,
  MapPin,
  Droplet,
  Car,
  Shield,
  Zap,
  Wifi,
  CheckCircle2,
  Home,
  DollarSign,
  User,
  FileText,
  CalendarClock,
  Globe,
  Upload,
  CalendarDays,
} from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";

import { DashboardLayout } from "@/components/DashboardLayout";
import { RecentPayments } from "@/components/RecentPayments";
import { MaintenanceRequests } from "@/components/MaintenanceRequests";
import { PropertyUnitsTab } from "@/components/PropertyUnitsTab";
import { PropertyTenantsTab } from "@/components/PropertyTenantsTab";
import { PropertyPaymentsTab } from "@/components/PropertyPaymentsTab";
import { PropertyMaintenanceTab } from "@/components/PropertyMaintenanceTab";
import { PropertyDocumentsTab } from "@/components/PropertyDocumentsTab";
import { AddUnitModal } from "@/components/AddUnitModal";
import { AddTenantModal } from "@/components/AddTenantModal";
import { AssignPropertyManagerModal } from "@/components/AssignPropertyManagerModal";
import { InviteManagerModal } from "@/components/InviteManagerModal";
import { SendAnnouncementModal } from "@/components/SendAnnouncementModal";
import type { Payment, Tenant, PaymentHistory } from "@/data/mockLandlordData";
import { ADMIN_STAT_BG, ADMIN_STAT_LABEL } from "@/lib/adminDesignTokens";
import type {
  MaintenanceRequest,
  MaintenanceRequestDetail,
  MaintenanceRequestWithDetails,
} from "@/data/mockLandlordData";
import { getRentPayments } from "@/api/rent-payment";
import {
  getProperty,
  getPropertySettings,
  updateProperty,
  updatePropertyGracePeriodSettings,
  updatePropertyLateFeeSettings,
} from "@/api/properties";
import {
  getPropertyManagersByLandlord,
  getPropertyManagersByProperty,
} from "@/api/property-managers";
import type { PropertyManagerDTO } from "@/api/property-managers";
import { getMaintenanceRequests } from "@/api/maintenance";
import { mapPropertyDTOToProperty } from "@/api/properties/mapProperty";
import type { PropertyDTO } from "@/api/properties";
import { createPropertyVerification } from "@/api/verification";
import { createAnnouncementProperty } from "@/api/announcement";
import { getUnitsByProperty } from "@/api/units";
import { mapUnitDTOToUnit } from "@/api/units/mapUnit";
import type { Unit } from "@/data/mockLandlordData";
import { useUser } from "@/contexts/UserContext";
import { useToast } from "@/components/Toast";
import { uploadFile } from "@/api/files";
import { downloadCsv, safeExportFilename, todayStamp } from "@/utils/exportCsv";

import type { NextPageWithLayout } from "../../_app";
import {
  MONTHLY_GRACE_VALUES,
  QUARTERLY_GRACE_VALUES,
  YEARLY_GRACE_VALUES,
  applyPropertySettingsFromApi,
  formatLateFeeLine,
  gracePeriodLabel,
} from "@/lib/propertyRentRulesFromSettings";

function managerUserDisplayFromUnknown(node: unknown): string | undefined {
  if (!node || typeof node !== "object") return undefined;
  const u = node as Record<string, unknown>;
  const first = String(u.firstName ?? "").trim();
  const last = String(u.lastName ?? "").trim();
  const composed = [first, last].filter(Boolean).join(" ").trim();
  const full = typeof u.fullName === "string" ? u.fullName.trim() : "";
  const name = typeof u.name === "string" ? u.name.trim() : "";
  return full || name || composed || undefined;
}

function pickPropertyManagerRecordName(
  record: Record<string, unknown>,
): string {
  const fromUser = managerUserDisplayFromUnknown(record.user);
  if (fromUser) return fromUser;
  const full =
    typeof record.fullName === "string" ? record.fullName.trim() : "";
  const name = typeof record.name === "string" ? record.name.trim() : "";
  return full || name || "";
}

function findManagerNameForProperty(
  managers: PropertyManagerDTO[],
  propertyId: string,
  propertyPayload: Record<string, unknown>,
): string | null {
  const pmIdRaw =
    propertyPayload.propertyManagerId ??
    propertyPayload.assignedPropertyManagerId ??
    propertyPayload.managerId;
  if (typeof pmIdRaw === "string" && pmIdRaw) {
    const hit = managers.find((m) => m.id === pmIdRaw);
    if (hit) {
      const n = pickPropertyManagerRecordName(hit as Record<string, unknown>);
      if (n) return n;
    }
  }

  for (const pm of managers) {
    const rec = pm as Record<string, unknown>;
    const name = pickPropertyManagerRecordName(rec);
    if (!name) continue;

    if (Array.isArray(rec.properties)) {
      for (const p of rec.properties) {
        if (p && typeof p === "object" && "id" in p) {
          if (String((p as { id: unknown }).id) === propertyId) return name;
        }
      }
    }
    if (Array.isArray(rec.propertyIds)) {
      if (
        (rec.propertyIds as unknown[]).some((x) => String(x) === propertyId)
      ) {
        return name;
      }
    }
    const single = rec.property;
    if (
      single &&
      typeof single === "object" &&
      "id" in single &&
      String((single as { id: unknown }).id) === propertyId
    ) {
      return name;
    }
    if (Array.isArray(rec.managedProperties)) {
      for (const p of rec.managedProperties as unknown[]) {
        if (p && typeof p === "object" && "id" in p) {
          if (String((p as { id: unknown }).id) === propertyId) return name;
        }
      }
    }
  }
  return null;
}

type PropertySettingsSection = "documents" | "gracePeriods" | "preferences";

type PropertyRentRulesSummaryLines = {
  late: string;
  monthly: string;
  quarterly: string;
  yearly: string;
};

type PropertySettingsLoadStatus = "idle" | "loading" | "ready" | "error";

function PropertyRentRulesSummaryCard({
  status,
  lines,
}: {
  status: PropertySettingsLoadStatus;
  lines: PropertyRentRulesSummaryLines;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-200/90 bg-gradient-to-br from-slate-50 via-white to-sky-50/50 shadow-[0_8px_30px_rgba(15,23,42,0.08)] ring-1 ring-black/[0.03]">
      <div
        className="h-1.5 bg-gradient-to-r from-brand-main via-blue-500 to-indigo-500"
        aria-hidden
      />
      <div className="p-6 sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white shadow-md shadow-slate-200/60 ring-1 ring-slate-100">
            <CalendarClock className="h-6 w-6 text-brand-main" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-semibold tracking-tight text-gray-900 sm:text-xl">
              Rent rules for this property
            </h3>
            {status === "loading" || status === "idle" ? (
              <p className="mt-2 text-sm text-gray-600">
                Loading your saved rules…
              </p>
            ) : status === "error" ? (
              <p className="mt-2 rounded-lg border border-amber-100 bg-amber-50/80 px-3 py-2 text-sm text-amber-900">
                We couldn&apos;t load your saved rules. You can still change the
                options below and save.
              </p>
            ) : (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {(
                  [
                    ["Late fee", lines.late],
                    ["Monthly grace", lines.monthly],
                    ["Quarterly grace", lines.quarterly],
                    ["Yearly grace", lines.yearly],
                  ] as const
                ).map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-xl border border-gray-100 bg-white/95 px-4 py-3.5 shadow-sm"
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                      {label}
                    </p>
                    <p className="mt-1.5 text-base font-semibold leading-snug text-gray-900">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function pickAssignedManagerNameFromPropertyManagers(
  managers: PropertyManagerDTO[],
): string | null {
  const withName = managers
    .map((m) => ({ m, name: pickPropertyManagerRecordName(m as any) }))
    .filter((row) => Boolean(row.name));
  if (withName.length === 0) return null;
  const active = withName.find((row) => row.m.isActive === true);
  return (active?.name ?? withName[0]?.name ?? null) || null;
}

const PropertyDetailPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { user } = useUser();
  const { showToast } = useToast();
  const { id } = router.query;
  const [activeTab, setActiveTab] = React.useState("overview");
  const [isAddUnitOpen, setIsAddUnitOpen] = React.useState(false);
  const [isAddTenantOpen, setIsAddTenantOpen] = React.useState(false);
  const [isAssignManagerOpen, setIsAssignManagerOpen] = React.useState(false);
  const [isInviteManagerOpen, setIsInviteManagerOpen] = React.useState(false);
  const [isSendAnnouncementOpen, setIsSendAnnouncementOpen] =
    React.useState(false);
  const [propertyDTO, setPropertyDTO] = React.useState<PropertyDTO | null>(
    null,
  );
  const [units, setUnits] = React.useState<Unit[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isLoadingUnits, setIsLoadingUnits] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = React.useState(0);
  const [propertyMaintenanceFromApi, setPropertyMaintenanceFromApi] =
    React.useState<MaintenanceRequestWithDetails[]>([]);
  const [maintenanceLoading, setMaintenanceLoading] = React.useState(false);
  const [gracePeriods, setGracePeriods] = React.useState({
    monthlyRentGracePeriod: "NO_GRACE_PERIOD",
    quarterlyRentGracePeriod: "NO_GRACE_PERIOD",
    yearlyRentGracePeriod: "NO_GRACE_PERIOD",
  });
  const [isSavingGracePeriod, setIsSavingGracePeriod] = React.useState(false);
  const [isSavingPreferences, setIsSavingPreferences] = React.useState(false);
  const [isSavingServiceApartment, setIsSavingServiceApartment] =
    React.useState(false);
  const [isSavingVerification, setIsSavingVerification] = React.useState(false);
  const [isOpenForServiceApartment, setIsOpenForServiceApartment] =
    React.useState(false);
  const [propertySettingsSection, setPropertySettingsSection] =
    React.useState<PropertySettingsSection>("documents");
  const [propertyVerificationDocs, setPropertyVerificationDocs] =
    React.useState({
      govermentIdDocumentId: "",
      landSurveyDocumentId: "",
      proofOfOwnershipDocumentId: "",
      taxIdentificationNumberDocumentId: "",
    });
  const [propertyDocUploading, setPropertyDocUploading] = React.useState<
    string | null
  >(null);
  const [propertyLateFee, setPropertyLateFee] = React.useState({
    lateFeeAmount: "0",
    lateFeeType: "percentage" as "fixed" | "percentage",
  });
  const [propertyPrefsDisplay, setPropertyPrefsDisplay] = React.useState({
    defaultCurrency: "NGN",
    language: "en",
  });
  const [overviewRentPayments, setOverviewRentPayments] = React.useState<
    Payment[]
  >([]);
  const [
    managerNameFromPropertyManagersEndpoint,
    setManagerNameFromPropertyManagersEndpoint,
  ] = React.useState<string | null>(null);
  const [managerNameFromLandlordList, setManagerNameFromLandlordList] =
    React.useState<string | null>(null);
  const [propertySettingsStatus, setPropertySettingsStatus] = React.useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");

  const fetchProperty = React.useCallback(async () => {
    if (!id || typeof id !== "string") return;
    setIsLoading(true);
    setError(null);
    const result = await getProperty(id);
    if (result.success) {
      setPropertyDTO(result.data);
    } else {
      setError(result.error);
    }
    setIsLoading(false);
  }, [id]);

  React.useEffect(() => {
    if (user?.role === "super_admin" && id && typeof id === "string") {
      router.replace(`/dashboard/admin/properties/${id}`);
    }
  }, [id, router, user?.role]);

  React.useEffect(() => {
    if (!propertyDTO) return;
    setIsOpenForServiceApartment(
      propertyDTO.isOpenForServiceApartment === true,
    );
  }, [propertyDTO]);

  // Fetch property from API
  React.useEffect(() => {
    void fetchProperty();
  }, [fetchProperty]);

  const applySettingsFromServer =
    React.useCallback(async (): Promise<boolean> => {
      if (!id || typeof id !== "string") return false;
      const result = await getPropertySettings(id);
      if (!result.success) return false;
      const mapped = applyPropertySettingsFromApi(
        result.data as Record<string, unknown>,
      );
      setGracePeriods(mapped.grace);
      setPropertyLateFee(mapped.lateFee);
      return true;
    }, [id]);

  React.useEffect(() => {
    if (!id || typeof id !== "string") return;
    let cancelled = false;
    setPropertySettingsStatus("loading");
    void applySettingsFromServer().then((ok) => {
      if (cancelled) return;
      setPropertySettingsStatus(ok ? "ready" : "error");
    });
    return () => {
      cancelled = true;
    };
  }, [id, applySettingsFromServer]);

  React.useEffect(() => {
    setManagerNameFromPropertyManagersEndpoint(null);
    setManagerNameFromLandlordList(null);
  }, [id]);

  // Strong fallback: use GET /property-manager/property/:propertyId and pick active manager.
  React.useEffect(() => {
    if (!id || typeof id !== "string") return;
    let cancelled = false;
    void getPropertyManagersByProperty(id).then((result) => {
      if (cancelled || !result.success) return;
      const found = pickAssignedManagerNameFromPropertyManagers(result.data);
      if (found) {
        setManagerNameFromPropertyManagersEndpoint(found);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  // When GET /property omits nested manager objects, resolve via landlord managers list.
  React.useEffect(() => {
    if (!propertyDTO || !id || typeof id !== "string") return;
    const landlordId =
      propertyDTO.landlordId ??
      propertyDTO.landlord?.id ??
      (typeof window !== "undefined"
        ? window.localStorage.getItem("landlordId")
        : null);
    if (!landlordId) return;

    let cancelled = false;
    void getPropertyManagersByLandlord(landlordId).then((result) => {
      if (cancelled || !result.success) return;
      const payload = propertyDTO as Record<string, unknown>;
      const found = findManagerNameForProperty(result.data, id, payload);
      if (found) setManagerNameFromLandlordList(found);
    });
    return () => {
      cancelled = true;
    };
  }, [propertyDTO, id]);

  React.useEffect(() => {
    if (!propertyDTO || typeof window === "undefined") return;
    const debug =
      process.env.NODE_ENV === "development" ||
      new URLSearchParams(window.location.search).has("debugProperty");
    if (!debug) return;
    const d = propertyDTO as Record<string, unknown>;
    console.log("[PropertyDetailPage] GET /property keys:", Object.keys(d));
    console.log("[PropertyDetailPage] manager-related slices:", {
      propertyId: id,
      propertyManager: d.propertyManager,
      manager: d.manager,
      assignedManager: d.assignedManager,
      propertyManagers: d.propertyManagers,
      propertyManagerId: d.propertyManagerId,
      assignedPropertyManagerId: d.assignedPropertyManagerId,
      managerId: d.managerId,
    });
  }, [propertyDTO, id]);

  // Fetch units from API
  React.useEffect(() => {
    const fetchUnits = async () => {
      if (!id || typeof id !== "string") return;

      setIsLoadingUnits(true);
      const result = await getUnitsByProperty(id);
      if (result.success) {
        const mappedUnits = result.data.map((unitDTO) =>
          mapUnitDTOToUnit(unitDTO, id),
        );
        setUnits(mappedUnits);
      }
      setIsLoadingUnits(false);
    };

    fetchUnits();
  }, [id]);

  // Fetch maintenance requests and filter by this property
  React.useEffect(() => {
    if (!id || typeof id !== "string" || !propertyDTO?.name) {
      setPropertyMaintenanceFromApi([]);
      return;
    }
    const propertyNameBase = propertyDTO.name.split(" — ")[0].split(" —")[0];
    let cancelled = false;
    setMaintenanceLoading(true);
    getMaintenanceRequests({ limit: 100, propertyId: id })
      .then((result) => {
        if (cancelled) return;
        if (result.success) {
          const filtered = result.data.filter(
            (r) =>
              (r.propertyName ?? "").trim() === propertyNameBase.trim() ||
              (r.propertyName ?? "")
                .toLowerCase()
                .includes(propertyNameBase.toLowerCase()),
          );
          setPropertyMaintenanceFromApi(filtered);
        } else {
          setPropertyMaintenanceFromApi([]);
        }
      })
      .finally(() => {
        if (!cancelled) setMaintenanceLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, propertyDTO?.name]);

  // Map property DTO to Property type for compatibility
  const property = React.useMemo(() => {
    if (!propertyDTO) return null;
    return mapPropertyDTOToProperty(propertyDTO);
  }, [propertyDTO]);
  const isPropertyVerified = propertyDTO?.isApproved === true;

  React.useEffect(() => {
    if (!id || typeof id !== "string") return;
    let cancelled = false;
    void getRentPayments({ limit: 100 }).then((result) => {
      if (cancelled) return;
      setOverviewRentPayments(result.success ? result.data : []);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const allPropertyPayments = React.useMemo(() => {
    if (!property || !id || typeof id !== "string") return [];
    const baseName = property.name
      .split(" — ")[0]
      .split(" —")[0]
      .trim()
      .toLowerCase();
    return overviewRentPayments.filter((p) => {
      if (p.propertyId && p.propertyId === id) return true;
      return p.propertyName.trim().toLowerCase() === baseName;
    });
  }, [overviewRentPayments, property, id]);

  const paymentHistoryRows: PaymentHistory[] = React.useMemo(
    () =>
      allPropertyPayments.map((p) => ({
        id: p.id,
        transactionId: p.id,
        propertyId: p.propertyId || (typeof id === "string" ? id : ""),
        unitId: p.unit,
        tenantId: "",
        tenantName: p.tenantName,
        amount: p.amount,
        date: p.dueDate,
        method: "Payment",
        status: p.paymentReceived ? "success" : "failed",
      })),
    [allPropertyPayments, id],
  );

  const propertyPayments = React.useMemo(
    () => allPropertyPayments.slice(0, 5),
    [allPropertyPayments],
  );

  // Maintenance for Overview: from API, mapped to MaintenanceRequest[]
  const propertyMaintenance = React.useMemo((): MaintenanceRequest[] => {
    return propertyMaintenanceFromApi.map((r) => ({
      id: r.id,
      type: r.type || "Maintenance",
      description: r.subType || r.description || "",
      propertyName: r.propertyName || "",
      unit: r.unit || "",
      status: r.status === "resolved" ? "completed" : r.status,
      priority: r.priority,
      timeAgo: r.reportedTime || "",
    }));
  }, [propertyMaintenanceFromApi]);

  // Maintenance for Maintenance tab: from API, mapped to MaintenanceRequestDetail[]
  const propertyMaintenanceDetails =
    React.useMemo((): MaintenanceRequestDetail[] => {
      return propertyMaintenanceFromApi.map((r) => ({
        id: r.id,
        propertyId: (id as string) ?? "",
        unitId: r.unit || "",
        tenantId: "",
        tenantName: r.tenantName ?? "",
        type: r.type ?? "",
        subType: r.subType ?? "",
        priority: r.priority,
        reportedDate: r.reportedTime ?? "",
        status: r.status,
        additionalDetail: r.description ?? "",
      }));
    }, [propertyMaintenanceFromApi, id]);

  const handlePropertyVerificationUpload = React.useCallback(
    async (key: keyof typeof propertyVerificationDocs, file: File) => {
      if (!user?.token) {
        showToast("You must be signed in to upload files", "error");
        return;
      }
      if (!id || typeof id !== "string") return;
      setPropertyDocUploading(key);
      const result = await uploadFile({
        file,
        folder: "property",
        label: `${id}-${key}`,
        token: user.token,
      });
      setPropertyDocUploading(null);
      if (result.success) {
        setPropertyVerificationDocs((prev) => ({
          ...prev,
          [key]: result.data.id,
        }));
        showToast("Document uploaded", "success");
      } else {
        showToast(result.error || "Upload failed", "error");
      }
    },
    [id, showToast, user?.token],
  );

  const handleSavePropertyPreferences = React.useCallback(async () => {
    if (!id || typeof id !== "string") return;
    setIsSavingPreferences(true);
    const amount = Number(propertyLateFee.lateFeeAmount);
    const result = await updatePropertyLateFeeSettings(id, {
      lateFeeAmount: Number.isFinite(amount) ? amount : 0,
      lateFeeType: propertyLateFee.lateFeeType,
    });
    setIsSavingPreferences(false);
    if (result.success) {
      const refreshed = await applySettingsFromServer();
      if (refreshed) setPropertySettingsStatus("ready");
      showToast(refreshed ? "Late fee saved." : "Late fee saved.", "success");
    } else {
      showToast(result.error || "Failed to save late fee", "error");
    }
  }, [applySettingsFromServer, id, propertyLateFee, showToast]);

  const handleSaveServiceApartmentFlag = React.useCallback(async () => {
    if (!id || typeof id !== "string") return;
    setIsSavingServiceApartment(true);
    const result = await updateProperty(id, {
      isOpenForServiceApartment,
    });
    setIsSavingServiceApartment(false);
    if (result.success) {
      setPropertyDTO((prev) => ({
        ...(prev ?? result.data),
        ...result.data,
        isOpenForServiceApartment,
      }));
      showToast(
        isOpenForServiceApartment
          ? "Property is open for service apartments."
          : "Service apartment listing disabled for this property.",
        "success",
      );
    } else {
      showToast(
        result.error || "Failed to update service apartment setting",
        "error",
      );
    }
  }, [id, isOpenForServiceApartment, showToast]);

  const handleSaveGracePeriods = React.useCallback(async () => {
    if (!id || typeof id !== "string") return;
    setIsSavingGracePeriod(true);
    const result = await updatePropertyGracePeriodSettings(id, gracePeriods);
    setIsSavingGracePeriod(false);
    if (result.success) {
      const refreshed = await applySettingsFromServer();
      if (refreshed) setPropertySettingsStatus("ready");
      showToast(
        refreshed ? "Grace periods saved." : "Grace periods saved.",
        "success",
      );
    } else {
      showToast(result.error || "Failed to save grace periods", "error");
    }
  }, [applySettingsFromServer, gracePeriods, id, showToast]);

  const handleSavePropertyVerificationDocs = React.useCallback(async () => {
    if (!id || typeof id !== "string") return;
    setIsSavingVerification(true);
    const result = await createPropertyVerification(id);
    setIsSavingVerification(false);
    if (result.success) {
      showToast("Property verification submitted.", "success");
    } else {
      showToast(result.error || "Verification request failed", "error");
    }
  }, [id, showToast]);

  const rentRulesSummaryLines = React.useMemo(
    () => ({
      late: formatLateFeeLine(propertyLateFee),
      monthly: gracePeriodLabel(gracePeriods.monthlyRentGracePeriod),
      quarterly: gracePeriodLabel(gracePeriods.quarterlyRentGracePeriod),
      yearly: gracePeriodLabel(gracePeriods.yearlyRentGracePeriod),
    }),
    [gracePeriods, propertyLateFee],
  );

  const propertyTenants = React.useMemo<Tenant[]>(() => {
    return units
      .filter((unit) => unit.tenantId)
      .map((unit) => ({
        id: unit.tenantId as string,
        propertyId: id as string,
        unitId: unit.unitId,
        name: unit.tenantName || "Tenant",
        email: unit.tenantEmail || "",
        phone: unit.tenantPhone || "—",
        leaseStart: "—",
        leaseEnd: unit.leaseEndDate || "—",
        nextPayment: unit.nextDueDate || "—",
        status: "occupied",
      }));
  }, [units, id]);

  const handleExportProperty = React.useCallback(() => {
    if (!property || !propertyDTO) return;
    const rows: Array<Record<string, unknown>> = [
      {
        section: "Property",
        name: property.name,
        address: property.address,
        status: property.status,
        units: property.units,
        monthlyRent: property.monthlyRent,
        occupancy: property.occupancy,
        verified: propertyDTO.isApproved === true ? "Yes" : "No",
        listedDate: propertyDTO.createdAt ?? "",
      },
      ...units.map((unit) => ({
        section: "Unit",
        name: unit.unitId,
        type: unit.type,
        status: unit.status,
        tenant: unit.tenantName ?? "",
        monthlyRent: unit.monthlyRent,
        rentStatus: unit.rentStatus,
        nextDueDate: unit.nextDueDate,
        amenities: unit.amenities.join(", "),
      })),
      ...propertyTenants.map((tenant) => ({
        section: "Tenant",
        name: tenant.name,
        unit: tenant.unitId,
        email: tenant.email,
        phone: tenant.phone,
        leaseStart: tenant.leaseStart,
        leaseEnd: tenant.leaseEnd,
        nextPayment: tenant.nextPayment,
      })),
      ...propertyPayments.map((payment) => ({
        section: "Payment",
        name: payment.tenantName,
        unit: payment.unit,
        amount: payment.amount,
        dueDate: payment.dueDate,
      })),
      ...propertyMaintenanceDetails.map((request) => ({
        section: "Maintenance",
        name: request.type,
        unit: request.unitId,
        tenant: request.tenantName,
        status: request.status,
        priority: request.priority,
        reportedDate: request.reportedDate,
        description: request.additionalDetail ?? request.subType,
      })),
    ];

    downloadCsv(
      `${safeExportFilename(property.name || "property")}-${todayStamp()}.csv`,
      [
        { header: "Section", value: (row) => row.section },
        { header: "Name", value: (row) => row.name },
        { header: "Type", value: (row) => row.type },
        { header: "Address", value: (row) => row.address },
        { header: "Unit", value: (row) => row.unit },
        { header: "Units", value: (row) => row.units },
        { header: "Tenant", value: (row) => row.tenant },
        { header: "Email", value: (row) => row.email },
        { header: "Phone", value: (row) => row.phone },
        { header: "Status", value: (row) => row.status },
        { header: "Priority", value: (row) => row.priority },
        { header: "Monthly Rent", value: (row) => row.monthlyRent },
        { header: "Amount", value: (row) => row.amount },
        { header: "Occupancy", value: (row) => row.occupancy },
        { header: "Rent Status", value: (row) => row.rentStatus },
        { header: "Next Due Date", value: (row) => row.nextDueDate },
        { header: "Due Date", value: (row) => row.dueDate },
        { header: "Lease Start", value: (row) => row.leaseStart },
        { header: "Lease End", value: (row) => row.leaseEnd },
        { header: "Reported Date", value: (row) => row.reportedDate },
        { header: "Verified", value: (row) => row.verified },
        { header: "Listed Date", value: (row) => row.listedDate },
        { header: "Amenities", value: (row) => row.amenities },
        { header: "Description", value: (row) => row.description },
      ],
      rows,
    );
  }, [
    property,
    propertyDTO,
    propertyMaintenanceDetails,
    propertyPayments,
    propertyTenants,
    units,
  ]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-brand-main border-r-transparent"></div>
          <p className="mt-4 text-sm text-gray-600">Loading property...</p>
        </div>
      </div>
    );
  }

  if (error || !property || !propertyDTO) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-gray-600">{error || "Property not found"}</p>
          <button
            type="button"
            onClick={() => router.back()}
            className="mt-4 text-sm text-brand-main hover:underline"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "units", label: "Units" },
    { id: "tenants", label: "Tenants" },
    { id: "payments", label: "Payments" },
    { id: "maintenance", label: "Maintenance" },
    { id: "documents", label: "Documents" },
    { id: "settings", label: "Settings" },
  ];

  const propertySettingsNav: Array<{
    id: PropertySettingsSection;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { id: "documents", label: "Documents", icon: FileText },
    { id: "gracePeriods", label: "Rent grace periods", icon: CalendarClock },
    { id: "preferences", label: "Preferences", icon: Globe },
  ];

  // Helper function to get amenity icon
  const getAmenityIcon = (amenity: string) => {
    const lowerAmenity = amenity.toLowerCase();
    if (lowerAmenity.includes("water") || lowerAmenity.includes("treatment")) {
      return Droplet;
    }
    if (lowerAmenity.includes("parking") || lowerAmenity.includes("car")) {
      return Car;
    }
    if (lowerAmenity.includes("security") || lowerAmenity.includes("gate")) {
      return Shield;
    }
    if (lowerAmenity.includes("power") || lowerAmenity.includes("24/7")) {
      return Zap;
    }
    if (
      lowerAmenity.includes("internet") ||
      lowerAmenity.includes("fiber") ||
      lowerAmenity.includes("wifi")
    ) {
      return Wifi;
    }
    return CheckCircle2;
  };

  const totalUnitsCount = units.length > 0 ? units.length : property.units;
  const occupiedUnitsCount = units.filter(
    (u) => u.status === "occupied",
  ).length;
  const occupancyPercent =
    totalUnitsCount > 0
      ? Math.round((occupiedUnitsCount / totalUnitsCount) * 100)
      : 0;
  const monthlyRentTotal = units.reduce((sum, unit) => {
    const rentValue = (unit as any).rent ?? unit.monthlyRent ?? 0;
    const rent = Number.parseFloat(String(rentValue));
    return sum + (Number.isFinite(rent) ? rent : 0);
  }, 0);
  const rentLabel = (() => {
    if (isOpenForServiceApartment) return "Service rent";
    const normalizeFrequency = (value: unknown): string | null => {
      if (typeof value !== "string") return null;
      const key = value.trim().toLowerCase();
      if (!key) return null;
      if (key === "daily") return "Daily";
      if (key === "weekly") return "Weekly";
      if (key === "monthly") return "Monthly";
      if (key === "yearly" || key === "annually") return "Yearly";
      return null;
    };

    const source = Array.isArray((propertyDTO as any)?.units)
      ? ((propertyDTO as any).units as Array<Record<string, unknown>>)
      : [];

    const frequencies = Array.from(
      new Set(
        source
          .map((unit) =>
            normalizeFrequency(
              unit?.rentFrequency ??
                unit?.rentDuration ??
                unit?.duration ??
                unit?.leaseFrequency,
            ),
          )
          .filter((v): v is string => Boolean(v)),
      ),
    );

    if (frequencies.length === 1) {
      return `${frequencies[0]} Rent`;
    }
    return "Rent";
  })();
  const managerName =
    ((propertyDTO as any)?.propertyManager?.user?.fullName as
      | string
      | undefined) ||
    ((propertyDTO as any)?.propertyManager?.user?.name as string | undefined) ||
    managerUserDisplayFromUnknown(
      (propertyDTO as any)?.propertyManager?.user,
    ) ||
    ((propertyDTO as any)?.propertyManager?.fullName as string | undefined) ||
    ((propertyDTO as any)?.propertyManager?.name as string | undefined) ||
    ((propertyDTO as any)?.manager?.user?.fullName as string | undefined) ||
    ((propertyDTO as any)?.manager?.user?.name as string | undefined) ||
    managerUserDisplayFromUnknown((propertyDTO as any)?.manager?.user) ||
    ((propertyDTO as any)?.manager?.fullName as string | undefined) ||
    ((propertyDTO as any)?.manager?.name as string | undefined) ||
    ((propertyDTO as any)?.assignedManager?.user?.fullName as
      | string
      | undefined) ||
    ((propertyDTO as any)?.assignedManager?.user?.name as string | undefined) ||
    managerUserDisplayFromUnknown(
      (propertyDTO as any)?.assignedManager?.user,
    ) ||
    ((propertyDTO as any)?.assignedManager?.fullName as string | undefined) ||
    ((propertyDTO as any)?.assignedManager?.name as string | undefined) ||
    ((Array.isArray((propertyDTO as any)?.propertyManagers)
      ? (propertyDTO as any).propertyManagers.find(
          (pm: any) =>
            typeof pm?.user?.fullName === "string" ||
            typeof pm?.user?.name === "string" ||
            typeof pm?.fullName === "string" ||
            typeof pm?.name === "string",
        )
      : null
    )?.user?.fullName as string | undefined) ||
    ((Array.isArray((propertyDTO as any)?.propertyManagers)
      ? (propertyDTO as any).propertyManagers.find(
          (pm: any) =>
            typeof pm?.user?.fullName === "string" ||
            typeof pm?.user?.name === "string" ||
            typeof pm?.fullName === "string" ||
            typeof pm?.name === "string",
        )
      : null
    )?.user?.name as string | undefined) ||
    ((Array.isArray((propertyDTO as any)?.propertyManagers)
      ? (propertyDTO as any).propertyManagers.find(
          (pm: any) =>
            typeof pm?.user?.fullName === "string" ||
            typeof pm?.user?.name === "string" ||
            typeof pm?.fullName === "string" ||
            typeof pm?.name === "string",
        )
      : null
    )?.fullName as string | undefined) ||
    ((Array.isArray((propertyDTO as any)?.propertyManagers)
      ? (propertyDTO as any).propertyManagers.find(
          (pm: any) =>
            typeof pm?.user?.fullName === "string" ||
            typeof pm?.user?.name === "string" ||
            typeof pm?.fullName === "string" ||
            typeof pm?.name === "string",
        )
      : null
    )?.name as string | undefined) ||
    managerNameFromPropertyManagersEndpoint ||
    managerNameFromLandlordList ||
    (user?.role === "property_manager" ? user.name : undefined) ||
    "Not assigned";

  return (
    <>
      <Head>
        <title>Dwelliva · {property.name}</title>
      </Head>

      <section className="space-y-6">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Link
            href="/dashboard/properties"
            className="hover:text-gray-900 transition"
          >
            Properties
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-gray-900">{property.name}</span>
        </div>

        {/* Property Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {property.name}
            </h1>
            {isOpenForServiceApartment ? (
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                <CalendarDays className="h-3.5 w-3.5" />
                Service apartment enabled
              </div>
            ) : null}
            <div className="mt-1 flex items-center gap-1 text-sm text-gray-600">
              <MapPin className="h-4 w-4" />
              <span>
                {propertyDTO && propertyDTO.address
                  ? `${propertyDTO.address.address || propertyDTO.address.street || ""}, ${propertyDTO.address.city}, ${propertyDTO.address.state}`
                  : property.address}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={handleExportProperty}
              className="inline-flex items-center gap-1.5 sm:gap-2 rounded-lg border border-gray-300 bg-white px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 transition hover:bg-gray-50 whitespace-nowrap"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
            </button>
            <button
              type="button"
              onClick={() => setIsAddUnitOpen(true)}
              className="inline-flex items-center gap-1.5 sm:gap-2 rounded-lg bg-brand-main px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white transition hover:bg-brand-main/90 whitespace-nowrap"
            >
              <Plus className="h-4 w-4" />
              Add Unit
            </button>
          </div>
        </div>

        {/* Property Content - Image Gallery and Stats */}
        <div className="grid gap-6 lg:grid-cols-3 lg:items-stretch">
          {/* Left Column - Image Gallery */}
          <div className="lg:col-span-2 flex">
            <div className="flex flex-col lg:flex-row gap-4 w-full">
              {/* Main Image */}
              {(() => {
                const photos = propertyDTO?.photos || [];
                const mainPhoto = photos[selectedPhotoIndex];
                const mainImageUrl = mainPhoto?.url || property.image;

                return (
                  <div className="relative w-full lg:flex-1 h-[400px] lg:h-[500px] overflow-hidden rounded-lg bg-gray-200">
                    <Image
                      src={mainImageUrl}
                      alt={property.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                );
              })()}
              {/* Thumbnails - Horizontal on mobile, vertical on desktop */}
              <div className="flex flex-row lg:flex-col gap-4">
                {(() => {
                  const photos = propertyDTO?.photos || [];
                  // Get up to 4 photos total (1 main + 3 thumbnails)
                  const displayPhotos = photos.slice(0, 4);

                  if (displayPhotos.length === 0) {
                    // No photos, show placeholder thumbnails
                    return [1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="relative h-[100px] flex-1 lg:flex-none lg:h-[156px] lg:w-[156px] overflow-hidden rounded-lg bg-gray-200 flex-shrink-0"
                      >
                        <Image
                          src={property.image}
                          alt={`${property.name} ${i}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ));
                  }

                  // Show thumbnails for all photos except the currently selected one
                  return displayPhotos
                    .map((photo, originalIndex) => ({ photo, originalIndex }))
                    .filter(
                      ({ originalIndex }) =>
                        originalIndex !== selectedPhotoIndex,
                    )
                    .slice(0, 3)
                    .map(({ photo, originalIndex }) => (
                      <button
                        key={photo.id}
                        type="button"
                        onClick={() => setSelectedPhotoIndex(originalIndex)}
                        className="relative h-[100px] flex-1 lg:flex-none lg:h-[156px] lg:w-[156px] overflow-hidden rounded-lg bg-gray-200 flex-shrink-0 hover:opacity-80 transition cursor-pointer border-2 border-transparent hover:border-gray-300"
                      >
                        <Image
                          src={photo.url || property.image}
                          alt={`${property.name} thumbnail ${originalIndex + 1}`}
                          fill
                          className="object-cover"
                        />
                      </button>
                    ));
                })()}
              </div>
            </div>
          </div>

          {/* Right Column - Property Info */}
          <div className="flex flex-col space-y-6">
            {/* Statistics Cards - 2x2 Grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Total Units */}
              <div
                className="rounded-lg border border-gray-200 p-4"
                style={{ backgroundColor: ADMIN_STAT_BG.blue }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Home
                    className="h-4 w-4"
                    style={{ color: ADMIN_STAT_LABEL.blue }}
                  />
                </div>
                <p
                  className="text-xs font-medium mb-1"
                  style={{ color: ADMIN_STAT_LABEL.blue }}
                >
                  Total Units
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {totalUnitsCount}
                </p>
              </div>

              {/* Rent */}
              <div
                className="rounded-lg border border-gray-200 p-4"
                style={{ backgroundColor: ADMIN_STAT_BG.purple }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign
                    className="h-4 w-4"
                    style={{ color: ADMIN_STAT_LABEL.purple }}
                  />
                </div>
                <p
                  className="text-xs font-medium mb-1"
                  style={{ color: ADMIN_STAT_LABEL.purple }}
                >
                  {rentLabel}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  ₦{monthlyRentTotal.toLocaleString()}
                </p>
              </div>

              {/* Occupancy */}
              <div
                className="rounded-lg border border-gray-200 p-4"
                style={{ backgroundColor: ADMIN_STAT_BG.green }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Users
                    className="h-4 w-4"
                    style={{ color: ADMIN_STAT_LABEL.green }}
                  />
                </div>
                <p
                  className="text-xs font-medium mb-1"
                  style={{ color: ADMIN_STAT_LABEL.green }}
                >
                  Occupancy
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {occupancyPercent}%
                </p>
              </div>

              {/* Manager */}
              <div
                className="rounded-lg border border-gray-200 p-4"
                style={{ backgroundColor: ADMIN_STAT_BG.orange }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <User
                    className="h-4 w-4"
                    style={{ color: ADMIN_STAT_LABEL.orange }}
                  />
                </div>
                <p
                  className="text-xs font-medium mb-1"
                  style={{ color: ADMIN_STAT_LABEL.orange }}
                >
                  Manager
                </p>
                <p className="text-lg font-semibold text-gray-900">
                  {managerName}
                </p>
              </div>
            </div>

            {/* Management Actions */}
            <div className="space-y-3">
              {user?.role !== "property_manager" && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      if (!isPropertyVerified) {
                        showToast(
                          "Verify this property before assigning tenants.",
                          "error",
                        );
                        return;
                      }
                      setIsAddTenantOpen(true);
                    }}
                    className={`w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition flex items-center justify-center gap-2 ${
                      isPropertyVerified
                        ? "bg-gray-900 text-white hover:bg-gray-800"
                        : "cursor-not-allowed bg-gray-200 text-gray-500"
                    }`}
                  >
                    <UserPlus className="h-4 w-4" />
                    {isPropertyVerified
                      ? "Assign Tenant"
                      : "Verify property to assign tenant"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAssignManagerOpen(true)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 flex items-center justify-center gap-2"
                  >
                    <Users className="h-4 w-4" />
                    Assign Property Manager
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => setIsSendAnnouncementOpen(true)}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 flex items-center justify-center gap-2"
              >
                <Megaphone className="h-4 w-4" />
                Send Announcement
              </button>
            </div>

            {/* Specifications */}
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase">BUILT</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">
                    {propertyDTO?.yearBuilt || "N/A"}
                  </p>
                </div>
                <div className="h-12 w-px bg-gray-300"></div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">
                    PARKING SPACE
                  </p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">
                    {propertyDTO?.parkingSpace ? "Yes" : "No"}
                  </p>
                </div>
              </div>
            </div>

            {/* Amenities */}
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="h-4 w-4 text-gray-700" />
                <h3 className="text-sm font-semibold uppercase text-gray-700">
                  AMENITIES
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {(propertyDTO?.amenities || property.amenities).map(
                  (amenity, index) => {
                    const Icon = getAmenityIcon(amenity);
                    return (
                      <div
                        key={index}
                        className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700"
                      >
                        <Icon className="h-3.5 w-3.5 text-gray-500" />
                        <span>{amenity}</span>
                      </div>
                    );
                  },
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs - Below image gallery and stats */}
        <div className="border-b border-gray-200 overflow-x-auto scrollbar-hide">
          <nav className="-mb-px flex space-x-4 sm:space-x-8 relative min-w-max">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`relative whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition flex-shrink-0 ${
                  activeTab === tab.id
                    ? "border-brand-main text-brand-main"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-main"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div>
          <AnimatePresence mode="wait">
            {activeTab === "overview" && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className="grid gap-6 lg:grid-cols-2"
              >
                <RecentPayments payments={propertyPayments} />
                <MaintenanceRequests requests={propertyMaintenance} />
              </motion.div>
            )}
            {activeTab === "units" && (
              <motion.div
                key="units"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                {isLoadingUnits ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-brand-main border-r-transparent"></div>
                      <p className="mt-4 text-sm text-gray-600">
                        Loading units...
                      </p>
                    </div>
                  </div>
                ) : (
                  <PropertyUnitsTab
                    units={units}
                    propertyId={id as string}
                    tenants={propertyTenants}
                  />
                )}
              </motion.div>
            )}
            {activeTab === "tenants" && (
              <motion.div
                key="tenants"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <PropertyTenantsTab
                  tenants={propertyTenants}
                  propertyId={id as string}
                  propertyIsVerified={isPropertyVerified}
                />
              </motion.div>
            )}
            {activeTab === "payments" && (
              <motion.div
                key="payments"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <PropertyPaymentsTab
                  payments={paymentHistoryRows}
                  propertyId={typeof id === "string" ? id : null}
                />
              </motion.div>
            )}
            {activeTab === "maintenance" && (
              <motion.div
                key="maintenance"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                {maintenanceLoading ? (
                  <div className="flex justify-center py-12">
                    <div className="text-center">
                      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-brand-main border-r-transparent" />
                      <p className="mt-4 text-sm text-gray-600">
                        Loading maintenance requests…
                      </p>
                    </div>
                  </div>
                ) : (
                  <PropertyMaintenanceTab
                    requests={propertyMaintenanceDetails}
                    propertyId={id as string}
                  />
                )}
              </motion.div>
            )}
            {activeTab === "documents" && (
              <motion.div
                key="documents"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <PropertyDocumentsTab
                  documents={propertyDTO?.documents || []}
                  propertyId={id as string}
                  propertyDTO={propertyDTO}
                  onDocumentsUpdated={() => void fetchProperty()}
                />
              </motion.div>
            )}
            {activeTab === "settings" && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden"
              >
                <div className="grid lg:grid-cols-[220px_1fr]">
                  <nav className="border-b lg:border-b-0 lg:border-r border-gray-200 bg-gray-50/90 p-4 space-y-1">
                    {propertySettingsNav.map((item) => {
                      const Icon = item.icon;
                      const isActive = propertySettingsSection === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setPropertySettingsSection(item.id)}
                          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ${
                            isActive
                              ? "border border-blue-100 bg-blue-50 text-brand-main"
                              : "text-gray-700 hover:bg-white"
                          }`}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          {item.label}
                        </button>
                      );
                    })}
                  </nav>
                  <div className="p-6">
                    {propertySettingsSection === "documents" && (
                      <div className="space-y-6">
                        <h2 className="text-lg font-semibold text-gray-900">
                          Verification Documents
                        </h2>
                        <p className="text-sm text-gray-600">
                          Upload the documents below, then submit to send this
                          property for verification.
                        </p>
                        <div className="space-y-6">
                          <div>
                            <h3 className="mb-1 text-sm font-semibold text-gray-900">
                              Government Issued ID
                            </h3>
                            <p className="mb-3 text-sm text-gray-600">
                              Driver&apos;s License, National ID, or
                              International Passport
                            </p>
                            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-brand-main transition hover:bg-gray-50">
                              <Upload className="h-4 w-4" />
                              {propertyDocUploading === "govermentIdDocumentId"
                                ? "Uploading…"
                                : "Choose File"}
                              <input
                                type="file"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    void handlePropertyVerificationUpload(
                                      "govermentIdDocumentId",
                                      file,
                                    );
                                  }
                                }}
                              />
                            </label>
                            {propertyVerificationDocs.govermentIdDocumentId ? (
                              <p className="mt-2 text-xs text-gray-500">
                                Document uploaded
                              </p>
                            ) : null}
                          </div>
                          <div>
                            <h3 className="mb-1 text-sm font-semibold text-gray-900">
                              Land Survey Document
                            </h3>
                            <p className="mb-3 text-sm text-gray-600">
                              Property map, title deed, or official record
                            </p>
                            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-brand-main transition hover:bg-gray-50">
                              <Upload className="h-4 w-4" />
                              {propertyDocUploading === "landSurveyDocumentId"
                                ? "Uploading…"
                                : "Choose File"}
                              <input
                                type="file"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    void handlePropertyVerificationUpload(
                                      "landSurveyDocumentId",
                                      file,
                                    );
                                  }
                                }}
                              />
                            </label>
                            {propertyVerificationDocs.landSurveyDocumentId ? (
                              <p className="mt-2 text-xs text-gray-500">
                                Document uploaded
                              </p>
                            ) : null}
                          </div>
                          <div>
                            <h3 className="mb-1 text-sm font-semibold text-gray-900">
                              Proof of Ownership{" "}
                              <span className="font-normal text-gray-500">
                                (Optional)
                              </span>
                            </h3>
                            <p className="mb-3 text-sm text-gray-600">
                              Title deed, receipt of purchase, or transfer
                              agreement
                            </p>
                            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-brand-main transition hover:bg-gray-50">
                              <Upload className="h-4 w-4" />
                              {propertyDocUploading ===
                              "proofOfOwnershipDocumentId"
                                ? "Uploading…"
                                : "Choose File (Optional)"}
                              <input
                                type="file"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    void handlePropertyVerificationUpload(
                                      "proofOfOwnershipDocumentId",
                                      file,
                                    );
                                  }
                                }}
                              />
                            </label>
                            {propertyVerificationDocs.proofOfOwnershipDocumentId ? (
                              <p className="mt-2 text-xs text-gray-500">
                                Document uploaded
                              </p>
                            ) : null}
                          </div>
                          <div>
                            <h3 className="mb-1 text-sm font-semibold text-gray-900">
                              Tax Identification Number (TIN){" "}
                              <span className="font-normal text-gray-500">
                                (Optional)
                              </span>
                            </h3>
                            <p className="mb-3 text-sm text-gray-600">
                              Tax certificate or TIN document
                            </p>
                            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-brand-main transition hover:bg-gray-50">
                              <Upload className="h-4 w-4" />
                              {propertyDocUploading ===
                              "taxIdentificationNumberDocumentId"
                                ? "Uploading…"
                                : "Choose File (Optional)"}
                              <input
                                type="file"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    void handlePropertyVerificationUpload(
                                      "taxIdentificationNumberDocumentId",
                                      file,
                                    );
                                  }
                                }}
                              />
                            </label>
                            {propertyVerificationDocs.taxIdentificationNumberDocumentId ? (
                              <p className="mt-2 text-xs text-gray-500">
                                Document uploaded
                              </p>
                            ) : null}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            void handleSavePropertyVerificationDocs()
                          }
                          disabled={isSavingVerification}
                          className="rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-60"
                        >
                          {isSavingVerification
                            ? "Submitting…"
                            : "Submit property verification"}
                        </button>
                      </div>
                    )}

                    {propertySettingsSection === "gracePeriods" && (
                      <div className="space-y-8">
                        <PropertyRentRulesSummaryCard
                          status={propertySettingsStatus}
                          lines={rentRulesSummaryLines}
                        />
                        <div className="border-t border-gray-100 pt-8">
                          <h2 className="text-lg font-semibold text-gray-900">
                            Update grace periods
                          </h2>
                          <p className="mt-1 text-sm text-gray-600 max-w-2xl">
                            Grace periods add extra time after the due date
                            before rent is treated as late. Choose the window
                            that matches how often tenants pay (monthly,
                            quarterly, or yearly).
                          </p>
                          <div className="mt-6 grid gap-4 sm:grid-cols-2 max-w-3xl">
                            <div>
                              <label className="mb-2 block text-sm font-medium text-gray-700">
                                Monthly rent grace period
                              </label>
                              <select
                                className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-brand-main"
                                value={gracePeriods.monthlyRentGracePeriod}
                                onChange={(e) =>
                                  setGracePeriods((prev) => ({
                                    ...prev,
                                    monthlyRentGracePeriod: e.target.value,
                                  }))
                                }
                              >
                                {MONTHLY_GRACE_VALUES.map((v) => (
                                  <option key={v} value={v}>
                                    {gracePeriodLabel(v)}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="mb-2 block text-sm font-medium text-gray-700">
                                Quarterly rent grace period
                              </label>
                              <select
                                className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-brand-main"
                                value={gracePeriods.quarterlyRentGracePeriod}
                                onChange={(e) =>
                                  setGracePeriods((prev) => ({
                                    ...prev,
                                    quarterlyRentGracePeriod: e.target.value,
                                  }))
                                }
                              >
                                {QUARTERLY_GRACE_VALUES.map((v) => (
                                  <option key={v} value={v}>
                                    {gracePeriodLabel(v)}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="mb-2 block text-sm font-medium text-gray-700">
                                Yearly rent grace period
                              </label>
                              <select
                                className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-brand-main"
                                value={gracePeriods.yearlyRentGracePeriod}
                                onChange={(e) =>
                                  setGracePeriods((prev) => ({
                                    ...prev,
                                    yearlyRentGracePeriod: e.target.value,
                                  }))
                                }
                              >
                                {YEARLY_GRACE_VALUES.map((v) => (
                                  <option key={v} value={v}>
                                    {gracePeriodLabel(v)}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => void handleSaveGracePeriods()}
                            disabled={isSavingGracePeriod}
                            className="mt-6 rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-60"
                          >
                            {isSavingGracePeriod
                              ? "Saving…"
                              : "Save grace periods"}
                          </button>
                        </div>
                      </div>
                    )}

                    {propertySettingsSection === "preferences" && (
                      <div className="space-y-8">
                        <div>
                          <h2 className="text-lg font-semibold text-gray-900">
                            Service apartments
                          </h2>
                          <p className="mt-1 text-sm text-gray-600 max-w-lg">
                            When enabled, this property can appear in guest
                            short-stay browse. Configure nightly pricing on each
                            unit&apos;s detail page.
                          </p>
                          <label className="mt-4 flex max-w-lg cursor-pointer items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                            <input
                              type="checkbox"
                              checked={isOpenForServiceApartment}
                              onChange={(e) =>
                                setIsOpenForServiceApartment(e.target.checked)
                              }
                              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-main focus:ring-brand-main"
                            />
                            <span className="text-sm font-medium text-gray-900">
                              Open for service apartments
                            </span>
                          </label>
                          <button
                            type="button"
                            onClick={() => void handleSaveServiceApartmentFlag()}
                            disabled={isSavingServiceApartment}
                            className="mt-4 rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-60"
                          >
                            {isSavingServiceApartment
                              ? "Saving…"
                              : "Save service apartment setting"}
                          </button>
                        </div>

                        <div>
                          <h2 className="text-lg font-semibold text-gray-900">
                            Preferences
                          </h2>
                          <p className="mt-1 text-sm text-gray-600 max-w-lg">
                            Set how late fees are calculated for this property.
                            A summary also appears under{" "}
                            <span className="font-medium text-gray-800">
                              Settings → Rent grace periods
                            </span>
                            . Currency and language below are for your
                            reference—change defaults anytime in Account
                            Settings.
                          </p>
                          <div className="mt-4 space-y-4 max-w-lg">
                            <div>
                              <label className="mb-2 block text-sm font-medium text-gray-700">
                                Late fee amount
                              </label>
                              <input
                                type="number"
                                min={0}
                                step="0.01"
                                value={propertyLateFee.lateFeeAmount}
                                onChange={(e) =>
                                  setPropertyLateFee((p) => ({
                                    ...p,
                                    lateFeeAmount: e.target.value,
                                  }))
                                }
                                className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-900 focus:border-brand-main focus:outline-none focus:ring-2 focus:ring-brand-main"
                              />
                              <p className="mt-1 text-xs text-gray-500">
                                Interpreted as a fixed amount (₦) or a
                                percentage according to the type below.
                              </p>
                            </div>
                            <div>
                              <label className="mb-2 block text-sm font-medium text-gray-700">
                                Late fee type
                              </label>
                              <select
                                className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-brand-main"
                                value={propertyLateFee.lateFeeType}
                                onChange={(e) =>
                                  setPropertyLateFee((p) => ({
                                    ...p,
                                    lateFeeType: e.target.value as
                                      | "fixed"
                                      | "percentage",
                                  }))
                                }
                              >
                                <option value="percentage">Percentage</option>
                                <option value="fixed">Fixed (₦)</option>
                              </select>
                            </div>
                            <div>
                              <label className="mb-2 block text-sm font-medium text-gray-700">
                                Default Currency (reference)
                              </label>
                              <input
                                type="text"
                                value={propertyPrefsDisplay.defaultCurrency}
                                onChange={(e) =>
                                  setPropertyPrefsDisplay((p) => ({
                                    ...p,
                                    defaultCurrency: e.target.value,
                                  }))
                                }
                                className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-900 focus:border-brand-main focus:outline-none focus:ring-2 focus:ring-brand-main"
                              />
                            </div>
                            <div>
                              <label className="mb-2 block text-sm font-medium text-gray-700">
                                Language (reference)
                              </label>
                              <input
                                type="text"
                                value={propertyPrefsDisplay.language}
                                onChange={(e) =>
                                  setPropertyPrefsDisplay((p) => ({
                                    ...p,
                                    language: e.target.value,
                                  }))
                                }
                                className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-900 focus:border-brand-main focus:outline-none focus:ring-2 focus:ring-brand-main"
                              />
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => void handleSavePropertyPreferences()}
                            disabled={isSavingPreferences}
                            className="mt-6 rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-60"
                          >
                            {isSavingPreferences
                              ? "Saving…"
                              : "Save preferences"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      <AddUnitModal
        isOpen={isAddUnitOpen}
        onClose={() => setIsAddUnitOpen(false)}
        propertyId={id as string}
        propertyLabel={property.name}
        onSuccess={async () => {
          // Refresh units after successful creation
          if (id && typeof id === "string") {
            setIsLoadingUnits(true);
            const result = await getUnitsByProperty(id);
            if (result.success) {
              const mappedUnits = result.data.map((unitDTO) =>
                mapUnitDTOToUnit(unitDTO, id),
              );
              setUnits(mappedUnits);
            }
            setIsLoadingUnits(false);
          }
        }}
      />

      <AssignPropertyManagerModal
        isOpen={isAssignManagerOpen}
        onClose={() => setIsAssignManagerOpen(false)}
        propertyId={id as string}
        onAssign={(managerId) => {
          console.log("Assign manager:", managerId);
          setIsAssignManagerOpen(false);
        }}
        onInviteNew={() => {
          setIsInviteManagerOpen(true);
        }}
      />

      <InviteManagerModal
        isOpen={isInviteManagerOpen}
        onClose={() => setIsInviteManagerOpen(false)}
        onInvite={(data) => {
          console.log("Invite manager:", data);
          setIsInviteManagerOpen(false);
        }}
      />

      <SendAnnouncementModal
        isOpen={isSendAnnouncementOpen}
        onClose={() => setIsSendAnnouncementOpen(false)}
        onSend={async (data) => {
          if (!id || typeof id !== "string") {
            showToast(
              "Property details are not ready yet. Please refresh and try again.",
              "error",
            );
            throw new Error("Missing property details");
          }

          console.log("Sending property announcement", {
            propertyId: id,
            title: data.title,
          });

          const result = await createAnnouncementProperty(id, {
            title: data.title,
            content: data.message,
            fileIds: Array.isArray(data.fileIds) ? data.fileIds : [],
            propertyIds: [id],
          });
          console.log("Property announcement API result", result);

          if (result.success) {
            showToast("Announcement sent", "success");
            return;
          }

          showToast(result.error || "Failed to send announcement", "error");
          return;
        }}
      />

      <AddTenantModal
        isOpen={isAddTenantOpen}
        onClose={() => setIsAddTenantOpen(false)}
        propertyId={id as string}
        propertyIsVerified={isPropertyVerified}
        units={units.map((u) => ({
          id: u.id,
          unitId: u.unitId,
          type: u.type,
          isAvailable: u.status !== "occupied",
        }))}
        onSuccess={() => {
          if (id && typeof id === "string") {
            setIsLoadingUnits(true);
            getUnitsByProperty(id).then((result) => {
              if (result.success) {
                setUnits(
                  result.data.map((unitDTO) => mapUnitDTOToUnit(unitDTO, id)),
                );
              }
              setIsLoadingUnits(false);
            });
          }
        }}
      />
    </>
  );
};

PropertyDetailPage.getLayout = (page) => (
  <DashboardLayout>{page}</DashboardLayout>
);

export default PropertyDetailPage;
