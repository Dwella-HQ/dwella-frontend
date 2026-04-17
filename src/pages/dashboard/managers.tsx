import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { InviteManagerModal } from "@/components/InviteManagerModal";
import { EditManagerModal } from "@/components/EditManagerModal";
import type { PropertyDTO } from "@/api/properties";
import { getPropertiesByLandlord } from "@/api/properties";
import { getPropertyManagersByLandlord, updatePropertyManager } from "@/api/property-managers";
import type { PropertyManagerDTO } from "@/api/property-managers";
import type { Manager } from "@/data/mockLandlordData";
import { useToast } from "@/components/Toast";

const timeAgo = (iso?: string) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const diffMs = Date.now() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs} hour${diffHrs === 1 ? "" : "s"} ago`;
  const diffDays = Math.floor(diffHrs / 24);
  return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
};

const ManagersPage = () => {
  const { showToast } = useToast();
  const [isInviteModalOpen, setIsInviteModalOpen] = React.useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [selectedManager, setSelectedManager] = React.useState<Manager | null>(null);
  const [managers, setManagers] = React.useState<Manager[]>([]);
  const [isLoadingManagers, setIsLoadingManagers] = React.useState(false);
  const [properties, setProperties] = React.useState<PropertyDTO[]>([]);
  const [isLoadingProperties, setIsLoadingProperties] = React.useState(false);
  const [isSavingManager, setIsSavingManager] = React.useState(false);

  const mapPropertyManagerToManager = React.useCallback((pm: PropertyManagerDTO): Manager => {
    const name =
      pm.user?.fullName ||
      pm.fullName ||
      pm.name ||
      pm.user?.email ||
      "Manager";
    const email = pm.user?.email || pm.email || "";
    const phone = pm.user?.phoneNumber || pm.phone || "";
    const status = pm.isActive ? "active" : "inactive";

    const rawProperties = (pm as { properties?: unknown }).properties;
    const assignedProperties =
      Array.isArray(rawProperties)
        ? rawProperties
            .map((p) => {
              if (typeof p === "string") return p;
              if (p && typeof p === "object" && "id" in p) {
                const id = (p as { id?: unknown }).id;
                return typeof id === "string" ? id : null;
              }
              return null;
            })
            .filter((id): id is string => Boolean(id))
        : [];

    return {
      id: pm.id,
      name,
      email,
      phone,
      status,
      assignedProperties,
      permissions: pm.permissions || [],
      lastActive: timeAgo(pm.updatedAt || pm.createdAt),
    };
  }, []);

  React.useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const landlordId =
        typeof window !== "undefined" ? localStorage.getItem("landlordId") : null;
      if (!landlordId) {
        setManagers([]);
        return;
      }

      setIsLoadingManagers(true);
      setIsLoadingProperties(true);
      const [managerResult, propertiesResult] = await Promise.all([
        getPropertyManagersByLandlord(landlordId),
        getPropertiesByLandlord(landlordId),
      ]);
      if (cancelled) return;

      if (propertiesResult.success) {
        setProperties(propertiesResult.data);
      } else {
        setProperties([]);
      }
      setIsLoadingProperties(false);

      const result = managerResult;
      if (cancelled) return;

      if (!result.success) {
        showToast(result.error || "Failed to load managers", "error");
        setManagers([]);
        setIsLoadingManagers(false);
        return;
      }

      const mapped: Manager[] = result.data.map(mapPropertyManagerToManager);

      setManagers(mapped);
      setIsLoadingManagers(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [showToast, mapPropertyManagerToManager]);

  const handleInvite = (data: {
    fullName: string;
    email: string;
    phone?: string;
    properties: string[];
    permissions: string[];
  }) => {
    // In a real app, this would make an API call
    const newManager: Manager = {
      id: String(managers.length + 1),
      name: data.fullName,
      email: data.email,
      phone: data.phone || "",
      status: "active",
      assignedProperties: data.properties,
      permissions: data.permissions,
      lastActive: "Just now",
    };
    setManagers([...managers, newManager]);
  };

  const handleEdit = async (managerId: string, data: {
    fullName: string;
    email: string;
    phone?: string;
    properties: string[];
    permissions: string[];
  }) => {
    setIsSavingManager(true);
    const result = await updatePropertyManager(managerId, {
      fullName: data.fullName,
      email: data.email,
      phoneNumber: data.phone,
      propertyIds: data.properties,
      permissions: data.permissions,
    });
    setIsSavingManager(false);

    if (!result.success) {
      showToast(result.error || "Failed to update manager", "error");
      return;
    }

    const mapped = mapPropertyManagerToManager(result.data);
    setManagers((prev) =>
      prev.map((m) => (m.id === managerId ? { ...m, ...mapped } : m)),
    );
    showToast("Manager updated successfully", "success");
  };

  const handleActivate = (managerId: string) => {
    setManagers(managers.map((m) =>
      m.id === managerId ? { ...m, status: "active" as const } : m
    ));
  };

  const handleDeactivate = (managerId: string) => {
    setManagers(managers.map((m) =>
      m.id === managerId ? { ...m, status: "inactive" as const } : m
    ));
  };

  const handleEditClick = (manager: Manager) => {
    setSelectedManager(manager);
    setIsEditModalOpen(true);
  };

  const getManagerInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getPropertyName = (propertyId: string) => {
    return properties.find((p) => p.id === propertyId)?.name || "Unknown";
  };

  return (
    <DashboardLayout>
      <AnimatePresence mode="wait">
        <motion.section
          key="managers"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Team & Managers</h1>
                  <p className="mt-1 text-sm text-gray-600">
                    Manage property managers and their permissions.
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsInviteModalOpen(true)}
                  className="w-[50%] h-10 sm:w-auto flex items-center gap-2 rounded-lg bg-gray-900 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white transition hover:bg-gray-800 whitespace-nowrap"
                >
                  <span>+</span>
                  <span className="hidden sm:inline">Invite Manager</span>
                  <span className="sm:hidden">Invite</span>
                </motion.button>
              </div>

              {/* Managers List */}
              <div className="space-y-4">
                {isLoadingManagers && (
                  <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                    <p className="text-sm text-gray-600">Loading managers…</p>
                  </div>
                )}
                {managers.map((manager, index) => (
                  <motion.div
                    key={manager.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="rounded-lg border border-gray-200 bg-white p-4 sm:p-6 shadow-sm"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-6">
                      {/* First and Second Groups - Manager Info and Assigned Properties */}
                      <div className="flex flex-col sm:flex-row sm:items-start gap-6 sm:gap-12 flex-1">
                        {/* Manager Info Section */}
                        <div className="flex items-start gap-4">
                          {/* Avatar */}
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500 text-sm font-semibold text-white flex-shrink-0">
                            {getManagerInitials(manager.name)}
                          </div>

                          {/* Manager Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                                {manager.name}
                              </h3>
                              <span
                                className={`rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${
                                  manager.status === "active"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-gray-100 text-gray-700"
                                }`}
                              >
                                {manager.status === "active" ? "Active" : "Inactive"}
                              </span>
                            </div>

                            <div className="mt-2 space-y-1">
                              <p className="text-sm text-gray-600 break-all">{manager.email}</p>
                              <p className="text-sm text-gray-600">{manager.phone}</p>
                            </div>

                            <p className="mt-3 text-sm text-gray-600">
                              {manager.assignedProperties.length} propert
                              {manager.assignedProperties.length === 1 ? "y" : "ies"} assigned.
                            </p>
                          </div>
                        </div>

                        {/* Assigned Properties Section */}
                        <div className="flex-shrink-0">
                          <p className="text-sm text-gray-500 mb-2">Assigned Properties</p>
                          <div className="flex flex-wrap gap-2">
                            {manager.assignedProperties.length === 0 ? (
                              <span className="rounded-md bg-gray-50 px-3 py-1 text-sm font-medium text-gray-600">
                                None assigned
                              </span>
                            ) : manager.assignedProperties.map((propertyId) => (
                              <span
                                key={propertyId}
                                className="rounded-md bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700"
                              >
                                {getPropertyName(propertyId)}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Last Active Section */}
                      <div className="text-left sm:text-right sm:mr-8 lg:flex-shrink-0">
                        <p className="text-sm text-gray-500">Last Active</p>
                        <p className="mt-1 text-sm font-medium text-gray-900">
                          {manager.lastActive}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons Section */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleEditClick(manager)}
                          className="flex-1 sm:flex-none rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                        >
                          Edit
                        </motion.button>
                        {manager.status === "active" ? (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleDeactivate(manager.id)}
                            className="flex-1 sm:flex-none rounded-lg bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100"
                          >
                            Deactivate
                          </motion.button>
                        ) : (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleActivate(manager.id)}
                            className="flex-1 sm:flex-none rounded-lg bg-green-50 px-4 py-2 text-sm font-medium text-green-700 transition hover:bg-green-100"
                          >
                            Activate
                          </motion.button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Empty State */}
              {managers.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center rounded-lg border border-gray-200 bg-white p-12 text-center"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                    <Users className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-gray-900">
                    No managers yet
                  </h3>
                  <p className="mt-2 text-sm text-gray-600">
                    Get started by inviting your first property manager.
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsInviteModalOpen(true)}
                    className="mt-6 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
                  >
                    + Invite Manager
                  </motion.button>
                </motion.div>
              )}
        </motion.section>
      </AnimatePresence>

      {/* Modals */}
      <InviteManagerModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onInvite={handleInvite}
      />

      <EditManagerModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedManager(null);
        }}
        manager={selectedManager}
        properties={properties}
        isLoadingProperties={isLoadingProperties}
        isSaving={isSavingManager}
        onSave={async (data) => {
          if (selectedManager) {
            await handleEdit(selectedManager.id, data);
          }
        }}
      />
    </DashboardLayout>
  );
};

export default ManagersPage;

