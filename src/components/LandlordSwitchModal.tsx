import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowRight, X } from "lucide-react";

import { useSelectedLandlord } from "@/contexts/SelectedLandlordContext";
import { mockLandlordAccounts, type LandlordAccount } from "@/data/mockLandlordAccounts";

export type LandlordSwitchModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const LandlordSwitchModal = ({
  isOpen,
  onClose,
}: LandlordSwitchModalProps) => {
  const { selectedLandlord, setSelectedLandlord } = useSelectedLandlord();

  const handleSelectLandlord = React.useCallback(
    (landlord: LandlordAccount) => {
      setSelectedLandlord(landlord);
      onClose();
      // Reload the page to update all data
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
                    Choose which landlord's properties you want to manage
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {mockLandlordAccounts.map((landlord, index) => {
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
                          <div
                            className={`h-16 w-16 rounded-full flex items-center justify-center text-white text-xl font-semibold ${
                              isSelected ? "bg-brand-main" : "bg-gray-400"
                            }`}
                          >
                            {getInitials(landlord.name)}
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
                            <span className="text-sm font-medium text-gray-900">
                              {landlord.totalUnits} Units
                            </span>
                          </div>
                          <div className="space-y-1">
                            {landlord.properties.map((property) => (
                              <div key={property.id} className="text-sm text-gray-700">
                                • {property.name}
                              </div>
                            ))}
                          </div>
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
              </div>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

