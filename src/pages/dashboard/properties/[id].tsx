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
import { mockProperties } from "@/data/mockLandlordData";
import { mockRecentPayments, mockMaintenanceRequests } from "@/data/mockLandlordData";
import {
  mockUnits,
  mockTenants,
  mockPaymentHistory,
  mockMaintenanceRequestDetails,
  mockPropertyDocuments,
} from "@/data/mockPropertyDetails";
import type { Property } from "@/data/mockLandlordData";

import type { NextPageWithLayout } from "../../_app";

const PropertyDetailPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { id } = router.query;
  const [activeTab, setActiveTab] = React.useState("overview");
  const [isAddUnitOpen, setIsAddUnitOpen] = React.useState(false);
  const [isAddTenantOpen, setIsAddTenantOpen] = React.useState(false);
  const [isAssignManagerOpen, setIsAssignManagerOpen] = React.useState(false);
  const [isInviteManagerOpen, setIsInviteManagerOpen] = React.useState(false);
  const [isSendAnnouncementOpen, setIsSendAnnouncementOpen] = React.useState(false);

  const property = React.useMemo(() => {
    return mockProperties.find((p) => p.id === id);
  }, [id]);

  if (!property) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-600">Property not found</p>
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
  ];

  // Filter payments and maintenance for this property
  const propertyNameBase = property.name.split(" — ")[0].split(" —")[0];
  const propertyPayments = mockRecentPayments.filter(
    (p) => p.propertyName === propertyNameBase
  );
  const propertyMaintenance = mockMaintenanceRequests.filter(
    (m) => m.propertyName === propertyNameBase
  );

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
    if (lowerAmenity.includes("internet") || lowerAmenity.includes("fiber") || lowerAmenity.includes("wifi")) {
      return Wifi;
    }
    return CheckCircle2;
  };

  return (
    <>
      <Head>
        <title>DWELLA NG · {property.name}</title>
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
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{property.name}</h1>
            <div className="mt-1 flex items-center gap-1 text-sm text-gray-600">
              <MapPin className="h-4 w-4" />
              <span>{property.address}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
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
              <div className="relative w-full lg:flex-1 h-[400px] lg:h-[500px] overflow-hidden rounded-lg bg-gray-200">
                <Image
                  src={property.image}
                  alt={property.name}
                  fill
                  className="object-cover"
                />
              </div>
              {/* Thumbnails - Horizontal on mobile, vertical on desktop */}
              <div className="flex flex-row lg:flex-col gap-4">
                {[1, 2, 3].map((i) => (
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
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Property Info */}
          <div className="flex flex-col space-y-6">
            {/* Statistics Cards - 2x2 Grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Total Units */}
              <div className="rounded-lg border border-gray-200 bg-blue-50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Home className="h-4 w-4 text-blue-600" />
                </div>
                <p className="text-xs text-gray-600 mb-1">Total Units</p>
                <p className="text-2xl font-bold text-gray-900">{property.units}</p>
              </div>

              {/* Monthly Rent */}
              <div className="rounded-lg border border-gray-200 bg-purple-50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-purple-600" />
                </div>
                <p className="text-xs text-gray-600 mb-1">Monthly Rent</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₦{property.monthlyRent.toLocaleString()}
                </p>
              </div>

              {/* Occupancy */}
              <div className="rounded-lg border border-gray-200 bg-green-50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-green-600" />
                </div>
                <p className="text-xs text-gray-600 mb-1">Occupancy</p>
                <p className="text-2xl font-bold text-gray-900">{property.occupancy}%</p>
              </div>

              {/* Manager */}
              <div className="rounded-lg border border-gray-200 bg-orange-50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-orange-600" />
                </div>
                <p className="text-xs text-gray-600 mb-1">Manager</p>
                <p className="text-lg font-semibold text-gray-900">M Musa A.</p>
              </div>
            </div>

            {/* Management Actions */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setIsAddTenantOpen(true)}
                className="w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 flex items-center justify-center gap-2"
              >
                <UserPlus className="h-4 w-4" />
                Assign Tenant
              </button>
              <button
                type="button"
                onClick={() => setIsAssignManagerOpen(true)}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 flex items-center justify-center gap-2"
              >
                <Users className="h-4 w-4" />
                Assign Property Manager
              </button>
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
                  <p className="mt-1 text-sm font-semibold text-gray-900">2018</p>
                </div>
                <div className="h-12 w-px bg-gray-300"></div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">PARKING SPACE</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">300SQM</p>
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
                {property.amenities.map((amenity, index) => {
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
                })}
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
                <PropertyUnitsTab 
                  units={mockUnits.filter((u) => u.propertyId === id)} 
                  propertyId={id as string}
                  tenants={mockTenants.filter((t) => t.propertyId === id)}
                />
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
                  tenants={mockTenants.filter((t) => t.propertyId === id)} 
                  propertyId={id as string}
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
                <PropertyPaymentsTab payments={mockPaymentHistory.filter((p) => p.propertyId === id)} />
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
                <PropertyMaintenanceTab requests={mockMaintenanceRequestDetails.filter((r) => r.propertyId === id)} propertyId={id as string} />
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
                <PropertyDocumentsTab documents={mockPropertyDocuments.filter((d) => d.propertyId === id)} propertyId={id as string} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      <AddUnitModal
        isOpen={isAddUnitOpen}
        onClose={() => setIsAddUnitOpen(false)}
        propertyId={id as string}
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
        onSend={(data) => {
          console.log("Send announcement:", data);
          setIsSendAnnouncementOpen(false);
        }}
      />

      <AddTenantModal
        isOpen={isAddTenantOpen}
        onClose={() => setIsAddTenantOpen(false)}
        propertyId={id as string}
      />
    </>
  );
};

PropertyDetailPage.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;

export default PropertyDetailPage;

