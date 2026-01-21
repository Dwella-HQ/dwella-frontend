import Head from "next/head";
import * as React from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/DashboardLayout";
import { NewMaintenanceRequestModal } from "@/components/NewMaintenanceRequestModal";
import {
  Plus,
  Search,
  Wrench,
  AlertCircle,
  CheckCircle2,
  Clock,
  Check,
  ArrowLeft,
  X,
  Upload,
  Info,
} from "lucide-react";
import { mockMaintenanceRequestsWithDetails, mockProperties } from "@/data/mockLandlordData";
import type { MaintenanceRequestWithDetails } from "@/data/mockLandlordData";
import {
  mockTenantMaintenanceRequests,
  type TenantMaintenanceRequest,
} from "@/data/mockTenantData";
import { useUser } from "@/contexts/UserContext";
import type { NextPageWithLayout } from "../_app";

// Tenant Maintenance Components
const TenantMaintenancePage = () => {
  const [activeTab, setActiveTab] = React.useState<"new" | "history">("new");
  const historyCount = mockTenantMaintenanceRequests.length;

  return (
    <section className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
          Maintenance Requests
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-gray-600">
          Submit and track your maintenance requests
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("new")}
            className={`px-4 py-2 text-sm font-medium transition ${
              activeTab === "new"
                ? "border-b-2 border-brand-main text-brand-main"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            New Request
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2 text-sm font-medium transition ${
              activeTab === "history"
                ? "border-b-2 border-brand-main text-brand-main"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Request History ({historyCount})
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "new" ? (
        <TenantNewRequestForm />
      ) : (
        <TenantRequestHistory />
      )}
    </section>
  );
};

// Tenant New Request Form
const TenantNewRequestForm = () => {
  const [category, setCategory] = React.useState("");
  const [subCategory, setSubCategory] = React.useState("");
  const [priority, setPriority] = React.useState<"low" | "medium" | "high">("medium");
  const [description, setDescription] = React.useState("");
  const [uploadedImages, setUploadedImages] = React.useState<string[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setUploadedImages((prev) => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const handleRemoveImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Submit maintenance request
    console.log("Submit request", { category, subCategory, priority, description, uploadedImages });
    // Reset form
    setCategory("");
    setSubCategory("");
    setPriority("medium");
    setDescription("");
    setUploadedImages([]);
  };

  const getSubCategories = () => {
    switch (category) {
      case "Plumbing":
        return ["Leaking sink", "Toilet issues", "Water heater", "Drain clogged"];
      case "Electrical":
        return ["Light fixture", "Power outlet", "Circuit breaker", "Wiring issue"];
      case "HVAC":
        return ["AC not cooling", "AC not heating", "AC noise", "AC not working"];
      case "Appliance":
        return ["Refrigerator", "Oven", "Dishwasher", "Washing machine"];
      default:
        return [];
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-lg border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
        {/* Issue Category */}
        <div className="mb-6">
          <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
            Issue Category
            <Info className="h-4 w-4 text-gray-400" />
          </label>
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setSubCategory("");
            }}
            className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
          >
            <option value="">Placeholder</option>
            <option value="Plumbing">Plumbing</option>
            <option value="Electrical">Electrical</option>
            <option value="HVAC">HVAC</option>
            <option value="Appliance">Appliance</option>
          </select>
        </div>

        {/* Issue Sub Category */}
        <div className="mb-6">
          <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
            Issue Sub Category
            <Info className="h-4 w-4 text-gray-400" />
          </label>
          <select
            value={subCategory}
            onChange={(e) => setSubCategory(e.target.value)}
            disabled={!category}
            className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
          >
            <option value="">Placeholder</option>
            {getSubCategories().map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>
        </div>

        {/* Priority Level */}
        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Priority Level
          </label>
          <div className="flex gap-2 mb-2">
            {(["low", "medium", "high"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPriority(p)}
                className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                  priority === p
                    ? p === "low"
                      ? "bg-green-100 text-green-700"
                      : p === "medium"
                      ? "bg-orange-100 text-orange-700"
                      : "bg-red-100 text-red-700"
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                }`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500">
            High: Urgent issues (no water, major leak, safety hazard)
          </p>
        </div>

        {/* Describe the Issue */}
        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Describe the Issue <span className="text-red-500">*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Please provide detailed information about the issue..."
            rows={5}
            maxLength={500}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent resize-none"
          />
          <p className="mt-1 text-xs text-gray-500 text-right">
            {description.length} / 500 characters
          </p>
        </div>

        {/* Upload Photos */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Upload Photos (Optional)
          </label>
          <div className="flex flex-wrap gap-3 mb-3">
            {uploadedImages.map((image, index) => (
              <div key={index} className="relative">
                <img
                  src={image}
                  alt={`Upload ${index + 1}`}
                  className="h-20 w-20 rounded-lg object-cover border border-gray-200"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600 transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 text-gray-400 hover:border-brand-main hover:bg-brand-main/5 hover:text-brand-main transition"
            >
              <Upload className="h-5 w-5" />
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="hidden"
          />
          <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-6 text-center">
            <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
            <p className="text-sm font-medium text-gray-900 mb-1">
              Click to upload images
            </p>
            <p className="text-xs text-gray-500">
              PNG, JPG up to 10MB • Multiple images allowed
            </p>
            {uploadedImages.length > 0 && (
              <p className="mt-2 text-xs text-gray-600">
                {uploadedImages.length} images uploaded
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            className="px-6 py-2.5 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 rounded-lg bg-gray-900 text-sm font-medium text-white hover:bg-gray-800 transition"
          >
            Submit Request
          </button>
        </div>
      </div>
    </form>
  );
};

// Tenant Request History
const TenantRequestHistory = () => {
  const getPriorityBadge = (priority: TenantMaintenanceRequest["priority"]) => {
    const styles = {
      low: "bg-blue-100 text-blue-700",
      medium: "bg-yellow-100 text-yellow-700",
      high: "bg-red-100 text-red-700",
    };
    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[priority]}`}
      >
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </span>
    );
  };

  const getStatusBadge = (status: TenantMaintenanceRequest["status"]) => {
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

  return (
    <div className="space-y-4">
      {mockTenantMaintenanceRequests.map((request, index) => (
        <motion.div
          key={request.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: index * 0.05 }}
          className="rounded-lg border border-gray-200 bg-white p-4 sm:p-6 shadow-sm"
        >
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
            <div className="flex-1">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                {request.title}
              </h3>
              <p className="text-sm text-gray-700 mb-3">{request.description}</p>
              <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-gray-600">
                <span>Reported: {request.reportedDate}</span>
                {request.assignedTeam && (
                  <>
                    <span>•</span>
                    <span>Assigned to: {request.assignedTeam}</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {getPriorityBadge(request.priority)}
              {getStatusBadge(request.status)}
            </div>
          </div>
          {request.images && request.images.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {request.images.slice(0, 4).map((image, idx) => (
                <img
                  key={idx}
                  src={image}
                  alt={`Request ${request.id} image ${idx + 1}`}
                  className="h-16 w-16 rounded-lg object-cover border border-gray-200"
                />
              ))}
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
};

// Landlord/Manager Maintenance Page (existing)
const LandlordMaintenancePage = () => {
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

// Main Maintenance Page Component
const MaintenancePage: NextPageWithLayout = () => {
  const { user, isLoading } = useUser();

  // Show loading state while checking user
  if (isLoading) {
    return (
      <>
        <Head>
          <title>Maintenance Requests | DWELLA NG</title>
        </Head>
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-gray-500">Loading...</p>
        </div>
      </>
    );
  }

  // Determine which view to show based on role
  const renderMaintenancePage = () => {
    if (!user) {
      return (
        <div className="text-center py-12 text-gray-500">
          <p>Please log in to view maintenance requests</p>
        </div>
      );
    }

    if (user.role === "tenant") {
      return <TenantMaintenancePage />;
    } else {
      return <LandlordMaintenancePage />;
    }
  };

  return (
    <>
      <Head>
        <title>Maintenance Requests | DWELLA NG</title>
      </Head>
      {renderMaintenancePage()}
    </>
  );
};

MaintenancePage.getLayout = (page: React.ReactElement) => (
  <DashboardLayout>{page}</DashboardLayout>
);

export default MaintenancePage;
