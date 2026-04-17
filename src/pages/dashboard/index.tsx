import Head from "next/head";
import { useRouter } from "next/router";
import { format, parseISO } from "date-fns";
import * as React from "react";
import { Building2 } from "lucide-react";

import { DashboardLayout } from "@/components/DashboardLayout";
import { DashboardSummaryCards } from "@/components/DashboardSummaryCards";
import { DashboardActionButtons } from "@/components/DashboardActionButtons";
import { RecentPayments } from "@/components/RecentPayments";
import { MaintenanceRequests } from "@/components/MaintenanceRequests";
import { MyProperties } from "@/components/MyProperties";
import { AddTenantModal } from "@/components/AddTenantModal";
import { SendAnnouncementModal } from "@/components/SendAnnouncementModal";
import { AnnouncementDetailsModal } from "@/components/AnnouncementDetailsModal";
import { useToast } from "@/components/Toast";
import { useUser } from "@/contexts/UserContext";
import { useSelectedLandlord } from "@/contexts/SelectedLandlordContext";
import { getPropertiesByLandlord } from "@/api/properties";
import { getTenantByUser } from "@/api/tenants";
import type { TenantByUserDTO } from "@/api/tenants";
import { mapPropertyDTOToProperty } from "@/api/properties/mapProperty";
import type {
  Property,
  MaintenanceRequest,
  DashboardStats,
} from "@/data/mockLandlordData";
import { mockRecentPayments } from "@/data/mockLandlordData";
import { getMaintenanceRequests } from "@/api/maintenance";
import {
  type AnnouncementItemDTO,
  createAnnouncementLandlord,
  createAnnouncementProperty,
  subscribeAnnouncements,
} from "@/api/announcement";

import type { NextPageWithLayout } from "../_app";

const formatAnnouncementDate = (value?: string) => {
  if (!value) return "Just now";
  try {
    return format(parseISO(value), "dd MMM yyyy, h:mm a");
  } catch {
    return value;
  }
};

const isLandlordLevelAnnouncement = (item: AnnouncementItemDTO) => {
  return (item.level || "").toUpperCase() === "LANDLORD";
};

const keepExistingWhenIncomingEmpty = (
  previous: AnnouncementItemDTO[],
  incoming: AnnouncementItemDTO[],
) => {
  if (incoming.length === 0 && previous.length > 0) {
    return previous;
  }
  return incoming;
};

type LiveAnnouncementsCardProps = {
  announcements: AnnouncementItemDTO[];
  title?: string;
  emptyText?: string;
  onViewAll?: () => void;
  onAnnouncementClick?: (item: AnnouncementItemDTO) => void;
};

