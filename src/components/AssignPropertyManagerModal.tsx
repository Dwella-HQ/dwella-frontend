import * as React from "react";
import { motion } from "framer-motion";
import { X, Search, UserPlus } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";

export type AssignPropertyManagerModalProps = {
  isOpen: boolean;
  onClose: () => void;
  propertyId: string;
  onAssign?: (managerId: string) => void;
  onInviteNew?: () => void;
};

// Mock managers data
const mockManagers = [
  { id: "1", name: "John Doe", email: "john.doe@example.com" },
  { id: "2", name: "John Doe", email: "john.doe2@example.com" },
  { id: "3", name: "John Doe", email: "john.doe3@example.com" },
  { id: "4", name: "John Doe", email: "john.doe4@example.com" },
  { id: "5", name: "John Doe", email: "john.doe5@example.com" },
  { id: "6", name: "John Doe", email: "john.doe6@example.com" },
  { id: "7", name: "John Doe", email: "john.doe7@example.com" },
  { id: "8", name: "John Doe", email: "john.doe8@example.com" },
];

export const AssignPropertyManagerModal = ({
  isOpen,
  onClose,
  propertyId,
  onAssign,
  onInviteNew,
}: AssignPropertyManagerModalProps) => {
  const [selectedManager, setSelectedManager] = React.useState<string>("");
  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredManagers = React.useMemo(() => {
    if (!searchQuery) return mockManagers;
    const query = searchQuery.toLowerCase();
    return mockManagers.filter(
      (manager) =>
        manager.name.toLowerCase().includes(query) ||
        manager.email.toLowerCase().includes(query)
    );
  }, [searchQuery]);

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
              {filteredManagers.map((manager) => (
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
                    <p className="text-sm font-medium text-gray-900">{manager.name}</p>
                    <p className="text-xs text-gray-500">{manager.email}</p>
                  </div>
                </label>
              ))}
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

