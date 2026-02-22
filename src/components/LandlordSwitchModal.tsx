import * as React from "react";
import { motion } from "framer-motion";
import * as Dialog from "@radix-ui/react-dialog";
import Image from "next/image";
import { ArrowRight, X, Building2 } from "lucide-react";

import { useUser } from "@/contexts/UserContext";
import { useSelectedLandlord } from "@/contexts/SelectedLandlordContext";
import type { LandlordAccount } from "@/data/mockLandlordAccounts";
import { getPropertyManagerByUser } from "@/api/property-managers";
import type { PropertyManagerDTO } from "@/api/property-managers";
import { getPropertiesByLandlord } from "@/api/properties";

/** Uses landlord.id (landlord ID) for id — this is what we pass to GET /property/landlord/:landlordId. */
function mapManagerToLandlordAccount(manager: PropertyManagerDTO): LandlordAccount | null {
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

export type LandlordSwitchModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const LandlordSwitchModal = ({
  isOpen,
  onClose,
}: LandlordSwitchModalProps) => {
  const { user } = useUser();
  const { selectedLandlord, setSelectedLandlord } = useSelectedLandlord();
  const [landlordAccounts, setLandlordAccounts] = React.useState<LandlordAccount[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!isOpen || !user?.id || user.role !== "property_manager") {
      setLandlordAccounts([]);
      setError(null);
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
      const enriched = await Promise.all(
        accounts.map(async (a) => {
          const res = await getPropertiesByLandlord(a.id);
          if (!res.success) return a;
          const data = res.data;
          return {
            ...a,
            properties: data.map((p) => ({ id: p.id, name: p.name })),
            totalUnits: data.reduce(
              (sum, p) => sum + (p.numberOfUnits ?? (Array.isArray(p.units) ? p.units.length : 0)),
              0
            ),
          };
        })
      );
      setLandlordAccounts(enriched);
      setIsLoading(false);
    };
    fetchManagers();
  }, [isOpen, user?.id, user?.role]);

  const handleSelectLandlord = React.useCallback(
    async (landlord: LandlordAccount) => {
      let enriched = landlord;
      if (landlord.properties.length === 0 && landlord.totalUnits === 0) {
        const result = await getPropertiesByLandlord(landlord.id);
        if (result.success) {
          const data = result.data;
          enriched = {
            ...landlord,
            properties: data.map((p) => ({ id: p.id, name: p.name })),
            totalUnits: data.reduce(
              (sum, p) => sum + (p.numberOfUnits ?? (Array.isArray(p.units) ? p.units.length : 0)),
              0
            ),
          };
        }
      }
      setSelectedLandlord(enriched);
      if (typeof window !== "undefined") {
        localStorage.setItem("landlordId", enriched.id);
      }
      onClose();
      if (typeof window !== "undefined") {
        window.location.reload();
      }
    },
    [setSelectedLandlord, onClose]
  );

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay asChild>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/50"
          />
        </Dialog.Overlay>
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-[100] max-h-[90vh] w-full max-w-5xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-xl focus:outline-none"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
                <div>
                  <Dialog.Title className="text-2xl font-bold text-gray-900">
                    Select Landlord Account
                  </Dialog.Title>
                  <p className="text-sm text-gray-600 mt-1">
                    Choose which landlord&apos;s properties you want to manage
                  </p>
                </div>
                <Dialog.Close asChild>
                  <button
                    type="button"
                    className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </Dialog.Close>
              </div>

              {/* Landlord Cards */}
              <div className="p-6">
                {isLoading ? (
                  <div className="flex justify-center py-12">
                    <div className="text-center">
                      <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-solid border-brand-main border-r-transparent" />
                      <p className="mt-3 text-sm text-gray-600">Loading landlord accounts...</p>
                    </div>
                  </div>
                ) : error ? (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                ) : landlordAccounts.length === 0 ? (
                  <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
                    <Building2 className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-3 text-sm font-medium text-gray-900">No landlord accounts</p>
                    <p className="mt-1 text-sm text-gray-600">
                      You are not assigned to any landlord yet.
                    </p>
                  </div>
                ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {landlordAccounts.map((landlord, index) => {
                    const isSelected = selectedLandlord?.id === landlord.id;
                    return (
                      <motion.div
                        key={landlord.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`bg-white rounded-lg border-2 p-6 transition-all cursor-pointer ${
                          isSelected
                            ? "border-brand-main shadow-lg"
                            : "border-gray-200 hover:border-gray-300 hover:shadow-md"
                        }`}
                        onClick={() => handleSelectLandlord(landlord)}
                      >
                        {/* Avatar */}
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
                              <div
                                className={`h-full w-full flex items-center justify-center text-white text-base font-semibold ${
                                  isSelected ? "bg-brand-main" : "bg-gray-400"
                                }`}
                              >
                                {getInitials(landlord.name)}
                              </div>
                            )}
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {landlord.name}
                            </h3>
                            <p className="text-sm text-gray-600">{landlord.email}</p>
                          </div>
                        </div>

                        {/* Properties Info */}
                        <div className="mb-6 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">
                              {landlord.properties.length}{" "}
                              {landlord.properties.length === 1 ? "Property" : "Properties"}
                            </span>
                            {landlord.totalUnits > 0 && (
                              <span className="text-sm font-medium text-gray-900">
                                {landlord.totalUnits} Units
                              </span>
                            )}
                          </div>
                          {landlord.properties.length > 0 && (
                            <div className="space-y-1">
                              {landlord.properties.map((property) => (
                                <div key={property.id} className="text-sm text-gray-700">
                                  • {property.name}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Continue Button */}
                        <button
                          type="button"
                          className={`w-full flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition ${
                            isSelected
                              ? "bg-brand-main text-white hover:bg-brand-main/90"
                              : "bg-gray-900 text-white hover:bg-gray-800"
                          }`}
                        >
                          {isSelected ? "Currently Managing" : "Continue"}
                          {!isSelected && <ArrowRight className="h-4 w-4" />}
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
                )}
              </div>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

