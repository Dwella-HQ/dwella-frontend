import Head from "next/head";
import Link from "next/link";
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
import { mockProperties } from "@/data/mockLandlordData";
import type { MaintenanceRequestWithDetails } from "@/data/mockLandlordData";
import {
  getMaintenanceRequests,
  createMaintenanceRequest,
  updateMaintenanceRequestStatus,
  getMaintenanceRequestTypes,
  type MaintenanceRequestTypeDTO,
} from "@/api/maintenance";
import { getPropertiesByLandlord } from "@/api/properties";
import { useUser } from "@/contexts/UserContext";
import { getTenantByUser, type TenantByUserDTO } from "@/api/tenants";
import { getUnit } from "@/api/units";
import { uploadFile } from "@/api/files";
import type { NextPageWithLayout } from "../_app";

// Tenant Maintenance Components
const TenantMaintenancePage = () => {
  const { user } = useUser();
  const [activeTab, setActiveTab] = React.useState<"new" | "history">("new");
  const [tenantDetails, setTenantDetails] =
    React.useState<TenantByUserDTO | null>(null);
  const [tenantLoading, setTenantLoading] = React.useState(true);
  const [historyCount, setHistoryCount] = React.useState(0);

  React.useEffect(() => {
    if (!user?.id || user?.role !== "tenant") {
      setTenantLoading(false);
      return;
    }
    getTenantByUser(String(user.id)).then((r) => {
      if (r.success && r.data) setTenantDetails(r.data);
      setTenantLoading(false);
    });
  }, [user?.id, user?.role]);

  // Always keep history count in sync, even before history tab is opened
  React.useEffect(() => {
    let cancelled = false;
    getMaintenanceRequests({ limit: 100 }).then((result) => {
      if (cancelled) return;
      if (result.success) {
        setHistoryCount(result.data.length);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const tenantId =
    typeof window !== "undefined" ? localStorage.getItem("tenantId") : null;
  const unitId = tenantDetails?.currentUnit?.id ?? null;

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
        <TenantNewRequestForm
          tenantId={tenantId}
          unitId={unitId}
          tenantLoading={tenantLoading}
          onSuccess={() => setActiveTab("history")}
          onHistoryCountChange={setHistoryCount}
        />
      ) : (
        <TenantRequestHistory onCountChange={setHistoryCount} />
      )}
    </section>
  );
};

// Tenant New Request Form
type TenantNewRequestFormProps = {
  tenantId: string | null;
  unitId: string | null;
  tenantLoading: boolean;
  onSuccess?: () => void;
  onHistoryCountChange?: (n: number) => void;
};

const TenantNewRequestForm = ({
  tenantId,
  unitId,
  tenantLoading,
  onSuccess,
  onHistoryCountChange,
}: TenantNewRequestFormProps) => {
  const { user } = useUser();
  const [requestTypes, setRequestTypes] = React.useState<
    MaintenanceRequestTypeDTO[]
  >([]);
  const [typesLoading, setTypesLoading] = React.useState(false);
  const [typesError, setTypesError] = React.useState<string | null>(null);
  const [selectedTypeId, setSelectedTypeId] = React.useState("");
  const [selectedSubTypeId, setSelectedSubTypeId] = React.useState("");
  const [priority, setPriority] = React.useState<"low" | "medium" | "high">(
    "medium",
  );
  const [description, setDescription] = React.useState("");
  const [uploadedImages, setUploadedImages] = React.useState<string[]>([]);
  const [uploadedFileIds, setUploadedFileIds] = React.useState<string[]>([]);
  const [filesToUpload, setFilesToUpload] = React.useState<File[]>([]);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    let cancelled = false;
    setTypesLoading(true);
    setTypesError(null);
    getMaintenanceRequestTypes()
      .then((result) => {
        if (cancelled) return;
        if (result.success) {
          setRequestTypes(result.data);
        } else {
          setTypesError(result.error);
        }
      })
      .finally(() => {
        if (!cancelled) setTypesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter((f) => f.type.startsWith("image/"));
    if (imageFiles.length === 0) return;
    e.target.value = "";
    const baseIndex = filesToUpload.length;
    setFilesToUpload((prev) => [...prev, ...imageFiles]);
    imageFiles.forEach((file, i) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImages((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
      uploadFile({
        file,
        folder: "maintenance",
        label: "supporting",
        token: user?.token,
      }).then((result) => {
        if (result.success && result.data?.id) {
          setUploadedFileIds((prev) => {
            const next = [...prev];
            next[baseIndex + i] = result.data!.id;
            return next;
          });
        }
      });
    });
    setUploadedFileIds((prev) => [...prev, ...imageFiles.map(() => "")]);
  };

  const handleRemoveImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
    setFilesToUpload((prev) => prev.filter((_, i) => i !== index));
    setUploadedFileIds((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!tenantId || !unitId) {
      setSubmitError("Tenant or unit not found. Please refresh the page.");
      return;
    }
    if (!selectedTypeId || !description.trim()) {
      setSubmitError("Please select a category and describe the issue.");
      return;
    }
    setIsSubmitting(true);
    try {
      const unitResult = await getUnit(unitId);
      if (!unitResult.success || !unitResult.data) {
        setSubmitError("Could not load unit details. Please try again.");
        setIsSubmitting(false);
        return;
      }
      const unit = unitResult.data;
      const propertyId =
        unit.propertyId ??
        (unit as { property?: { id?: string } }).property?.id;

      const supportingFileIds = uploadedFileIds.filter((id): id is string =>
        Boolean(id),
      );

      const selectedType = requestTypes.find((t) => t.id === selectedTypeId);
      const selectedSubType = selectedType?.subTypes?.find(
        (s) => s.id === selectedSubTypeId,
      );
      const priorityMap = {
        low: "LOW",
        medium: "MEDIUM",
        high: "HIGH",
      } as const;
      const typeName = selectedType?.name ?? "";
      const subTypeName = selectedSubType?.name ?? "";
      const formatLabel = (value: string) =>
        value
          .replace(/_/g, " ")
          .replace(/\bac\b/gi, "AC")
          .replace(/\bhvac\b/gi, "HVAC")
          .replace(/\b[a-z]/g, (m) => m.toUpperCase());
      const title = subTypeName
        ? `${formatLabel(typeName)}: ${formatLabel(subTypeName)}`
        : formatLabel(typeName);
      const requestBody = {
        ...(propertyId && { propertyId }),
        unitId,
        tenantId,
        level: "UNIT" as const,
        type: typeName,
        priority: priorityMap[priority],
        subType: subTypeName || undefined,
        title,
        description: description.trim(),
        supportingFileIds:
          supportingFileIds.length > 0 ? supportingFileIds : undefined,
      };
      console.log("[Maintenance] Create request payload:", requestBody);

      const result = await createMaintenanceRequest(requestBody);

      console.log("[Maintenance] Create response:", result);

      if (!result.success) {
        setSubmitError(result.error);
        return;
      }
      setSelectedTypeId("");
      setSelectedSubTypeId("");
      setPriority("medium");
      setDescription("");
      setUploadedImages([]);
      setFilesToUpload([]);
      setUploadedFileIds([]);
      onSuccess?.();
      if (onHistoryCountChange) {
        const list = await getMaintenanceRequests({ limit: 100 });
        onHistoryCountChange(list.success ? list.data.length : 0);
      }
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Something went wrong",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedType = React.useMemo(
    () => requestTypes.find((t) => t.id === selectedTypeId),
    [requestTypes, selectedTypeId],
  );

  const formatLabel = (value: string) =>
    value
      .replace(/_/g, " ")
      .replace(/\bac\b/gi, "AC")
      .replace(/\bhvac\b/gi, "HVAC")
      .replace(/\b[a-z]/g, (m) => m.toUpperCase());

  if (tenantLoading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
      </div>
    );
  }

  if (!tenantId || !unitId) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm text-center text-gray-600">
        <p>
          We could not load your unit details. Please try again or contact
          support.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {submitError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {submitError}
        </div>
      )}
      <div className="rounded-lg border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
        {/* Issue Category */}
        <div className="mb-6">
          <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
            Issue Category
            <Info className="h-4 w-4 text-gray-400" />
          </label>
          <select
            value={selectedTypeId}
            onChange={(e) => {
              setSelectedTypeId(e.target.value);
              setSelectedSubTypeId("");
            }}
            disabled={typesLoading || !!typesError}
            className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
          >
            <option value="">
              {typesLoading
                ? "Loading categories…"
                : typesError
                  ? "Unable to load categories"
                  : "Select category"}
            </option>
            {requestTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {formatLabel(type.name)}
              </option>
            ))}
          </select>
        </div>

        {/* Issue Sub Category */}
        <div className="mb-6">
          <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
            Issue Sub Category
            <Info className="h-4 w-4 text-gray-400" />
          </label>
          <select
            value={selectedSubTypeId}
            onChange={(e) => setSelectedSubTypeId(e.target.value)}
            disabled={
              !selectedType || (selectedType?.subTypes?.length ?? 0) === 0
            }
            className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
          >
            <option value="">
              {selectedType && (selectedType.subTypes?.length ?? 0) > 0
                ? "Select sub-category"
                : "No sub-categories"}
            </option>
            {selectedType?.subTypes?.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {formatLabel(sub.name)}
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
          {uploadedImages.length > 0 && (
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
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-6 text-center hover:border-brand-main hover:bg-brand-main/5 transition"
          >
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
          </button>
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
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-lg bg-gray-900 text-sm font-medium text-white hover:bg-gray-800 transition disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Submitting…" : "Submit Request"}
          </button>
        </div>
      </div>
    </form>
  );
};

// Tenant Request History
const PAGE_SIZE = 20;

const TenantRequestHistory = ({
  onCountChange,
}: {
  onCountChange?: (n: number) => void;
}) => {
  const [requests, setRequests] = React.useState<
    MaintenanceRequestWithDetails[]
  >([]);
  const [loading, setLoading] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(true);
  const [loadingMore, setLoadingMore] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setPage(1);
    setHasMore(true);
    getMaintenanceRequests({ page: 1, limit: PAGE_SIZE }).then((result) => {
      if (cancelled) return;
      if (result.success) {
        setRequests(result.data);
        setHasMore(result.data.length >= PAGE_SIZE);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [onCountChange]);

  React.useEffect(() => {
    onCountChange?.(requests.length);
  }, [requests.length, onCountChange]);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    const result = await getMaintenanceRequests({
      page: nextPage,
      limit: PAGE_SIZE,
    });
    setLoadingMore(false);
    if (result.success) {
      setRequests((prev) => [...prev, ...result.data]);
      setHasMore(result.data.length >= PAGE_SIZE);
      setPage(nextPage);
    }
  };

  const getPriorityBadge = (
    priority: MaintenanceRequestWithDetails["priority"],
  ) => {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm text-center text-gray-500">
        <Wrench className="mx-auto h-10 w-10 text-gray-400 mb-3" />
        <p className="text-sm font-medium text-gray-900">No requests yet</p>
        <p className="text-xs mt-1">
          Your maintenance request history will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((request, index) => (
        <motion.div
          key={request.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: index * 0.05 }}
          className="rounded-lg border border-gray-200 bg-white p-4 sm:p-6 shadow-sm"
        >
          <Link href={`/dashboard/maintenance/${request.id}`} className="block">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
              <div className="flex-1">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 hover:text-brand-main transition">
                  {request.title ||
                    `${request.type}${request.subType ? ` — ${request.subType}` : ""}`}
                </h3>
                <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                  {request.description}
                </p>
                <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-gray-600">
                  <span>Reported: {request.reportedTime}</span>
                  {request.unit && (
                    <>
                      <span>•</span>
                      <span>Unit: {request.unit}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {getPriorityBadge(request.priority)}
                {getStatusBadge(request.status)}
              </div>
            </div>
            <p className="text-xs font-medium text-brand-main">
              View details →
            </p>
          </Link>
        </motion.div>
      ))}
      {hasMore && (
        <div className="flex justify-center pt-4">
          <button
            type="button"
            onClick={loadMore}
            disabled={loadingMore}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            {loadingMore ? "Loading…" : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
};

// Landlord/Manager Maintenance Page (existing)
const LandlordMaintenancePage = () => {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedPriority, setSelectedPriority] =
    React.useState("All Priorities");
  const [selectedCategory, setSelectedCategory] =
    React.useState("All Categories");
  const [activeTab, setActiveTab] = React.useState<
    "all" | "new" | "in_progress" | "resolved"
  >("all");
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [requests, setRequests] = React.useState<
    MaintenanceRequestWithDetails[]
  >([]);
  const [isLoadingRequests, setIsLoadingRequests] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(true);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [landlordProperties, setLandlordProperties] = React.useState<
    { id: string; name: string }[]
  >([]);

  // Fetch landlord properties for the "New request" modal
  React.useEffect(() => {
    const landlordId =
      typeof window !== "undefined"
        ? localStorage.getItem("landlordId") ||
          localStorage.getItem("selectedLandlordId") ||
          ""
        : "";
    if (!landlordId) {
      setLandlordProperties([]);
      return;
    }
    let cancelled = false;
    getPropertiesByLandlord(landlordId).then((result) => {
      if (cancelled) return;
      if (result.success) {
        setLandlordProperties(
          result.data.map((p) => ({ id: p.id, name: p.name })),
        );
      } else {
        setLandlordProperties([]);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    const fetchRequests = async () => {
      setIsLoadingRequests(true);
      const result = await getMaintenanceRequests({
        page: 1,
        limit: PAGE_SIZE,
      });
      if (result.success) {
        setRequests(result.data);
        setHasMore(result.data.length >= PAGE_SIZE);
        setPage(1);
      }
      setIsLoadingRequests(false);
    };
    fetchRequests();
  }, []);

  const loadMoreRequests = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    const result = await getMaintenanceRequests({
      page: nextPage,
      limit: PAGE_SIZE,
    });
    setLoadingMore(false);
    if (result.success) {
      setRequests((prev) => [...prev, ...result.data]);
      setHasMore(result.data.length >= PAGE_SIZE);
      setPage(nextPage);
    }
  };

  // Filter requests based on search, filters, and active tab
  const filteredRequests = requests.filter((request) => {
    const matchesSearch =
      (request.propertyName ?? "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (request.unit ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (request.tenantName ?? "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (request.description ?? "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

    const matchesPriority =
      selectedPriority === "All Priorities" ||
      request.priority === selectedPriority.toLowerCase();

    const matchesCategory =
      selectedCategory === "All Categories" ||
      request.type === selectedCategory;

    const matchesTab =
      activeTab === "all" ||
      (activeTab === "new" && request.status === "new") ||
      (activeTab === "in_progress" && request.status === "in_progress") ||
      (activeTab === "resolved" && request.status === "resolved");

    return matchesSearch && matchesPriority && matchesCategory && matchesTab;
  });

  // Count requests by status
  const allCount = requests.length;
  const newCount = requests.filter((r) => r.status === "new").length;
  const inProgressCount = requests.filter(
    (r) => r.status === "in_progress",
  ).length;
  const resolvedCount = requests.filter((r) => r.status === "resolved").length;

  const getPriorityBadge = (
    priority: MaintenanceRequestWithDetails["priority"],
  ) => {
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

  const [updatingId, setUpdatingId] = React.useState<string | null>(null);

  const handleStatusUpdate = React.useCallback(
    async (requestId: string, newStatus: "IN_PROGRESS" | "COMPLETED") => {
      setUpdatingId(requestId);
      const result = await updateMaintenanceRequestStatus(requestId, {
        status: newStatus === "COMPLETED" ? "COMPLETED" : "IN_PROGRESS",
      });
      setUpdatingId(null);
      if (result.success) {
        setRequests((prev) =>
          prev.map((r) =>
            r.id === requestId
              ? {
                  ...r,
                  status:
                    newStatus === "COMPLETED"
                      ? ("resolved" as const)
                      : ("in_progress" as const),
                }
              : r,
          ),
        );
      }
    },
    [],
  );

  const getActionButton = (request: MaintenanceRequestWithDetails) => {
    if (request.status === "new") {
      return (
        <motion.button
          type="button"
          disabled={updatingId === request.id}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleStatusUpdate(request.id, "IN_PROGRESS")}
          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700 disabled:opacity-70"
        >
          {updatingId === request.id ? "Updating…" : "Start Work"}
        </motion.button>
      );
    }
    if (request.status === "in_progress") {
      return (
        <motion.button
          type="button"
          disabled={updatingId === request.id}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleStatusUpdate(request.id, "COMPLETED")}
          className="rounded-lg bg-brand-main px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-main/90 disabled:opacity-70"
        >
          {updatingId === request.id ? "Updating…" : "Mark Resolved"}
        </motion.button>
      );
    }
    return null;
  };

  const handleSubmitNewRequest = React.useCallback(
    async (data: {
      propertyId: string;
      unitId: string;
      maintenanceType: string;
      maintenanceSubType: string;
      priority: string;
      additionalDetails: string;
    }) => {
      const formatLabel = (value: string) =>
        value
          .replace(/_/g, " ")
          .replace(/\bac\b/gi, "AC")
          .replace(/\bhvac\b/gi, "HVAC")
          .replace(/\b[a-z]/g, (m) => m.toUpperCase());

      const typeName = data.maintenanceType;
      const subTypeName = data.maintenanceSubType;
      const title = subTypeName
        ? `${formatLabel(typeName)}: ${formatLabel(subTypeName)}`
        : formatLabel(typeName);

      const result = await createMaintenanceRequest({
        propertyId: data.propertyId,
        unitId: data.unitId,
        level: "UNIT",
        type: typeName,
        priority: data.priority.toUpperCase() as "LOW" | "MEDIUM" | "HIGH",
        subType: subTypeName || undefined,
        title,
        description: data.additionalDetails,
      });

      if (result.success) {
        // Refresh first page of requests so dashboard reflects the new one
        const refreshed = await getMaintenanceRequests({
          page: 1,
          limit: PAGE_SIZE,
        });
        if (refreshed.success) {
          setRequests(refreshed.data);
          setHasMore(refreshed.data.length >= PAGE_SIZE);
          setPage(1);
        }
      } else {
        throw new Error(result.error);
      }
    },
    [],
  );

  return (
    <>
      <section className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              Maintenance Requests
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-gray-600">
              Track and manage property maintenance requests
            </p>
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
          {isLoadingRequests ? (
            <div className="flex flex-col items-center justify-center py-12 px-6 rounded-lg border border-gray-200 bg-white">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-brand-main border-r-transparent" />
              <p className="mt-4 text-sm text-gray-600">
                Loading maintenance requests...
              </p>
            </div>
          ) : filteredRequests.length > 0 ? (
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
                    <p className="text-xs sm:text-sm font-semibold text-gray-900">
                      {request.requestId}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">
                      Maintenance Type *
                    </p>
                    <p className="text-xs sm:text-sm font-semibold text-gray-900">
                      {request.type}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">
                      Maintenance Sub-Type *
                    </p>
                    <p className="text-xs sm:text-sm font-semibold text-gray-900">
                      {request.subType}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Reported</p>
                    <p className="text-xs sm:text-sm font-semibold text-gray-900">
                      {request.reportedTime}
                    </p>
                  </div>
                </div>
                <div className="border-t border-gray-200 pt-4 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <p className="text-xs sm:text-sm text-gray-700 flex-1">
                    {request.description}
                  </p>
                  <div className="flex-shrink-0 lg:pl-6 lg:border-l lg:border-gray-200 w-full lg:w-auto flex flex-wrap items-center gap-2">
                    <Link
                      href={`/dashboard/maintenance/${request.id}`}
                      className="text-sm font-medium text-brand-main hover:underline inline-flex items-center gap-1"
                    >
                      View details
                      <span aria-hidden>→</span>
                    </Link>
                    {getActionButton(request)}
                  </div>
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
              <p className="text-sm font-medium text-gray-900 mb-1">
                No Maintenance Requests
              </p>
              <p className="text-xs text-gray-500 text-center">
                Maintenance requests will appear here when available.
              </p>
            </motion.div>
          )}
          {!isLoadingRequests && filteredRequests.length > 0 && hasMore && (
            <div className="flex justify-center pt-6">
              <button
                type="button"
                onClick={loadMoreRequests}
                disabled={loadingMore}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
              >
                {loadingMore ? "Loading…" : "Load more"}
              </button>
            </div>
          )}
        </div>
      </section>

      <NewMaintenanceRequestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        properties={landlordProperties}
        onSubmitRequest={handleSubmitNewRequest}
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
      // Landlord, manager, and super_admin see landlord view
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
