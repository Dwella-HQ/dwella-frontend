import * as React from "react";
import Head from "next/head";
import { format, parseISO } from "date-fns";
import type { NextPageWithLayout } from "../_app";
import { useUser } from "@/contexts/UserContext";
import { useToast } from "@/components/Toast";
import {
  deleteAnnouncementLandlord,
  deleteAnnouncementProperty,
  getAnnouncements,
  subscribeAnnouncements,
  type AnnouncementItemDTO,
} from "@/api/announcement";
import { AnnouncementDetailsModal } from "@/components/AnnouncementDetailsModal";
import { DashboardLayout } from "@/components/DashboardLayout";

const formatDateValue = (value?: string) => {
  if (!value) return "Just now";
  try {
    return format(parseISO(value), "dd MMM yyyy, h:mm a");
  } catch {
    return value;
  }
};

const isLandlordLevelAnnouncement = (item: AnnouncementItemDTO) => {
  return (item.level || "").toUpperCase() === "LANDLORD";
};

const isBroadcastAnnouncement = (item: AnnouncementItemDTO) => {
  const level = (item.level || "").toUpperCase();
  return level === "LANDLORD" || level === "PROPERTY";
};

const AnnouncementsPage: NextPageWithLayout = () => {
  const { user } = useUser();
  const { showToast } = useToast();
  const [announcements, setAnnouncements] = React.useState<
    AnnouncementItemDTO[]
  >([]);
  const [selectedAnnouncement, setSelectedAnnouncement] =
    React.useState<AnnouncementItemDTO | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const filterForRole = React.useCallback(
    (items: AnnouncementItemDTO[]) => {
      return user?.role === "tenant" || user?.role === "property_manager"
        ? items.filter(isBroadcastAnnouncement)
        : items;
    },
    [user?.role],
  );

  React.useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;

    getAnnouncements().then((result) => {
      if (cancelled) return;
      if (result.success) {
        setAnnouncements(filterForRole(result.data));
      } else {
        console.warn("Announcements page REST load failed:", result.error);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [filterForRole, user?.id]);

  React.useEffect(() => {
    if (!user?.id) return;

    const subscription = subscribeAnnouncements({
      token: user.token,
      onLoad: (items) => {
        const roleFiltered = filterForRole(items);

        setAnnouncements((prev) => {
          if (roleFiltered.length === 0 && prev.length > 0) return prev;
          return roleFiltered;
        });

        console.log("Announcements page loaded via socket", {
          role: user.role,
          count: roleFiltered.length,
          items: roleFiltered,
          rawCount: items.length,
        });
      },
      onRaw: (payload) => {
        console.log("Announcements page raw socket payload", payload);
      },
      onError: (error) => {
        console.warn("Announcements page socket error:", error);
      },
    });

    return () => {
      subscription.disconnect();
      console.log("Announcements page socket disconnected");
    };
  }, [filterForRole, user?.id, user?.token]);

  const canDeleteAnnouncements =
    user?.role === "landlord" || user?.role === "property_manager";

  const handleDeleteAnnouncement = React.useCallback(
    async (item: AnnouncementItemDTO) => {
      if (!item.id) {
        showToast("This announcement cannot be deleted yet.", "error");
        return;
      }

      const confirmed = window.confirm(
        "Delete this announcement? This action cannot be undone.",
      );
      if (!confirmed) return;

      setDeletingId(item.id);
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
      } else {
        showToast(result.error || "Failed to delete announcement", "error");
      }
      setDeletingId(null);
    },
    [showToast],
  );

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
          <span className="inline-flex items-center rounded-full bg-brand-main/10 px-2.5 py-1 text-xs font-semibold text-brand-main">
            {announcements.length}
          </span>
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
                    {canDeleteAnnouncements && item.id ? (
                      <button
                        type="button"
                        disabled={deletingId === item.id}
                        onClick={() => void handleDeleteAnnouncement(item)}
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
      />
    </>
  );
};

AnnouncementsPage.getLayout = (page) => (
  <DashboardLayout>{page}</DashboardLayout>
);

export default AnnouncementsPage;
