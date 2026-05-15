import Head from "next/head";
import * as React from "react";
import { format, parseISO } from "date-fns";
import { Loader2, Search, Trash2 } from "lucide-react";
import type { NextPageWithLayout } from "@/pages/_app";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  deleteAnnouncementLandlord,
  deleteAnnouncementProperty,
  subscribeAnnouncements,
  type AnnouncementItemDTO,
} from "@/api/announcement";
import { useUser } from "@/contexts/UserContext";
import { useToast } from "@/components/Toast";
import { mergeAnnouncementLists } from "@/utils/mergeAnnouncementLists";

const formatDateValue = (value?: string) => {
  if (!value) return "—";
  try {
    return format(parseISO(value), "dd MMM yyyy, h:mm a");
  } catch {
    return value;
  }
};

const formatRelativeTime = (value?: string) => {
  if (!value) return "—";
  try {
    const date = parseISO(value);
    return format(date, "dd MMM, h:mm a");
  } catch {
    return value;
  }
};

const AdminAnnouncementsPage: NextPageWithLayout = () => {
  const { user } = useUser();
  const { showToast } = useToast();
  const [announcements, setAnnouncements] = React.useState<
    AnnouncementItemDTO[]
  >([]);
  const [selected, setSelected] = React.useState<AnnouncementItemDTO | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [refreshKey, setRefreshKey] = React.useState(0);
  const [pendingDelete, setPendingDelete] =
    React.useState<AnnouncementItemDTO | null>(null);

  // Keep the admin view live as landlords/property managers post.
  React.useEffect(() => {
    if (!user?.token) return;
    setIsLoading(true);
    setError(null);
    const subscription = subscribeAnnouncements({
      token: user.token,
      onLoad: (items) => {
        setAnnouncements((prev) => mergeAnnouncementLists(prev, items));
        setIsLoading(false);
      },
      onError: (err) => {
        console.warn("Admin announcement socket error:", err);
        setError(err);
        setIsLoading(false);
      },
    });
    const loadingFallback = window.setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    return () => {
      window.clearTimeout(loadingFallback);
      subscription.disconnect();
    };
  }, [refreshKey, user?.token]);

  React.useEffect(() => {
    setSelected((prev) => {
      if (!announcements.length) return null;
      if (!prev) return announcements[0];
      return (
        announcements.find((announcement) => announcement.id === prev.id) ??
        announcements[0]
      );
    });
  }, [announcements]);

  const filteredAnnouncements = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return announcements;
    return announcements.filter(
      (announcement) =>
        announcement.title.toLowerCase().includes(query) ||
        announcement.content.toLowerCase().includes(query) ||
        (announcement.level || "").toLowerCase().includes(query),
    );
  }, [announcements, searchQuery]);

  const handleDelete = React.useCallback(
    async (item: AnnouncementItemDTO): Promise<boolean> => {
      if (!item.id) {
        showToast("This announcement cannot be deleted yet.", "error");
        return false;
      }

      setDeletingId(item.id);
      // Admin uses the same level-scoped endpoints. The backend authorises
      // super_admin to act on any owner's announcement.
      const level = (item.level || "").toUpperCase();
      const result =
        level === "PROPERTY"
          ? await deleteAnnouncementProperty(item.id)
          : await deleteAnnouncementLandlord(item.id);

      if (result.success) {
        setAnnouncements((prev) =>
          prev.filter((announcement) => announcement.id !== item.id),
        );
        setSelected(null);
        showToast("Announcement deleted", "success");
        setDeletingId(null);
        return true;
      }

      showToast(result.error || "Failed to delete announcement", "error");
      setDeletingId(null);
      return false;
    },
    [showToast],
  );

  const requestDelete = React.useCallback((item: AnnouncementItemDTO) => {
    setPendingDelete(item);
  }, []);

  const confirmDelete = React.useCallback(async () => {
    if (!pendingDelete) return;
    const success = await handleDelete(pendingDelete);
    if (success) setPendingDelete(null);
  }, [handleDelete, pendingDelete]);

  return (
    <>
      <Head>
        <title>DWELLA NG · Announcements</title>
      </Head>
      <AdminLayout title="Announcements">
        <section className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-[#E2E8F0] bg-white p-3">
            <div className="flex h-9 w-[420px] items-center gap-2 rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-3">
              <Search className="h-3.5 w-3.5 text-[#64748B]" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="w-full bg-transparent text-xs outline-none placeholder:text-[#94A3B8]"
                placeholder="Search announcements"
              />
            </div>
            <button
              type="button"
              onClick={() => setRefreshKey((key) => key + 1)}
              className="rounded-md bg-[#111827] px-6 py-2 text-xs font-medium text-white"
            >
              Refresh
            </button>
          </div>
          <div className="grid h-[620px] grid-cols-[320px_1fr] gap-3 rounded-lg border border-[#E2E8F0] bg-white p-3">
            <div className="space-y-2 overflow-y-auto border-r border-[#E2E8F0] pr-3">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-[#1E66FF]" />
                </div>
              ) : error ? (
                <p className="rounded-md bg-red-50 p-3 text-xs text-red-700">
                  {error}
                </p>
              ) : filteredAnnouncements.length === 0 ? (
                <p className="rounded-md bg-[#F8FAFC] p-3 text-xs text-[#64748B]">
                  No announcements found.
                </p>
              ) : (
                filteredAnnouncements.map((announcement, index) => (
                  <button
                    key={announcement.id || `${announcement.title}-${index}`}
                    type="button"
                    onClick={() => setSelected(announcement)}
                    className={`w-full cursor-pointer rounded-md border p-2 text-left text-xs ${
                      selected?.id === announcement.id
                        ? "border-[#BFDBFE] bg-[#EFF6FF]"
                        : "border-[#E2E8F0]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium">{announcement.title}</p>
                      <span className="inline-flex items-center rounded-full bg-[#F1F5F9] px-2 py-0.5 text-[10px] font-medium uppercase text-[#475569]">
                        {announcement.level || "—"}
                      </span>
                    </div>
                    <p className="mt-1 text-[#64748B]">
                      {formatRelativeTime(announcement.createdAt)}
                    </p>
                  </button>
                ))
              )}
            </div>
            {selected ? (
              <div className="overflow-y-auto rounded-md border border-[#E2E8F0] p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold">{selected.title}</p>
                    <p className="mt-1 text-xs text-[#64748B]">
                      {formatDateValue(selected.createdAt)} ·{" "}
                      {selected.level || "—"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => selected && requestDelete(selected)}
                    disabled={deletingId === selected.id || !selected.id}
                    className="inline-flex items-center gap-1.5 rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {deletingId === selected.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
                <p className="mt-3 whitespace-pre-line text-sm leading-6 text-[#475569]">
                  {selected.content}
                </p>
                {selected.fileIds && selected.fileIds.length > 0 ? (
                  <p className="mt-4 text-xs text-[#64748B]">
                    Attachments: {selected.fileIds.length}
                  </p>
                ) : null}
              </div>
            ) : (
              <div className="flex items-center justify-center rounded-md border border-[#E2E8F0] p-4">
                <p className="text-sm text-[#64748B]">
                  Select an announcement to view details.
                </p>
              </div>
            )}
          </div>
        </section>
      </AdminLayout>
      <ConfirmDialog
        isOpen={Boolean(pendingDelete)}
        title="Delete announcement?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        isProcessing={
          pendingDelete?.id != null && deletingId === pendingDelete.id
        }
      />
    </>
  );
};

export default AdminAnnouncementsPage;
