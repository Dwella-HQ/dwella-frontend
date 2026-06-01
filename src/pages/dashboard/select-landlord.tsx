import * as React from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import Image from "next/image";
import { ArrowRight, Building2 } from "lucide-react";

import { useUser } from "@/contexts/UserContext";
import { useSelectedLandlord } from "@/contexts/SelectedLandlordContext";
import type { LandlordAccount } from "@/data/mockLandlordAccounts";
import { getPropertyManagerByUser } from "@/api/property-managers";
import type { PropertyManagerDTO } from "@/api/property-managers";
import { getPropertiesByLandlord } from "@/api/properties";
import { mapPropertiesWithLiveUnitCounts } from "@/api/properties";
import logo from "@/assets/logo_blue_horizontal.png";

import type { NextPageWithLayout } from "../_app";

/** Maps API response to LandlordAccount. Uses landlord.id (landlord ID) for id — this is what we pass to GET /property/landlord/:landlordId. */
function mapManagerToLandlordAccount(
  manager: PropertyManagerDTO,
): LandlordAccount | null {
  const landlord = manager.landlord;
  if (!landlord?.id) return null;
  const name = landlord.landLordName ?? landlord.user?.fullName ?? "Landlord";
  const email = landlord.user?.email ?? "";
  return {
    id: landlord.id, // landlord ID (not manager.id = property-manager record id)
    name,
    email,
    properties: [],
    totalUnits: 0,
    avatar: landlord.profilePicture?.url,
  };
}

const SelectLandlordPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { user, logout } = useUser();
  const { setSelectedLandlord } = useSelectedLandlord();
  const [landlordAccounts, setLandlordAccounts] = React.useState<
    LandlordAccount[]
  >([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Redirect if not a property manager (super_admin can access everything, so skip this page)
  React.useEffect(() => {
    if (user && user.role !== "property_manager") {
      router.replace("/dashboard");
    }
  }, [user, router]);

  // Fetch property manager record(s) for this user and enrich each landlord with property counts
  React.useEffect(() => {
    if (!user?.id || user.role !== "property_manager") {
      setIsLoading(false);
      return;
    }
    const fetchManagers = async () => {
      setIsLoading(true);
      setError(null);
      const result = await getPropertyManagerByUser(String(user.id));
      if (!result.success) {
        setError(result.error ?? "Failed to load landlord accounts");
        setLandlordAccounts([]);
        setIsLoading(false);
        return;
      }
      const accounts = result.data
        .map(mapManagerToLandlordAccount)
        .filter((a): a is LandlordAccount => a !== null);
      // Fetch properties per landlord so cards show real counts
      const enriched = await Promise.all(
        accounts.map(async (a) => {
          const res = await getPropertiesByLandlord(a.id);
          if (!res.success) return a;
          const mapped = await mapPropertiesWithLiveUnitCounts(res.data);
          const properties = mapped.map((p) => ({ id: p.id, name: p.name }));
          const totalUnits = mapped.reduce((sum, p) => sum + p.units, 0);
          return { ...a, properties, totalUnits };
        }),
      );
      setLandlordAccounts(enriched);
      setIsLoading(false);
    };
    fetchManagers();
  }, [user?.id, user?.role]);

  const handleSelectLandlord = React.useCallback(
    async (landlord: LandlordAccount) => {
      // If we already have properties/totalUnits from card enrichment, use them
      let enriched = landlord;
      if (landlord.properties.length === 0 && landlord.totalUnits === 0) {
        const result = await getPropertiesByLandlord(landlord.id);
        if (result.success) {
          const mapped = await mapPropertiesWithLiveUnitCounts(result.data);
          enriched = {
            ...landlord,
            properties: mapped.map((p) => ({ id: p.id, name: p.name })),
            totalUnits: mapped.reduce((sum, p) => sum + p.units, 0),
          };
        }
      }
      setSelectedLandlord(enriched);
      if (typeof window !== "undefined") {
        localStorage.setItem("landlordId", enriched.id);
      }
      router.push("/dashboard");
    },
    [setSelectedLandlord, router],
  );

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (
    !user ||
    (user.role !== "property_manager" && user.role !== "super_admin")
  ) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Dwelliva · Select Landlord Account</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Image
                  src={logo}
                  alt="Dwelliva logo"
                  width={170}
                  height={40}
                  className="h-8 w-auto object-contain"
                />
              </div>
              <button
                onClick={() => {
                  logout();
                  void router.push("/auth/login");
                }}
                className="text-sm text-gray-600 hover:text-gray-900 transition"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Title Section */}
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
              Select Landlord Account
            </h1>
            <p className="text-lg text-gray-600">
              Choose which landlord&apos;s properties you want to manage
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-solid border-brand-main border-r-transparent" />
                <p className="mt-3 text-sm text-gray-600">
                  Loading landlord accounts...
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center max-w-md mx-auto">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          ) : landlordAccounts.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-white p-8 text-center max-w-md mx-auto">
              <Building2 className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-3 text-sm font-medium text-gray-900">
                No landlord accounts
              </p>
              <p className="mt-1 text-sm text-gray-600">
                You are not assigned to any landlord yet. Ask your landlord to
                invite you.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {landlordAccounts.map((landlord, index) => (
                <motion.div
                  key={landlord.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleSelectLandlord(landlord)}
                >
                  {/* Avatar and Name */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="h-12 w-12 min-h-12 min-w-12 flex-shrink-0 aspect-square rounded-full overflow-hidden bg-gray-200">
                      {landlord.avatar ? (
                        <Image
                          src={landlord.avatar}
                          alt=""
                          width={48}
                          height={48}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-brand-main text-white text-base font-semibold">
                          {getInitials(landlord.name)}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {landlord.name}
                      </h3>
                      <p className="text-sm text-gray-600 truncate">
                        {landlord.email}
                      </p>
                    </div>
                  </div>

                  {/* Properties Info */}
                  <div className="mb-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          {landlord.properties.length}{" "}
                          {landlord.properties.length === 1
                            ? "Property"
                            : "Properties"}
                        </span>
                      </div>
                      {landlord.totalUnits > 0 && (
                        <span className="text-sm font-medium text-gray-900">
                          {landlord.totalUnits} Total Units
                        </span>
                      )}
                    </div>
                    {landlord.properties.length > 0 && (
                      <div className="space-y-1">
                        {landlord.properties.map((property) => (
                          <div
                            key={property.id}
                            className="text-sm text-gray-700"
                          >
                            • {property.name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Continue Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectLandlord(landlord);
                    }}
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-gray-800"
                  >
                    Continue
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

SelectLandlordPage.getLayout = (page) => page;

export default SelectLandlordPage;
