import * as React from "react";
import Head from "next/head";
import { format, parseISO } from "date-fns";
import { Plus } from "lucide-react";
import type { NextPageWithLayout } from "../_app";
import { useUser } from "@/contexts/UserContext";
import { useToast } from "@/components/Toast";
import {
  createAnnouncementLandlord,
  createAnnouncementProperty,
  deleteAnnouncementLandlord,
  deleteAnnouncementProperty,
  subscribeAnnouncements,
  type AnnouncementItemDTO,
} from "@/api/announcement";
import { AnnouncementDetailsModal } from "@/components/AnnouncementDetailsModal";
import { DashboardLayout } from "@/components/DashboardLayout";
import { SendAnnouncementModal } from "@/components/SendAnnouncementModal";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useSelectedLandlord } from "@/contexts/SelectedLandlordContext";
import { getPropertiesByLandlord } from "@/api/properties";
import { mergeAnnouncementLists } from "@/utils/mergeAnnouncementLists";
import {
  loadCachedAnnouncements,
  saveCachedAnnouncements,
} from "@/utils/announcementsCache";

const readAnnouncementToken = (): string => {
  if (typeof window === "undefined") return "";
  return (
    window.localStorage.getItem("authToken") ||
    window.localStorage.getItem("accessToken") ||
    ""
  );
};

const formatDateValue = (value?: string) => {
  if (!value) return "Just now";
  try {
    return format(parseISO(value), "dd MMM yyyy, h:mm a");
  } catch {
    return value;
  }
};

const isBroadcastAnnouncement = (item: AnnouncementItemDTO) => {
  const level = (item.level || "").toUpperCase();
  return level === "LANDLORD" || level === "PROPERTY";
};

