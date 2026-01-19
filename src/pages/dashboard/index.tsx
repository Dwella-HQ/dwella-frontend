import Head from "next/head";
import { useRouter } from "next/router";
import * as React from "react";

import { DashboardLayout } from "@/components/DashboardLayout";
import { DashboardSummaryCards } from "@/components/DashboardSummaryCards";
import { DashboardActionButtons } from "@/components/DashboardActionButtons";
import { RecentPayments } from "@/components/RecentPayments";
import { MaintenanceRequests } from "@/components/MaintenanceRequests";
import { MyProperties } from "@/components/MyProperties";
import { AddTenantModal } from "@/components/AddTenantModal";
import { SendAnnouncementModal } from "@/components/SendAnnouncementModal";
import { useUser } from "@/contexts/UserContext";
import { useSelectedLandlord } from "@/contexts/SelectedLandlordContext";
import {
  mockDashboardStats,
  mockRecentPayments,
  mockMaintenanceRequests,
  mockProperties,
} from "@/data/mockLandlordData";

import type { NextPageWithLayout } from "../_app";

// Manager Dashboard Component
const ManagerDashboard = () => {
  const router = useRouter();
  const { selectedLandlord } = useSelectedLandlord();

  // Redirect to landlord selection if no landlord is selected
  React.useEffect(() => {
    if (!selectedLandlord) {
      router.replace("/dashboard/select-landlord");
    }
  }, [selectedLandlord, router]);

  if (!selectedLandlord) {
    return null;
  }

  // Filter properties for the selected landlord
  const landlordProperties = React.useMemo(() => {
    return mockProperties.filter((p) =>
      selectedLandlord.properties.some((lp) => lp.id === p.id)
    );
  }, [selectedLandlord]);

  // Filter payments for the selected landlord's properties
  const landlordPayments = React.useMemo(() => {
    const propertyIds = selectedLandlord.properties.map((p) => p.id);
    return mockRecentPayments.filter((payment) =>
      landlordProperties.some((prop) => prop.name === payment.propertyName)
    );
  }, [selectedLandlord, landlordProperties]);

  // Filter maintenance requests for the selected landlord's properties
  const landlordMaintenanceRequests = React.useMemo(() => {
    return mockMaintenanceRequests.filter((request) =>
      landlordProperties.some((prop) => prop.name === request.propertyName)
    );
  }, [landlordProperties]);

  // Calculate stats for selected landlord
  const landlordStats = React.useMemo(() => {
    const totalProperties = landlordProperties.length;
    const totalUnits = landlordProperties.reduce((sum, p) => sum + p.units, 0);
    const unitsUnderMaintenance = landlordMaintenanceRequests.filter(
      (r) => r.status === "in_progress"
    ).length;
    const totalRent = landlordPayments.reduce((sum, p) => sum + p.amount, 0);
    const overdueCount = landlordPayments.filter((p) => {
      const dueDate = new Date(p.dueDate);
      const today = new Date();
      return dueDate < today;
    }).length;

    return {
      totalProperties,
      pendingVerification: 1, // Mock value
      totalUnits,
      unitsUnderMaintenance,
      rentCollected: totalRent,
      rentCollectedPeriod: "This month",
      overdueAmount: 250000, // Mock value
      overdueCount,
    };
  }, [landlordProperties, landlordMaintenanceRequests, landlordPayments]);

  return (
    <section className="space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm sm:text-base font-normal text-gray-600">
            Welcome back! Here's what's happening with your Clients properties.
          </p>
        </div>
        <button
          onClick={() => router.push("/dashboard/messages")}
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

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Payments */}
        <RecentPayments
          payments={landlordPayments.slice(0, 3)}
          onViewAll={() => router.push("/dashboard/rent")}
        />

        {/* Maintenance Requests */}
        <MaintenanceRequests
          requests={landlordMaintenanceRequests.slice(0, 3)}
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
        {landlordProperties.slice(0, 3).map((property, index) => (
          <div
            key={property.id}
            onClick={() => router.push(`/dashboard/properties/${property.id}`)}
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
                <span className="bg-green-500 text-white text-xs font-medium px-2 py-1 rounded">
                  Active
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
                <h3 className="text-base font-semibold text-gray-900">{property.name}</h3>
                <p className="text-sm text-gray-600">{property.address}</p>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{property.units} Units</span>
                <span className="text-gray-600">{property.occupancy}% Occupancy</span>
              </div>
              <div className="pt-3 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500 uppercase">
                    Monthly Rent
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    ₦{property.monthlyRent.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs font-medium text-gray-500 uppercase">
                    Next Due
                  </span>
                  <span className="text-sm font-medium text-gray-700">
                    {property.nextDue}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

// Tenant Dashboard Component (placeholder - will be implemented later)
const TenantDashboard = () => {
  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm sm:text-base font-normal text-gray-600">
            Welcome back! Here's what's happening with your rental.
          </p>
        </div>
      </div>
      
      {/* Tenant-specific dashboard content will be added here */}
      <div className="text-center py-12 text-gray-500">
        <p>Tenant dashboard content will be implemented later</p>
      </div>
    </section>
  );
};

// Landlord Dashboard Component (existing)
const LandlordDashboard = () => {
  const router = useRouter();
  const [isAddTenantOpen, setIsAddTenantOpen] = React.useState(false);
  const [isSendAnnouncementOpen, setIsSendAnnouncementOpen] = React.useState(false);

  const handleAddProperty = React.useCallback(() => {
    router.push("/dashboard/properties/new");
  }, [router]);

  const handleAssignTenant = React.useCallback(() => {
    setIsAddTenantOpen(true);
  }, []);

  const handleSendAnnouncement = React.useCallback(() => {
    setIsSendAnnouncementOpen(true);
  }, []);

  return (
    <>
      <section className="space-y-6">
        {/* Welcome Section */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Dashboard</h1>
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
        <DashboardSummaryCards stats={mockDashboardStats} />

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Payments */}
          <RecentPayments
            payments={mockRecentPayments.slice(0, 3)}
            onViewAll={() => router.push("/dashboard/rent")}
          />

          {/* Maintenance Requests */}
          <MaintenanceRequests
            requests={mockMaintenanceRequests.slice(0, 3)}
            onViewAll={() => router.push("/dashboard/maintenance")}
          />
        </div>

        {/* My Properties */}
        <MyProperties
          properties={mockProperties.slice(0, 3)}
          onViewAll={() => router.push("/dashboard/properties")}
        />
      </section>

      {/* Modals */}
      <AddTenantModal
        isOpen={isAddTenantOpen}
        onClose={() => setIsAddTenantOpen(false)}
      />
      <SendAnnouncementModal
        isOpen={isSendAnnouncementOpen}
        onClose={() => setIsSendAnnouncementOpen(false)}
      />
    </>
  );
};

const DashboardPage: NextPageWithLayout = () => {
  const { user, isLoading } = useUser();

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
      case "manager":
        return <ManagerDashboard />;
      case "tenant":
        return <TenantDashboard />;
      case "landlord":
      default:
        return <LandlordDashboard />;
    }
  };

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
