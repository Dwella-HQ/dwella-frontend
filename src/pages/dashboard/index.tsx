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

// Tenant Dashboard Component
const TenantDashboard = () => {
  const { user } = useUser();
  const router = useRouter();

  // Mock tenant data - in a real app, this would come from an API
  // For now, we'll use the first tenant as default
  const tenantData = React.useMemo(() => {
    return {
      property: {
        name: "Harmony Court — 3BR Duplex",
        address: "12 Iroko Street, Uyo, Akwa Ibom",
        image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop",
      },
      unit: {
        number: "A101",
        type: "2BR Apartment",
      },
      amenities: ["AC", "Balcony", "Water Heater", "24/7 Power", "Security Gate"],
      rental: {
        monthlyRent: 120000,
        nextPaymentDue: "05 Jan 2026",
        paymentStatus: "Paid" as const,
        lastPayment: "05 Dec 2025",
        leaseStart: "05 Jan 2024",
        leaseEnd: "05 Jan 2026",
      },
      propertyManager: {
        name: "Musa A.",
        phone: "+234 800 000 0001",
        email: "musa@management.com",
      },
      landlord: {
        name: "Property Owner",
        phone: "+234 800 000 0000",
        email: "owner@harmonyourt.com",
      },
    };
  }, []);

  const handleSendMessage = (type: "manager" | "landlord") => {
    // Navigate to messages page with the appropriate contact
    router.push("/dashboard/messages");
  };

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

      {/* Main Content Grid - 4 Cards */}
      <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
        {/* Quick Actions Card */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
          <div className="relative h-48 w-full">
            <img
              src={tenantData.property.image}
              alt={tenantData.property.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
              <h3 className="text-white font-semibold text-base sm:text-lg">
                {tenantData.property.name}
              </h3>
              <p className="text-white/90 text-xs sm:text-sm mt-1">
                {tenantData.property.address}
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
                  {tenantData.unit.number}
                </p>
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wide">
                  Unit Type
                </p>
                <p className="text-sm sm:text-base font-semibold text-gray-900 mt-1">
                  {tenantData.unit.type}
                </p>
              </div>
            </div>
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                Amenities
              </p>
              <div className="flex flex-wrap gap-2">
                {tenantData.amenities.map((amenity, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2.5 py-1 rounded-md border border-green-200 bg-green-50 text-green-700 text-xs font-medium"
                  >
                    {amenity}
                  </span>
                ))}
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
              <span className="text-xs sm:text-sm text-gray-600">Monthly Rent</span>
              <span className="text-sm sm:text-base font-semibold text-gray-900">
                ₦{tenantData.rental.monthlyRent.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm text-gray-600">Next Payment Due</span>
              <span className="text-sm sm:text-base font-medium text-gray-900">
                {tenantData.rental.nextPaymentDue}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm text-gray-600">Payment Status</span>
              <span className="inline-flex items-center gap-1.5">
                <svg
                  className="h-4 w-4 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-sm sm:text-base font-medium text-green-600">
                  {tenantData.rental.paymentStatus}
                </span>
              </span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-gray-200">
              <span className="text-xs sm:text-sm text-gray-600">Last Payment</span>
              <span className="text-sm sm:text-base font-medium text-gray-900">
                {tenantData.rental.lastPayment}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm text-gray-600">Lease Start</span>
              <span className="text-sm sm:text-base font-medium text-gray-900">
                {tenantData.rental.leaseStart}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm text-gray-600">Lease End</span>
              <span className="text-sm sm:text-base font-medium text-gray-900">
                {tenantData.rental.leaseEnd}
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
            <div className="flex items-center gap-3">
              <svg
                className="h-5 w-5 text-gray-400 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <span className="text-sm sm:text-base text-gray-900">
                {tenantData.propertyManager.name}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <svg
                className="h-5 w-5 text-gray-400 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
              <span className="text-sm sm:text-base text-gray-600">
                {tenantData.propertyManager.phone}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <svg
                className="h-5 w-5 text-gray-400 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              <span className="text-sm sm:text-base text-gray-600">
                {tenantData.propertyManager.email}
              </span>
            </div>
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
            <div className="flex items-center gap-3">
              <svg
                className="h-5 w-5 text-gray-400 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <span className="text-sm sm:text-base text-gray-900">
                {tenantData.landlord.name}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <svg
                className="h-5 w-5 text-gray-400 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
              <span className="text-sm sm:text-base text-gray-600">
                {tenantData.landlord.phone}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <svg
                className="h-5 w-5 text-gray-400 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              <span className="text-sm sm:text-base text-gray-600">
                {tenantData.landlord.email}
              </span>
            </div>
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
