import * as React from "react";
import { motion } from "framer-motion";
import { Plus, UserPlus, Megaphone } from "lucide-react";

export type DashboardActionButtonsProps = {
  onAddProperty?: () => void;
  onAssignTenant?: () => void;
  onSendAnnouncement?: () => void;
};

export const DashboardActionButtons = ({
  onAddProperty,
  onAssignTenant,
  onSendAnnouncement,
}: DashboardActionButtonsProps) => {
  return (
    <div className="flex flex-wrap gap-3">
      <motion.button
        type="button"
        onClick={onAddProperty}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
      >
        <Plus className="h-4 w-4" />
        Add Property
      </motion.button>
      <motion.button
        type="button"
        onClick={onAssignTenant}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
      >
        <UserPlus className="h-4 w-4" />
        Assign Tenant
      </motion.button>
      <motion.button
        type="button"
        onClick={onSendAnnouncement}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
      >
        <Megaphone className="h-4 w-4" />
        Send Announcement
      </motion.button>
    </div>
  );
};