const AnnouncementsPage: NextPageWithLayout = () => {
  const { user } = useUser();
  const { showToast } = useToast();
  const { selectedLandlord } = useSelectedLandlord();
  const userId = user?.id ? String(user.id) : null;
  const [announcements, setAnnouncements] = React.useState<
    AnnouncementItemDTO[]
  >([]);
  const [selectedAnnouncement, setSelectedAnnouncement] =
    React.useState<AnnouncementItemDTO | null>(null);
  const [isSendAnnouncementOpen, setIsSendAnnouncementOpen] =
    React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [pendingDelete, setPendingDelete] =
    React.useState<AnnouncementItemDTO | null>(null);

  const filterForRole = React.useCallback(
    (items: AnnouncementItemDTO[]) => {
      return user?.role === "tenant" || user?.role === "property_manager"
        ? items.filter(isBroadcastAnnouncement)
        : items;
    },
    [user?.role],
  );

  // Hydrate from cache so refresh/navigation never shows an empty list while
  // waiting for socket data.
  React.useEffect(() => {
    if (!userId) return;
    const cached = filterForRole(loadCachedAnnouncements(userId));
    if (cached.length > 0) {
      setAnnouncements((prev) => mergeAnnouncementLists(prev, cached));
    }
  }, [filterForRole, userId]);

  // Persist whatever the user can currently see.
  React.useEffect(() => {
    if (!userId) return;
    saveCachedAnnouncements(userId, announcements);
  }, [announcements, userId]);

  // NOTE: As of May 2026, the backend AnnouncementGateway rejects landlord/admin
  // tokens. Landlords/admins rely on optimistic updates + cache until backend is fixed.
  React.useEffect(() => {
    if (!user?.id) return;

    const token = user.token || readAnnouncementToken();
    if (!token) {
      console.warn("[announcements page] no token for socket");
      return;
    }

    const subscription = subscribeAnnouncements({
      token,
      onLoad: (items) => {
        const roleFiltered = filterForRole(items);
        console.log("[announcements page] socket onLoad", {
          role: user?.role,
          rawCount: items.length,
          filteredCount: roleFiltered.length,
          rawItems: items,
          filteredItems: roleFiltered,
        });
        setAnnouncements((prev) => mergeAnnouncementLists(prev, roleFiltered));
      },
      onRaw: (payload) => {
        console.log("[announcements page] socket raw payload:", payload);
      },
      onError: (error) => {
        console.warn("[announcements page] socket error:", error);
        if (error.includes("Authentication failed")) {
          console.warn(
            "[announcements page] Backend rejecting token for role:",
            user?.role,
            ". Using cache + optimistic updates only.",
          );
        }
      },
    });

    return () => {
      subscription.disconnect();
    };
  }, [filterForRole, user?.id, user?.role, user?.token]);

  const canDeleteAnnouncements =
    user?.role === "landlord" || user?.role === "property_manager";
  const canCreateAnnouncements =
    user?.role === "landlord" || user?.role === "property_manager";

  const resolveManagerPropertyId = React.useCallback(async () => {
    const selectedPropertyId = selectedLandlord?.properties?.[0]?.id;
    if (selectedPropertyId) return selectedPropertyId;

    const landlordId =
      selectedLandlord?.id ||
      (typeof window !== "undefined"
        ? localStorage.getItem("landlordId") ||
          localStorage.getItem("selectedLandlordId")
        : "");

    if (!landlordId) return "";

    const result = await getPropertiesByLandlord(landlordId);
    if (result.success) {
      return result.data[0]?.id || "";
    }

    return "";
  }, [selectedLandlord]);

  const handleCreateAnnouncement = React.useCallback(
    async (data: { title: string; message: string; fileIds?: string[] }) => {
      const fileIds = Array.isArray(data.fileIds) ? data.fileIds : [];
      const createdAt = new Date().toISOString();

      if (user?.role === "property_manager") {
        const propertyId = await resolveManagerPropertyId();
        if (!propertyId) {
          showToast(
            "No property found to send this announcement. Select a landlord with properties first.",
            "error",
          );
          throw new Error("Missing property");
        }

        const result = await createAnnouncementProperty(propertyId, {
          title: data.title,
          content: data.message,
          fileIds,
        });

        if (!result.success) {
          showToast(result.error || "Failed to send announcement", "error");
          throw new Error(result.error || "Failed to send announcement");
        }

        setAnnouncements((prev) => [
          {
            id:
              typeof result.data.data === "object" &&
              result.data.data &&
              "id" in result.data.data
                ? String((result.data.data as { id?: unknown }).id || "")
                : undefined,
            title: data.title,
            content: data.message,
            level: "PROPERTY",
            fileIds,
            createdAt,
            updatedAt: createdAt,
          },
          ...prev,
        ]);
        showToast("Announcement sent", "success");
        return;
      }

      const landlordId =
        typeof window !== "undefined" ? localStorage.getItem("landlordId") : "";

      if (!landlordId) {
        showToast(
          "Your landlord account could not be found. Please sign in again.",
          "error",
        );
        throw new Error("Missing landlord account");
      }

      const result = await createAnnouncementLandlord(landlordId, {
        title: data.title,
        content: data.message,
        fileIds,
      });

      if (!result.success) {
        showToast(result.error || "Failed to send announcement", "error");
        throw new Error(result.error || "Failed to send announcement");
      }

      const newAnnouncement = {
        id:
          typeof result.data.data === "object" &&
          result.data.data &&
          "id" in result.data.data
            ? String((result.data.data as { id?: unknown }).id || "")
            : undefined,
        title: data.title,
        content: data.message,
        level: "LANDLORD",
        fileIds,
        createdAt,
        updatedAt: createdAt,
      };
      console.log(
        "[announcements page] optimistic update: adding announcement",
        newAnnouncement,
      );
      setAnnouncements((prev) => {
        const updated = [newAnnouncement, ...prev];
        console.log(
          "[announcements page] new announcements count:",
          updated.length,
        );
        return updated;
      });
      showToast("Announcement sent", "success");
    },
    [resolveManagerPropertyId, showToast, user?.role],
  );

  const canDeleteAnnouncement = React.useCallback(
    (item: AnnouncementItemDTO) => {
      const level = (item.level || "").toUpperCase();
      if (user?.role === "landlord") {
        return level === "LANDLORD" || level === "PROPERTY";
      }
      if (user?.role === "property_manager") {
        return level === "PROPERTY";
      }
      return false;
    },
    [user?.role],
  );

  const handleDeleteAnnouncement = React.useCallback(
    async (item: AnnouncementItemDTO): Promise<boolean> => {
      if (!item.id) {
        showToast("This announcement cannot be deleted yet.", "error");
        return false;
      }
      if (!canDeleteAnnouncement(item)) {
        showToast("You can only delete property-level announcements.", "error");
        return false;
      }

      setDeletingId(item.id);
      // Dispatch to the right endpoint by level: LANDLORD-level uses the
      // landlord delete route, PROPERTY-level uses the property delete route.
      const level = (item.level || "").toUpperCase();
      const result =
        level === "PROPERTY"
          ? await deleteAnnouncementProperty(item.id)
          : await deleteAnnouncementLandlord(item.id);

      if (result.success) {
        setAnnouncements((prev) =>
          prev.filter((announcement) => announcement.id !== item.id),
        );
        setSelectedAnnouncement((current) =>
          current?.id === item.id ? null : current,
        );
        showToast("Announcement deleted", "success");
        setDeletingId(null);
        return true;
      }

      showToast(result.error || "Failed to delete announcement", "error");
      setDeletingId(null);
      return false;
    },
    [canDeleteAnnouncement, showToast],
  );

  const requestDeleteAnnouncement = React.useCallback(
    async (item: AnnouncementItemDTO): Promise<boolean> => {
      setPendingDelete(item);
      return false;
    },
    [],
  );

  const confirmDeleteAnnouncement = React.useCallback(async () => {
    if (!pendingDelete) return;
    const success = await handleDeleteAnnouncement(pendingDelete);
    if (success) {
      setPendingDelete(null);
    }
  }, [handleDeleteAnnouncement, pendingDelete]);

  const pageTitle =
    user?.role === "tenant" || user?.role === "property_manager"
      ? "Landlord Broadcasts"
      : "All Announcements";

  return (
    <>
      <Head>
        <title>DWELLA NG · Announcements</title>
      </Head>

      <section className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              {pageTitle}
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Click any announcement to view full details and attachments.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center rounded-full bg-brand-main/10 px-2.5 py-1 text-xs font-semibold text-brand-main">
              {announcements.length}
            </span>
            {canCreateAnnouncements ? (
              <button
                type="button"
                onClick={() => setIsSendAnnouncementOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
              >
                <Plus className="h-4 w-4" />
                Add announcement
              </button>
            ) : null}
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          {announcements.length === 0 ? (
            <p className="text-sm text-gray-500">
              No announcements available yet.
            </p>
          ) : (
            <div className="space-y-3">
              {announcements.map((item, index) => (
                <div
                  key={item.id || `${item.title}-${index}`}
                  className="rounded-md border border-gray-100 bg-gray-50 p-4 transition hover:border-gray-200 hover:bg-gray-100"
                >
                  <div className="flex items-start justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedAnnouncement(item)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-gray-900">
                          {item.title}
                        </p>
                        <span className="text-xs text-gray-500">
                          {formatDateValue(item.createdAt)}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-gray-700">
                        {item.content}
                      </p>
                      <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                        <span>Level: {item.level || "N/A"}</span>
                        <span>Attachments: {item.fileIds?.length || 0}</span>
                      </div>
                    </button>
                    {canDeleteAnnouncements &&
                    item.id &&
                    canDeleteAnnouncement(item) ? (
                      <button
                        type="button"
                        disabled={deletingId === item.id}
                        onClick={() => requestDeleteAnnouncement(item)}
                        className="shrink-0 rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {deletingId === item.id ? "Deleting..." : "Delete"}
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <AnnouncementDetailsModal
        isOpen={Boolean(selectedAnnouncement)}
        announcement={selectedAnnouncement}
        onClose={() => setSelectedAnnouncement(null)}
        onDelete={
          canDeleteAnnouncements &&
          selectedAnnouncement &&
          canDeleteAnnouncement(selectedAnnouncement)
            ? (item) => requestDeleteAnnouncement(item)
            : undefined
        }
        isDeleting={
          selectedAnnouncement?.id != null &&
          deletingId === selectedAnnouncement.id
        }
      />
      <ConfirmDialog
        isOpen={Boolean(pendingDelete)}
        title="Delete announcement?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDeleteAnnouncement}
        isProcessing={
          pendingDelete?.id != null && deletingId === pendingDelete.id
        }
      />
      <SendAnnouncementModal
        isOpen={isSendAnnouncementOpen}
        onClose={() => setIsSendAnnouncementOpen(false)}
        onSend={handleCreateAnnouncement}
      />
    </>
  );
};

AnnouncementsPage.getLayout = (page) => (
  <DashboardLayout>{page}</DashboardLayout>
);

export default AnnouncementsPage;
