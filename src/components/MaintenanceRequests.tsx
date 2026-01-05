import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Wrench } from "lucide-react";
import type { MaintenanceRequest } from "@/data/mockLandlordData";

export type MaintenanceRequestsProps = {
  requests: MaintenanceRequest[];
  onViewAll?: () => void;
};

const getPriorityColor = (priority: MaintenanceRequest["priority"]) => {
  switch (priority) {
    case "high":
      return "bg-red-100 text-red-700";
    case "medium":
      return "bg-orange-100 text-orange-700";
    case "low":
      return "bg-yellow-100 text-yellow-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

const getStatusBadge = (status: MaintenanceRequest["status"]) => {
  switch (status) {
    case "in_progress":
      return "bg-blue-100 text-blue-700";
    case "completed":
      return "bg-brand-green/10 text-brand-green";
    case "new":
      return "bg-gray-100 text-gray-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

export const MaintenanceRequests = ({
  requests,
  onViewAll,
}: MaintenanceRequestsProps) => {
  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between px-6 py-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Maintenance Requests
        </h2>
        {onViewAll ? (
          <button
            type="button"
            onClick={onViewAll}
            className="text-sm font-medium text-brand-main hover:text-brand-main/80 transition"
          >
            View All
          </button>
        ) : (
          <Link
            href="/dashboard/maintenance"
            className="text-sm font-medium text-brand-main hover:text-brand-main/80 transition"
          >
            View All
          </Link>
        )}
      </div>
      {requests.length > 0 ? (
        <div className="divide-y divide-gray-200">
          {requests.map((request, index) => (
            <motion.div
              key={request.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              whileHover={{ x: 4, transition: { duration: 0.2 } }}
              className="px-6 py-4 hover:bg-gray-50"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2 flex-wrap w-full">
                    <p className="text-sm font-semibold text-gray-900">
                      {request.type} — {request.description}
                    </p>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${getPriorityColor(
                        request.priority
                      )}`}
                    >
                      {request.priority.charAt(0).toUpperCase() +
                        request.priority.slice(1)}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm text-gray-500">
                    {request.propertyName} • {request.unit}
                  </p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${getStatusBadge(
                        request.status
                      )}`}
                    >
                      {request.status === "in_progress"
                        ? "In Progress"
                        : request.status === "completed"
                          ? "Completed"
                          : "New"}
                    </span>
                    <span className="text-xs text-gray-500">
                      {request.timeAgo}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center justify-center py-12 px-6"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 mb-4">
            <Wrench className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-sm font-medium text-gray-900 mb-1">No Maintenance Requests</p>
          <p className="text-xs text-gray-500 text-center">
            Maintenance requests will appear here when available.
          </p>
        </motion.div>
      )}
    </div>
  );
};
