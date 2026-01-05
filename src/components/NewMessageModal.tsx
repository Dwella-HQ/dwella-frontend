import * as React from "react";
import { motion } from "framer-motion";
import { X, Search } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import type { Conversation } from "@/data/mockLandlordData";

export type NewMessageModalProps = {
  isOpen: boolean;
  onClose: () => void;
  conversations: Conversation[];
  onSelectConversation: (conversationId: string) => void;
};

export const NewMessageModal = ({
  isOpen,
  onClose,
  conversations,
  onSelectConversation,
}: NewMessageModalProps) => {
  const [searchQuery, setSearchQuery] = React.useState("John Doe");
  const [selectedUserId, setSelectedUserId] = React.useState<string | null>(null);

  // Filter users based on search
  const filteredUsers = conversations.filter(
    (conv) =>
      conv.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.propertyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.unit?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStartChat = () => {
    if (selectedUserId) {
      onSelectConversation(selectedUserId);
      onClose();
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
          className="fixed left-1/2 top-1/2 z-[100] w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-gray-200 bg-white p-6 shadow-xl focus:outline-none"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <Dialog.Title className="text-xl font-bold text-gray-900">
                Select User to start Chat with
              </Dialog.Title>
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </Dialog.Close>
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
              />
            </div>

            {/* User List */}
            <div className="max-h-96 overflow-y-auto space-y-2 mb-4">
              {filteredUsers.map((conv) => (
                <label
                  key={conv.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="user"
                    value={conv.id}
                    checked={selectedUserId === conv.id}
                    onChange={() => setSelectedUserId(conv.id)}
                    className="h-4 w-4 text-brand-main focus:ring-brand-main"
                  />
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 text-xs font-semibold text-white">
                      {conv.userName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{conv.userName}</p>
                      {conv.propertyName && conv.unit && (
                        <p className="text-xs text-gray-500">
                          {conv.propertyName} • {conv.unit}
                        </p>
                      )}
                      {conv.userType === "manager" && (
                        <p className="text-xs text-gray-500">Property Manager</p>
                      )}
                    </div>
                  </div>
                </label>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="flex-1 rounded-lg border border-gray-300 bg-white px-6 py-2.5 text-sm font-medium text-gray-900 transition hover:bg-gray-50"
                >
                  Cancel
                </button>
              </Dialog.Close>
              <button
                type="button"
                onClick={handleStartChat}
                disabled={!selectedUserId}
                className="flex-1 rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Start Chat
              </button>
            </div>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
