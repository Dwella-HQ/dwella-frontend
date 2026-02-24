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
import { mockRecentPayments, mockMaintenanceRequests } from "@/data/mockLandlordData";
import {
  mockTenants,
  mockPaymentHistory,
  mockMaintenanceRequestDetails,
  mockPropertyDocuments,
} from "@/data/mockPropertyDetails";
import { getProperty } from "@/api/properties";
import { mapPropertyDTOToProperty } from "@/api/properties/mapProperty";
import type { PropertyDTO } from "@/api/properties";
import { getUnitsByProperty } from "@/api/units";
import { mapUnitDTOToUnit } from "@/api/units/mapUnit";
import type { Unit } from "@/data/mockLandlordData";
import { useUser } from "@/contexts/UserContext";

import type { NextPageWithLayout } from "../../_app";

const PropertyDetailPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { user } = useUser();
  const { id } = router.query;
  const [activeTab, setActiveTab] = React.useState("overview");
  const [isAddUnitOpen, setIsAddUnitOpen] = React.useState(false);
  const [isAddTenantOpen, setIsAddTenantOpen] = React.useState(false);
  const [isAssignManagerOpen, setIsAssignManagerOpen] = React.useState(false);
  const [isInviteManagerOpen, setIsInviteManagerOpen] = React.useState(false);
  const [isSendAnnouncementOpen, setIsSendAnnouncementOpen] = React.useState(false);
  const [propertyDTO, setPropertyDTO] = React.useState<PropertyDTO | null>(null);
  const [units, setUnits] = React.useState<Unit[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isLoadingUnits, setIsLoadingUnits] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = React.useState(0);

  // Fetch property from API
  React.useEffect(() => {
    const fetchProperty = async () => {
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
    };

    fetchProperty();
  }, [id]);

  // Fetch units from API
  React.useEffect(() => {
    const fetchUnits = async () => {
      if (!id || typeof id !== "string") return;
      
      setIsLoadingUnits(true);
      const result = await getUnitsByProperty(id);
      if (result.success) {
        const mappedUnits = result.data.map((unitDTO) => mapUnitDTOToUnit(unitDTO, id));
        setUnits(mappedUnits);
      }
      setIsLoadingUnits(false);
    };

    fetchUnits();
  }, [id]);

  // Map property DTO to Property type for compatibility
  const property = React.useMemo(() => {
    if (!propertyDTO) return null;
    return mapPropertyDTOToProperty(propertyDTO);
  }, [propertyDTO]);

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
    { id: "grace-period", label: "Grace Period Preference" },
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
                    .filter(({ originalIndex }) => originalIndex !== selectedPhotoIndex)
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
              {user?.role !== "property_manager" && (
                <>
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
                  <p className="text-xs text-gray-500 uppercase">PARKING SPACE</p>
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
                {(propertyDTO?.amenities || property.amenities).map((amenity, index) => {
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
                {isLoadingUnits ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-brand-main border-r-transparent"></div>
                      <p className="mt-4 text-sm text-gray-600">Loading units...</p>
                    </div>
                  </div>
                ) : (
                  <PropertyUnitsTab 
                    units={units} 
                    propertyId={id as string}
                    tenants={mockTenants.filter((t) => t.propertyId === id)}
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
                <PropertyDocumentsTab 
                  documents={propertyDTO?.documents || []} 
                  propertyId={id as string} 
                  propertyDTO={propertyDTO}
                />
              </motion.div>
            )}
            {activeTab === "grace-period" && (
              <motion.div
                key="grace-period"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
              >
                <h2 className="text-lg font-semibold text-gray-900 mb-6">
                  Rent Grace Periods
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Monthly Rent Grace Period
                    </label>
                    <select
                      className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
                      defaultValue=""
                    >
                      <option value="">Placeholder</option>
                      <option value="0">0 days</option>
                      <option value="3">3 days</option>
                      <option value="5">5 days</option>
                      <option value="7">7 days</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Quarterly Rent Grace Period
                    </label>
                    <select
                      className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
                      defaultValue=""
                    >
                      <option value="">Placeholder</option>
                      <option value="0">0 days</option>
                      <option value="5">5 days</option>
                      <option value="7">7 days</option>
                      <option value="14">14 days</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Yearly Rent Grace Period
                    </label>
                    <select
                      className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
                      defaultValue=""
                    >
                      <option value="">Placeholder</option>
                      <option value="0">0 days</option>
                      <option value="7">7 days</option>
                      <option value="14">14 days</option>
                      <option value="30">30 days</option>
                    </select>
                  </div>
                </div>
                <button
                  type="button"
                  className="mt-6 rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
                >
                  Save Preferences
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      <AddUnitModal
        isOpen={isAddUnitOpen}
        onClose={() => setIsAddUnitOpen(false)}
        propertyId={id as string}
        onSuccess={async () => {
          // Refresh units after successful creation
          if (id && typeof id === "string") {
            setIsLoadingUnits(true);
            const result = await getUnitsByProperty(id);
            if (result.success) {
              const mappedUnits = result.data.map((unitDTO) => mapUnitDTOToUnit(unitDTO, id));
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

