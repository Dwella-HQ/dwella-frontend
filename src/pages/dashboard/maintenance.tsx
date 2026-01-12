import Head from "next/head";
import * as React from "react";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/DashboardLayout";
import { NewMaintenanceRequestModal } from "@/components/NewMaintenanceRequestModal";
import { Plus, Search, Wrench, AlertCircle, CheckCircle2, Clock, Check } from "lucide-react";
import { mockMaintenanceRequestsWithDetails, mockProperties } from "@/data/mockLandlordData";
import type { MaintenanceRequestWithDetails } from "@/data/mockLandlordData";
import type { NextPageWithLayout } from "../_app";

const MaintenancePage: NextPageWithLayout = () => {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedPriority, setSelectedPriority] = React.useState("All Priorities");
  const [selectedCategory, setSelectedCategory] = React.useState("All Categories");
  const [activeTab, setActiveTab] = React.useState<"all" | "new" | "in_progress" | "resolved">("all");
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  // Filter requests based on search, filters, and active tab
  const filteredRequests = mockMaintenanceRequestsWithDetails.filter((request) => {
    const matchesSearch =
      request.propertyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.unit.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.tenantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPriority =
      selectedPriority === "All Priorities" || request.priority === selectedPriority.toLowerCase();

    const matchesCategory =
      selectedCategory === "All Categories" || request.type === selectedCategory;

    const matchesTab =
      activeTab === "all" ||
      (activeTab === "new" && request.status === "new") ||
      (activeTab === "in_progress" && request.status === "in_progress") ||
      (activeTab === "resolved" && request.status === "resolved");

    return matchesSearch && matchesPriority && matchesCategory && matchesTab;
  });

  // Count requests by status
  const allCount = mockMaintenanceRequestsWithDetails.length;
  const newCount = mockMaintenanceRequestsWithDetails.filter((r) => r.status === "new").length;
  const inProgressCount = mockMaintenanceRequestsWithDetails.filter(
    (r) => r.status === "in_progress"
  ).length;
  const resolvedCount = mockMaintenanceRequestsWithDetails.filter(
    (r) => r.status === "resolved"
  ).length;

  const getPriorityBadge = (priority: MaintenanceRequestWithDetails["priority"]) => {
    const styles = {
      low: "bg-blue-100 text-blue-700",
      medium: "bg-yellow-100 text-yellow-700",
      high: "bg-red-100 text-red-700",
    };
    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[priority]}`}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </span>
    );
  };

  const getStatusBadge = (status: MaintenanceRequestWithDetails["status"]) => {
    switch (status) {
      case "new":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
            <Clock className="h-3 w-3" />
            New
          </span>
        );
      case "in_progress":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
            <Clock className="h-3 w-3" />
            In Progress
          </span>
        );
      case "resolved":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
            <Check className="h-3 w-3" />
            Resolved
          </span>
        );
    }
  };

  const getActionButton = (request: MaintenanceRequestWithDetails) => {
    if (request.status === "new") {
      return (
        <motion.button
          type="button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700"
        >
          Start Work
        </motion.button>
      );
    }
    if (request.status === "in_progress") {
      return (
        <motion.button
          type="button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
        >
          Mark Resolved
        </motion.button>
      );
    }
    return null;
  };

  return (
    <>
      <Head>
        <title>Maintenance Requests | DWELLA NG</title>
      </Head>

      <section className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Maintenance Requests</h1>
            <p className="mt-1 text-xs sm:text-sm text-gray-600">Track and manage property maintenance requests</p>
          </div>
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsModalOpen(true)}
            className="w-full lg:w-auto h-10 rounded-lg bg-gray-900 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white transition hover:bg-gray-800 flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            Add Request
          </motion.button>
        </div>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="relative flex-1 lg:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search requests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-[38px] w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
            />
          </div>
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="h-[38px] rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent lg:w-[160px]"
          >
            <option>All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="h-[38px] rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent lg:w-[160px]"
          >
            <option>All Categories</option>
            <option>Plumbing</option>
            <option>Electrical</option>
            <option>AC</option>
          </select>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 overflow-x-auto lg:overflow-x-visible scrollbar-hide">
          <div className="flex gap-2 min-w-max lg:min-w-0">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition flex items-center gap-2 whitespace-nowrap flex-shrink-0 ${
                activeTab === "all"
                  ? "border-b-2 border-brand-main text-brand-main"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <span>All</span>
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-medium ${
                  activeTab === "all"
                    ? "bg-brand-main text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {allCount}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("new")}
              className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition flex items-center gap-2 whitespace-nowrap flex-shrink-0 ${
                activeTab === "new"
                  ? "border-b-2 border-brand-main text-brand-main"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <span>New</span>
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-medium ${
                  activeTab === "new"
                    ? "bg-brand-main text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {newCount}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("in_progress")}
              className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition flex items-center gap-2 whitespace-nowrap flex-shrink-0 ${
                activeTab === "in_progress"
                  ? "border-b-2 border-brand-main text-brand-main"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <span>In Progress</span>
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-medium ${
                  activeTab === "in_progress"
                    ? "bg-brand-main text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {inProgressCount}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("resolved")}
              className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition flex items-center gap-2 whitespace-nowrap flex-shrink-0 ${
                activeTab === "resolved"
                  ? "border-b-2 border-brand-main text-brand-main"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <span>Resolved</span>
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-medium ${
                  activeTab === "resolved"
                    ? "bg-brand-main text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {resolvedCount}
              </span>
            </button>
          </div>
        </div>

        {/* Request Cards */}
        <div className="space-y-4">
          {filteredRequests.length > 0 ? (
            filteredRequests.map((request, index) => (
              <motion.div
                key={request.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className="rounded-lg border border-gray-200 bg-white p-4 lg:p-6 shadow-sm"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-4">
                  <p className="text-xs sm:text-sm font-medium text-gray-500 flex items-center gap-2 flex-wrap">
                    <span>{request.propertyName}</span>
                    <span>•</span>
                    <span>{request.unit}</span>
                    <span>•</span>
                    <span>{request.tenantName}</span>
                  </p>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {getPriorityBadge(request.priority)}
                    {getStatusBadge(request.status)}
                  </div>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Request ID</p>
                    <p className="text-xs sm:text-sm font-semibold text-gray-900">{request.requestId}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Maintenance Type *</p>
                    <p className="text-xs sm:text-sm font-semibold text-gray-900">{request.type}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Maintenance Sub-Type *</p>
                    <p className="text-xs sm:text-sm font-semibold text-gray-900">{request.subType}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Reported</p>
                    <p className="text-xs sm:text-sm font-semibold text-gray-900">{request.reportedTime}</p>
                  </div>
                </div>
                <div className="border-t border-gray-200 pt-4 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <p className="text-xs sm:text-sm text-gray-700 flex-1">{request.description}</p>
                  {getActionButton(request) && (
                    <div className="flex-shrink-0 lg:pl-6 lg:border-l lg:border-gray-200 w-full lg:w-auto">
                      {getActionButton(request)}
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center justify-center py-12 px-6 rounded-lg border border-gray-200 bg-white"
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
      </section>

      <NewMaintenanceRequestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};

MaintenancePage.getLayout = (page: React.ReactElement) => (
  <DashboardLayout>{page}</DashboardLayout>
);

export default MaintenancePage;
