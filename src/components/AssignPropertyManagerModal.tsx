import * as React from "react";
import { motion } from "framer-motion";
import { X, Search, UserPlus } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { getPropertyManagers } from "@/api/property-managers";
import type { PropertyManagerDTO } from "@/api/property-managers";
import { useToast } from "@/components/Toast";

export type AssignPropertyManagerModalProps = {
  isOpen: boolean;
  onClose: () => void;
  propertyId: string;
  onAssign?: (managerId: string) => void;
  onInviteNew?: () => void;
};

export const AssignPropertyManagerModal = ({
  isOpen,
  onClose,
  propertyId,
  onAssign,
  onInviteNew,
}: AssignPropertyManagerModalProps) => {
  const { showToast } = useToast();
  const [selectedManager, setSelectedManager] = React.useState<string>("");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [managers, setManagers] = React.useState<PropertyManagerDTO[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  // Fetch property managers when modal opens
  React.useEffect(() => {
    if (isOpen) {
      const fetchManagers = async () => {
        setIsLoading(true);
        const result = await getPropertyManagers();
        if (result.success) {
          setManagers(result.data);
        } else {
          showToast(result.error || "Failed to fetch property managers", "error");
          setManagers([]);
        }
        setIsLoading(false);
      };
      fetchManagers();
    }
  }, [isOpen, showToast]);

  const filteredManagers = React.useMemo(() => {
    if (!searchQuery) return managers;
    const query = searchQuery.toLowerCase();
    return managers.filter(
      (manager) =>
        (manager.fullName || manager.name || "").toLowerCase().includes(query) ||
        (manager.email || "").toLowerCase().includes(query)
    );
  }, [searchQuery, managers]);

  const handleAssign = () => {
    if (selectedManager && onAssign) {
      onAssign(selectedManager);
    }
    setSelectedManager("");
    setSearchQuery("");
    onClose();
  };

  const handleInviteNew = () => {
    onClose();
    if (onInviteNew) {
      onInviteNew();
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
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
          className="fixed left-1/2 top-1/2 z-[100] max-h-[90vh] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border border-gray-200 bg-white p-6 shadow-xl focus:outline-none"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <Dialog.Title className="text-xl font-bold text-gray-900">
                Select Property Manager To Assign
              </Dialog.Title>
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-red-600 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </Dialog.Close>
            </div>

            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="John Doe"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
                />
              </div>
            </div>

            {/* Managers List */}
            <div className="mb-6 max-h-64 space-y-2 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-brand-main border-r-transparent"></div>
                    <p className="mt-2 text-sm text-gray-600">Loading managers...</p>
                  </div>
                </div>
              ) : filteredManagers.length > 0 ? (
                filteredManagers.map((manager) => (
                  <label
                    key={manager.id}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50 transition"
                  >
                    <input
                      type="radio"
                      name="manager"
                      value={manager.id}
                      checked={selectedManager === manager.id}
                      onChange={(e) => setSelectedManager(e.target.value)}
                      className="h-4 w-4 text-brand-main focus:ring-2 focus:ring-brand-main focus:ring-offset-2"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {manager.fullName || manager.name || "Unknown"}
                      </p>
                      {manager.email && (
                        <p className="text-xs text-gray-500">{manager.email}</p>
                      )}
                    </div>
                  </label>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-8 px-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 mb-3">
                    <UserPlus className="h-6 w-6 text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-900 mb-1">No Property Managers</p>
                  <p className="text-xs text-gray-500 text-center">
                    {searchQuery
                      ? "No managers found matching your search."
                      : "No property managers available. Invite a new manager to get started."}
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleAssign}
                disabled={!selectedManager}
                className={`w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition ${
                  selectedManager
                    ? "bg-gray-900 hover:bg-gray-800"
                    : "cursor-not-allowed bg-gray-400"
                }`}
              >
                Assign Manager
              </button>
              <button
                type="button"
                onClick={handleInviteNew}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 flex items-center justify-center gap-2"
              >
                <UserPlus className="h-4 w-4" />
                Add New Property Manager
              </button>
            </div>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={onClose}
                className="text-sm text-gray-600 hover:text-gray-900 transition"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