const LiveAnnouncementsCard = ({
  announcements,
  title = "Live Announcements",
  emptyText = "Waiting for announcements from socket...",
  onViewAll,
  onAnnouncementClick,
}: LiveAnnouncementsCardProps) => {
  const preview = announcements.slice(0, 3);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <div className="flex items-center gap-3">
          {onViewAll ? (
            <button
              type="button"
              onClick={onViewAll}
              className="text-sm font-medium text-brand-main transition hover:text-brand-main/80"
            >
              View All
            </button>
          ) : null}
          <span className="inline-flex items-center rounded-full bg-brand-main/10 px-2.5 py-1 text-xs font-semibold text-brand-main">
            {announcements.length}
          </span>
        </div>
      </div>
      {preview.length === 0 ? (
        <p className="text-sm text-gray-500">{emptyText}</p>
      ) : (
        <div className="space-y-3">
          {preview.map((item, index) => (
            <div
              key={item.id || `${item.title}-${index}`}
              className="rounded-md border border-gray-100 bg-gray-50 p-3"
            >
              <button
                type="button"
                onClick={() => onAnnouncementClick?.(item)}
                className="w-full text-left"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-gray-900">
                    {item.title}
                  </p>
                  <span className="text-xs text-gray-500">
                    {formatAnnouncementDate(item.createdAt)}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-600">{item.content}</p>
                {item.fileIds && item.fileIds.length > 0 ? (
                  <p className="mt-1 text-xs text-gray-500">
                    Attachments: {item.fileIds.length}
                  </p>
                ) : null}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Manager Dashboard Component
const ManagerDashboard = () => {
  const router = useRouter();
  const { showToast } = useToast();
  const { user } = useUser();
  const { selectedLandlord } = useSelectedLandlord();
  const [landlordProperties, setLandlordProperties] = React.useState<
    Property[]
  >([]);
  const [propertiesLoading, setPropertiesLoading] = React.useState(true);
  const [recentMaintenance, setRecentMaintenance] = React.useState<
    MaintenanceRequest[]
  >([]);
  const [maintenanceLoading, setMaintenanceLoading] = React.useState(true);
  const [liveAnnouncements, setLiveAnnouncements] = React.useState<
    AnnouncementItemDTO[]
  >([]);
  const [selectedAnnouncement, setSelectedAnnouncement] =
    React.useState<AnnouncementItemDTO | null>(null);
  const [isSendAnnouncementOpen, setIsSendAnnouncementOpen] =
    React.useState(false);

  // Redirect to landlord selection if no landlord is selected
  React.useEffect(() => {
    if (!selectedLandlord) {
      router.replace("/dashboard/select-landlord");
    }
  }, [selectedLandlord, router]);

  // Fetch real properties for the selected landlord
  React.useEffect(() => {
    if (!selectedLandlord?.id) {
      setLandlordProperties([]);
      setPropertiesLoading(false);
      return;
    }
    let cancelled = false;
    setPropertiesLoading(true);
    getPropertiesByLandlord(selectedLandlord.id).then((result) => {
      if (cancelled) return;
      if (result.success) {
        setLandlordProperties(result.data.map(mapPropertyDTOToProperty));
      } else {
        setLandlordProperties([]);
      }
      setPropertiesLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [selectedLandlord?.id]);

  // Fetch recent maintenance requests (global for now)
  React.useEffect(() => {
    let cancelled = false;
    setMaintenanceLoading(true);
    getMaintenanceRequests({ limit: 10 }).then((result) => {
      if (cancelled) return;
      if (result.success) {
        const mapped: MaintenanceRequest[] = result.data.map((r) => ({
          id: r.id,
          type: r.type || "Maintenance",
          description: r.subType || r.description || "",
          propertyName: r.propertyName || "",
          unit: r.unit || "",
          status: r.status === "resolved" ? "completed" : r.status,
          priority: r.priority,
          timeAgo: r.reportedTime || "",
        }));
        setRecentMaintenance(mapped.slice(0, 3));
      } else {
        setRecentMaintenance([]);
      }
      setMaintenanceLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    if (!user?.token) return;
    const subscription = subscribeAnnouncements({
      token: user.token,
      onLoad: (items) => {
        const landlordItems = items.filter(isLandlordLevelAnnouncement);
        setLiveAnnouncements((prev) =>
          keepExistingWhenIncomingEmpty(prev, landlordItems),
        );
        console.log("Manager loaded announcements via socket", {
          count: landlordItems.length,
          items: landlordItems,
          rawCount: items.length,
        });
      },
      onRaw: (payload) => {
        console.log("Manager raw announcement socket payload", payload);
      },
      onError: (error) => {
        console.warn("Manager announcement socket error:", error);
      },
    });
    return () => {
      subscription.disconnect();
      console.log("Manager announcement socket disconnected");
    };
  }, [user?.token]);

  if (!selectedLandlord) {
    return null;
  }

  // Filter payments for the selected landlord's properties (by property name)
  const landlordPayments = React.useMemo(() => {
    return mockRecentPayments.filter((payment) =>
      landlordProperties.some((prop) => prop.name === payment.propertyName),
    );
  }, [landlordProperties]);

  // Calculate stats for selected landlord
  const landlordStats = React.useMemo(() => {
    const totalProperties = landlordProperties.length;
    const totalUnits = landlordProperties.reduce((sum, p) => sum + p.units, 0);
    const unitsUnderMaintenance = recentMaintenance.filter(
      (r) => r.status === "in_progress",
    ).length;
    const totalRent = landlordPayments.reduce((sum, p) => sum + p.amount, 0);
    const overdueCount = landlordPayments.filter((p) => {
      const dueDate = new Date(p.dueDate);
      const today = new Date();
      return dueDate < today;
    }).length;

    return {
      totalProperties,
      pendingVerification: landlordProperties.filter(
        (p) => p.status === "pending",
      ).length,
      totalUnits,
      unitsUnderMaintenance,
      rentCollected: totalRent,
      rentCollectedPeriod: "This month",
      overdueAmount: landlordPayments
        .filter((p) => {
          const dueDate = new Date(p.dueDate);
          const today = new Date();
          return dueDate < today;
        })
        .reduce((sum, p) => sum + p.amount, 0),
      overdueCount,
    };
  }, [landlordProperties, recentMaintenance, landlordPayments]);

  const handleManagerSendAnnouncement = React.useCallback(
    async (data: { title: string; message: string; fileIds?: string[] }) => {
      const primaryProperty = landlordProperties[0];
      if (!primaryProperty?.id) {
        showToast(
          "No property found to send this announcement. Add or select a property first.",
          "error",
        );
        throw new Error("Missing property id for manager announcement");
      }

      console.log("Sending manager property announcement", {
        propertyId: primaryProperty.id,
        title: data.title,
      });

      const result = await createAnnouncementProperty(primaryProperty.id, {
        title: data.title,
        content: data.message,
        fileIds: Array.isArray(data.fileIds) ? data.fileIds : [],
      });
      console.log("Manager property announcement API result", result);

      if (result.success) {
        showToast("Announcement sent", "success");
        return;
      }

      showToast(result.error || "Failed to send announcement", "error");
      throw new Error(result.error || "Failed to send announcement");
    },
    [landlordProperties, showToast],
  );

  return (
    <section className="space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Dashboard
          </h1>
          <p className="mt-1 text-sm sm:text-base font-normal text-gray-600">
            Welcome back! Here's what's happening with your Clients properties.
          </p>
        </div>
        <button
          onClick={() => setIsSendAnnouncementOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
            />
          </svg>
          Send Announcement
        </button>
      </div>

      {/* Summary Cards */}
      <DashboardSummaryCards stats={landlordStats} />

      <LiveAnnouncementsCard
        announcements={liveAnnouncements}
        title="Landlord Broadcasts"
        onViewAll={() => router.push("/dashboard/announcements")}
        onAnnouncementClick={(item) => setSelectedAnnouncement(item)}
      />

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Payments */}
        <RecentPayments
          payments={landlordPayments.slice(0, 3)}
          onViewAll={() => router.push("/dashboard/rent")}
        />

        {/* Maintenance Requests */}
        <MaintenanceRequests
          requests={recentMaintenance.slice(0, 3)}
          onViewAll={() => router.push("/dashboard/maintenance")}
        />
      </div>

      {/* Properties Section */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          {selectedLandlord.name}'s Properties
        </h2>
        <button
          onClick={() => router.push("/dashboard/properties")}
          className="text-sm font-medium text-brand-main hover:text-brand-main/80"
        >
          View All
        </button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {propertiesLoading ? (
          <div className="col-span-full flex justify-center py-8">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-solid border-brand-main border-r-transparent" />
          </div>
        ) : landlordProperties.length === 0 ? (
          <p className="col-span-full text-sm text-gray-500 py-4">
            No properties for this landlord yet.
          </p>
        ) : (
          landlordProperties.slice(0, 3).map((property) => (
            <div
              key={property.id}
              onClick={() =>
                router.push(`/dashboard/properties/${property.id}`)
              }
              className="bg-white rounded-lg border border-gray-200 overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
            >
              {/* Property Image */}
              <div className="relative h-48 w-full">
                <img
                  src={property.image}
                  alt={property.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3">
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded ${
                      property.status === "active"
                        ? "bg-brand-green text-white"
                        : property.status === "pending"
                          ? "bg-yellow-500 text-white"
                          : "bg-gray-700 text-white"
                    }`}
                  >
                    {property.status === "active"
                      ? "Active"
                      : property.status === "pending"
                        ? "Pending Verification"
                        : "Inactive"}
                  </span>
                </div>
                <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-1">
                  {property.amenities.slice(0, 3).map((amenity, idx) => (
                    <span
                      key={idx}
                      className="bg-white/90 text-gray-700 text-xs font-medium px-2 py-1 rounded"
                    >
                      {amenity}
                    </span>
                  ))}
                  {property.amenities.length > 3 && (
                    <span className="bg-white/90 text-gray-700 text-xs font-medium px-2 py-1 rounded">
                      +{property.amenities.length - 3}
                    </span>
                  )}
                </div>
              </div>

              {/* Property Details */}
              <div className="p-4 space-y-3">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">
                    {property.name}
                  </h3>
                  <p className="text-sm text-gray-600">{property.address}</p>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{property.units} Units</span>
                  <span className="text-gray-600">
                    {property.occupancy}% Occupancy
                  </span>
                </div>
                <div className="pt-3 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500 uppercase">
                      Total Units
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      {property.units} {property.units === 1 ? "Unit" : "Units"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs font-medium text-gray-500 uppercase">
                      Occupancy
                    </span>
                    <span className="text-sm font-medium text-gray-700">
                      {property.occupancy}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      <AnnouncementDetailsModal
        isOpen={Boolean(selectedAnnouncement)}
        announcement={selectedAnnouncement}
        onClose={() => setSelectedAnnouncement(null)}
      />
      <SendAnnouncementModal
        isOpen={isSendAnnouncementOpen}
        onClose={() => setIsSendAnnouncementOpen(false)}
        onSend={handleManagerSendAnnouncement}
      />
    </section>
  );
};

/** Pick the latest lease (by end date descending); active lease first if present */
function getLatestLease(leases: TenantByUserDTO["leases"]) {
  if (!leases?.length) return null;
  const sorted = [...leases].sort((a, b) => {
    const endA = new Date(a.endDate).getTime();
    const endB = new Date(b.endDate).getTime();
    return endB - endA;
  });
  return sorted[0];
}

// Tenant Dashboard Component
const TenantDashboard = () => {
  const { user } = useUser();
  const router = useRouter();
  const [tenantDetails, setTenantDetails] =
    React.useState<TenantByUserDTO | null>(null);
  const [tenantLoading, setTenantLoading] = React.useState(true);
  const [tenantError, setTenantError] = React.useState<string | null>(null);
  const [isTenantUnassigned, setIsTenantUnassigned] = React.useState(false);
  const [liveAnnouncements, setLiveAnnouncements] = React.useState<
    AnnouncementItemDTO[]
  >([]);
  const [selectedAnnouncement, setSelectedAnnouncement] =
    React.useState<AnnouncementItemDTO | null>(null);

  React.useEffect(() => {
    if (!user?.id || user?.role !== "tenant") {
      setTenantLoading(false);
      return;
    }
    let cancelled = false;
    setTenantLoading(true);
    setTenantError(null);
    setIsTenantUnassigned(false);
    getTenantByUser(String(user.id))
      .then((result) => {
        if (cancelled) return;
        if (result.success) {
          setTenantDetails(result.data);
          return;
        }
        const message = (result.error || "").toLowerCase();
        const notAssigned =
          result.statusCode === 404 ||
          message.includes("tenant not found") ||
          message.includes("not assigned");

        if (notAssigned) {
          setTenantDetails(null);
          setIsTenantUnassigned(true);
          setTenantError(null);
          return;
        }

        setTenantError(result.error ?? "Failed to load tenant details");
      })
      .finally(() => {
        if (!cancelled) setTenantLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.role]);

  React.useEffect(() => {
    if (!user?.id || user.role !== "tenant" || !user.token) return;
    const subscription = subscribeAnnouncements({
      token: user.token,
      onLoad: (items) => {
        const landlordItems = items.filter(isLandlordLevelAnnouncement);
        setLiveAnnouncements((prev) =>
          keepExistingWhenIncomingEmpty(prev, landlordItems),
        );
        console.log("Tenant loaded announcements via socket", {
          count: landlordItems.length,
          items: landlordItems,
          rawCount: items.length,
        });
      },
      onRaw: (payload) => {
        console.log("Tenant raw announcement socket payload", payload);
      },
      onError: (error) => {
        console.warn("Tenant announcement socket error:", error);
      },
    });
    return () => {
      subscription.disconnect();
      console.log("Tenant announcement socket disconnected");
    };
  }, [user?.id, user?.role, user?.token]);

  const latestLease = React.useMemo(
    () => getLatestLease(tenantDetails?.leases),
    [tenantDetails?.leases],
  );

  const currentUnit = tenantDetails?.currentUnit;
  const unitTypeLabel = currentUnit
    ? `${currentUnit.numberOfBedrooms ?? 0}BR Apartment`
    : "—";
  const amenities = currentUnit?.amenities ?? [];
  const defaultPropertyImage =
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop";

  const handleSendMessage = (type: "manager" | "landlord") => {
    // Navigate to messages page with the appropriate contact
    router.push("/dashboard/messages");
  };

  if (tenantLoading) {
    return (
      <section className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-600">Welcome back!</p>
        </div>
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
        </div>
      </section>
    );
  }

  if (tenantError) {
    return (
      <section className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-600">Welcome back!</p>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {tenantError}
        </div>
      </section>
    );
  }

  if (isTenantUnassigned) {
    return (
      <section className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-600">Welcome back!</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center max-w-md mx-auto">
          <Building2 className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-3 text-sm font-medium text-gray-900">
            No unit assigned yet
          </p>
          <p className="mt-1 text-sm text-gray-600">
            You have not been assigned to any unit yet. Please contact your
            landlord or property manager.
          </p>
        </div>
      </section>
    );
  }

  const leaseStartFormatted = latestLease?.startDate
    ? format(parseISO(latestLease.startDate), "dd MMM yyyy")
    : "—";
  const leaseEndFormatted = latestLease?.endDate
    ? format(parseISO(latestLease.endDate), "dd MMM yyyy")
    : "—";
  const rentAmount = latestLease?.rentAmount ?? currentUnit?.rentAmount ?? 0;
  const rentFrequency = latestLease?.rentFrequency ?? "monthly";
  const monthlyRentDisplay =
    rentFrequency === "yearly"
      ? Math.round(rentAmount / 12)
      : rentFrequency === "quarterly"
        ? Math.round(rentAmount / 3)
        : rentFrequency === "weekly"
          ? rentAmount * 4
          : rentAmount;

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Dashboard
          </h1>
          <p className="mt-1 text-sm sm:text-base font-normal text-gray-600">
            Welcome back! Here's what's happening with your rental.
          </p>
        </div>
      </div>

      <LiveAnnouncementsCard
        announcements={liveAnnouncements}
        title="Landlord Broadcasts"
        emptyText="No announcements yet for your account."
        onViewAll={() => router.push("/dashboard/announcements")}
        onAnnouncementClick={(item) => setSelectedAnnouncement(item)}
      />

      {/* Main Content Grid - 4 Cards */}
      <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
        {/* Current Unit Card */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
          <div className="relative h-48 w-full">
            <img
              src={defaultPropertyImage}
              alt={currentUnit?.name ?? "Your unit"}
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
              <h3 className="text-white font-semibold text-base sm:text-lg">
                {currentUnit ? `Unit ${currentUnit.name}` : "Your Unit"}
              </h3>
              <p className="text-white/90 text-xs sm:text-sm mt-1">
                {currentUnit
                  ? `${unitTypeLabel} · ₦${(currentUnit.rentAmount ?? 0).toLocaleString()} rent`
                  : "—"}
              </p>
            </div>
          </div>
          <div className="p-4 sm:p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wide">
                  Unit Number
                </p>
                <p className="text-sm sm:text-base font-semibold text-gray-900 mt-1">
                  {currentUnit?.name ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wide">
                  Unit Type
                </p>
                <p className="text-sm sm:text-base font-semibold text-gray-900 mt-1">
                  {unitTypeLabel}
                </p>
              </div>
            </div>
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                Amenities
              </p>
              <div className="flex flex-wrap gap-2">
                {amenities.length > 0 ? (
                  amenities.map((amenity, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-1 rounded-md border border-green-200 bg-green-50 text-green-700 text-xs font-medium"
                    >
                      {amenity}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-gray-500">—</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Rental Information Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 shadow-sm">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">
            $ Rental Information
          </h3>
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm text-gray-600">
                Monthly Rent
              </span>
              <span className="text-sm sm:text-base font-semibold text-gray-900">
                ₦{monthlyRentDisplay.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm text-gray-600">
                Next Payment Due
              </span>
              <span className="text-sm sm:text-base font-medium text-gray-900">
                —
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm text-gray-600">
                Payment Status
              </span>
              <span className="text-sm sm:text-base font-medium text-gray-500">
                —
              </span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-gray-200">
              <span className="text-xs sm:text-sm text-gray-600">
                Last Payment
              </span>
              <span className="text-sm sm:text-base font-medium text-gray-900">
                —
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm text-gray-600">
                Lease Start
              </span>
              <span className="text-sm sm:text-base font-medium text-gray-900">
                {leaseStartFormatted}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm text-gray-600">
                Lease End
              </span>
              <span className="text-sm sm:text-base font-medium text-gray-900">
                {leaseEndFormatted}
              </span>
            </div>
          </div>
        </div>

        {/* Property Manager Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 shadow-sm">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">
            Property Manager
          </h3>
          <div className="space-y-3 sm:space-y-4">
            <p className="text-sm text-gray-500">Contact via Messages</p>
          </div>
          <button
            onClick={() => handleSendMessage("manager")}
            className="mt-4 sm:mt-6 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-2.5 text-sm sm:text-base font-medium text-white transition hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          >
            <svg
              className="h-4 w-4 sm:h-5 sm:w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            Send Message
          </button>
        </div>

        {/* Landlord Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 shadow-sm">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">
            Landlord
          </h3>
          <div className="space-y-3 sm:space-y-4">
            <p className="text-sm text-gray-500">Contact via Messages</p>
          </div>
          <button
            onClick={() => handleSendMessage("landlord")}
            className="mt-4 sm:mt-6 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-brand-main px-4 py-2.5 text-sm sm:text-base font-medium text-white transition hover:bg-brand-main/90 focus:outline-none focus:ring-2 focus:ring-brand-main focus:ring-offset-2"
          >
            <svg
              className="h-4 w-4 sm:h-5 sm:w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            Send Message
          </button>
        </div>
      </div>
      <AnnouncementDetailsModal
        isOpen={Boolean(selectedAnnouncement)}
        announcement={selectedAnnouncement}
        onClose={() => setSelectedAnnouncement(null)}
      />
    </section>
  );
};

// Landlord Dashboard Component (existing)
const LandlordDashboard = () => {
  const router = useRouter();
  const { showToast } = useToast();
  const { user } = useUser();
  const [isAddTenantOpen, setIsAddTenantOpen] = React.useState(false);
  const [isSendAnnouncementOpen, setIsSendAnnouncementOpen] =
    React.useState(false);
  const [properties, setProperties] = React.useState<Property[]>([]);
  const [isLoadingProperties, setIsLoadingProperties] = React.useState(true);
  const [recentMaintenance, setRecentMaintenance] = React.useState<
    MaintenanceRequest[]
  >([]);
  const [allMaintenanceForStats, setAllMaintenanceForStats] = React.useState<
    MaintenanceRequest[]
  >([]);
  const [maintenanceLoading, setMaintenanceLoading] = React.useState(true);
  const [liveAnnouncements, setLiveAnnouncements] = React.useState<
    AnnouncementItemDTO[]
  >([]);
  const [selectedAnnouncement, setSelectedAnnouncement] =
    React.useState<AnnouncementItemDTO | null>(null);

  // Fetch properties for the landlord
  React.useEffect(() => {
    const fetchProperties = async () => {
      setIsLoadingProperties(true);
      const landlordId =
        typeof window !== "undefined"
          ? localStorage.getItem("landlordId")
          : null;
      if (landlordId) {
        const result = await getPropertiesByLandlord(landlordId);
        if (result.success) {
          const mappedProperties = result.data.map(mapPropertyDTOToProperty);
          setProperties(mappedProperties);
        }
      }
      setIsLoadingProperties(false);
    };

    fetchProperties();
  }, []);

  // Fetch maintenance for dashboard KPIs and recent list
  React.useEffect(() => {
    let cancelled = false;
    setMaintenanceLoading(true);
    getMaintenanceRequests({ limit: 100 }).then((result) => {
      if (cancelled) return;
      if (result.success) {
        const mapped: MaintenanceRequest[] = result.data.map((r) => ({
          id: r.id,
          type: r.type || "Maintenance",
          description: r.subType || r.description || "",
          propertyName: r.propertyName || "",
          unit: r.unit || "",
          status: r.status === "resolved" ? "completed" : r.status,
          priority: r.priority,
          timeAgo: r.reportedTime || "",
        }));
        setAllMaintenanceForStats(mapped);
        setRecentMaintenance(mapped.slice(0, 3));
      } else {
        setAllMaintenanceForStats([]);
        setRecentMaintenance([]);
      }
      setMaintenanceLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Subscribe to announcements feed over websocket.
  React.useEffect(() => {
    if (!user?.token) return;
    const subscription = subscribeAnnouncements({
      token: user.token,
      onLoad: (items) => {
        setLiveAnnouncements((prev) =>
          keepExistingWhenIncomingEmpty(prev, items),
        );
        console.log("Loaded announcements via socket", {
          count: items.length,
          items,
        });
      },
      onRaw: (payload) => {
        console.log("Raw announcement socket payload", payload);
      },
      onError: (error) => {
        console.warn("Announcement socket error:", error);
      },
    });
    return () => {
      subscription.disconnect();
      console.log("Announcement socket disconnected");
    };
  }, [user?.token]);

  const handleAddProperty = React.useCallback(() => {
    router.push("/dashboard/properties/new");
  }, [router]);

  const handleAssignTenant = React.useCallback(() => {
    setIsAddTenantOpen(true);
  }, []);

  const handleSendAnnouncement = React.useCallback(() => {
    setIsSendAnnouncementOpen(true);
  }, []);

  const handleAnnouncementSend = React.useCallback(
    async (data: { title: string; message: string; fileIds?: string[] }) => {
      const landlordId =
        typeof window !== "undefined" ? localStorage.getItem("landlordId") : "";

      if (!landlordId) {
        showToast("Missing landlord id. Please sign in again.", "error");
        throw new Error("Missing landlord id");
      }

      console.log("Sending landlord announcement", {
        landlordId,
        title: data.title,
      });

      const result = await createAnnouncementLandlord(landlordId, {
        title: data.title,
        content: data.message,
        fileIds: Array.isArray(data.fileIds) ? data.fileIds : [],
      });
      console.log("Landlord announcement API result", result);

      if (result.success) {
        const responseData =
          result.data &&
          typeof result.data.data === "object" &&
          result.data.data
            ? (result.data.data as {
                id?: string;
                createdAt?: string;
                updatedAt?: string;
              })
            : null;

        // Fallback: update UI immediately even if websocket event is delayed/missing.
        setLiveAnnouncements((prev) => [
          {
            id: responseData?.id,
            title: data.title,
            content: data.message,
            level: "LANDLORD",
            fileIds: Array.isArray(data.fileIds) ? data.fileIds : [],
            createdAt: responseData?.createdAt || new Date().toISOString(),
            updatedAt: responseData?.updatedAt || new Date().toISOString(),
          },
          ...prev,
        ]);
        showToast("Announcement sent", "success");
        return;
      }

      showToast(result.error || "Failed to send announcement", "error");
      return;
    },
    [showToast],
  );

  const landlordStats = React.useMemo((): DashboardStats => {
    const totalProperties = properties.length;
    const pendingVerification = properties.filter(
      (p) => p.status === "pending",
    ).length;
    const totalUnits = properties.reduce((sum, p) => sum + p.units, 0);

    const propertyNames = new Set(
      properties.map((p) => p.name.trim().toLowerCase()),
    );
    const unitsUnderMaintenance =
      propertyNames.size === 0
        ? 0
        : allMaintenanceForStats.filter((r) => {
            if (r.status !== "in_progress" && r.status !== "new") return false;
            return propertyNames.has(r.propertyName.trim().toLowerCase());
          }).length;

    return {
      totalProperties,
      pendingVerification,
      totalUnits,
      unitsUnderMaintenance,
      rentCollected: 0,
      rentCollectedPeriod: "No payment data yet",
      overdueAmount: 0,
      overdueCount: 0,
    };
  }, [properties, allMaintenanceForStats]);

  const summaryCardsLoading = isLoadingProperties || maintenanceLoading;

  return (
    <>
      <section className="space-y-6">
        {/* Welcome Section */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              Dashboard
            </h1>
            <p className="mt-1 text-sm sm:text-base font-normal text-gray-600">
              Welcome back! Here's what's happening with your properties.
            </p>
          </div>
          <DashboardActionButtons
            onAddProperty={handleAddProperty}
            onAssignTenant={handleAssignTenant}
            onSendAnnouncement={handleSendAnnouncement}
          />
        </div>

        {/* Summary Cards */}
        <DashboardSummaryCards
          stats={landlordStats}
          loading={summaryCardsLoading}
        />

        <LiveAnnouncementsCard
          announcements={liveAnnouncements}
          onViewAll={() => router.push("/dashboard/announcements")}
          onAnnouncementClick={(item) => setSelectedAnnouncement(item)}
        />

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Payments */}
          <RecentPayments
            payments={mockRecentPayments.slice(0, 3)}
            onViewAll={() => router.push("/dashboard/rent")}
          />

          {/* Maintenance Requests */}
          {maintenanceLoading ? (
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm flex items-center justify-center">
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-brand-main border-r-transparent" />
                <p className="mt-4 text-sm text-gray-600">
                  Loading maintenance requests...
                </p>
              </div>
            </div>
          ) : (
            <MaintenanceRequests
              requests={recentMaintenance}
              onViewAll={() => router.push("/dashboard/maintenance")}
            />
          )}
        </div>

        {/* My Properties */}
        {isLoadingProperties ? (
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              My Properties
            </h2>
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-brand-main border-r-transparent"></div>
                <p className="mt-4 text-sm text-gray-600">
                  Loading properties...
                </p>
              </div>
            </div>
          </div>
        ) : (
          <MyProperties
            properties={properties.slice(0, 3)}
            onViewAll={() => router.push("/dashboard/properties")}
          />
        )}
      </section>

      {/* Modals */}
      <AddTenantModal
        isOpen={isAddTenantOpen}
        onClose={() => setIsAddTenantOpen(false)}
      />
      <SendAnnouncementModal
        isOpen={isSendAnnouncementOpen}
        onClose={() => setIsSendAnnouncementOpen(false)}
        onSend={handleAnnouncementSend}
      />
      <AnnouncementDetailsModal
        isOpen={Boolean(selectedAnnouncement)}
        announcement={selectedAnnouncement}
        onClose={() => setSelectedAnnouncement(null)}
      />
    </>
  );
};

const DashboardPage: NextPageWithLayout = () => {
  const { user, isLoading } = useUser();
  const router = useRouter();

  // Show loading state while checking user
  if (isLoading) {
    return (
      <>
        <Head>
          <title>DWELLA NG · Dashboard</title>
        </Head>
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-gray-500">Loading...</p>
        </div>
      </>
    );
  }

  // Determine which dashboard to show based on role
  const renderDashboard = () => {
    if (!user) {
      return (
        <div className="text-center py-12 text-gray-500">
          <p>Please log in to view your dashboard</p>
        </div>
      );
    }

    switch (user.role) {
      case "super_admin":
        return null;
      case "property_manager":
        return <ManagerDashboard />;
      case "tenant":
        return <TenantDashboard />;
      case "landlord":
      default:
        return <LandlordDashboard />;
    }
  };

  React.useEffect(() => {
    if (user?.role === "super_admin") {
      router.replace("/dashboard/admin");
    }
  }, [router, user?.role]);

  return (
    <>
      <Head>
        <title>DWELLA NG · Dashboard</title>
      </Head>
      {renderDashboard()}
    </>
  );
};

DashboardPage.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;

export default DashboardPage;
