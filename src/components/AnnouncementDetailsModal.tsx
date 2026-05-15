import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { motion } from "framer-motion";
import { Trash2, X, Paperclip } from "lucide-react";
import type { AnnouncementItemDTO } from "@/api/announcement";
import { format, parseISO } from "date-fns";

type AnnouncementDetailsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  announcement: AnnouncementItemDTO | null;
  /**
   * When provided, a Delete button is shown in the header. The parent owns
   * confirmation + endpoint dispatch (so the right `landlord` vs `property`
   * route is called based on `announcement.level`). The modal will close once
   * the promise resolves successfully.
   */
  onDelete?: (announcement: AnnouncementItemDTO) => Promise<boolean | void>;
  isDeleting?: boolean;
};

type AnnouncementFile = {
  id?: string;
  url?: string;
  fileName?: string;
  mimeType?: string;
  label?: string;
};

const formatDateValue = (value?: string) => {
  if (!value) return "N/A";
  try {
    return format(parseISO(value), "dd MMM yyyy, h:mm a");
  } catch {
    return value;
  }
};

export const AnnouncementDetailsModal = ({
  isOpen,
  onClose,
  announcement,
  onDelete,
  isDeleting = false,
}: AnnouncementDetailsModalProps) => {
  const handleDelete = React.useCallback(async () => {
    if (!announcement || !onDelete) return;
    const result = await onDelete(announcement);
    if (result !== false) {
      onClose();
    }
  }, [announcement, onClose, onDelete]);

  const canDelete = Boolean(onDelete && announcement?.id);

  const files = React.useMemo(() => {
    const rawFiles = (announcement as { files?: unknown } | null)?.files;
    if (!Array.isArray(rawFiles)) return [] as AnnouncementFile[];

    return rawFiles
      .filter(
        (file): file is Record<string, unknown> =>
          !!file && typeof file === "object",
      )
      .map((file) => ({
        id: typeof file.id === "string" ? file.id : undefined,
        url: typeof file.url === "string" ? file.url : undefined,
        fileName: typeof file.fileName === "string" ? file.fileName : undefined,
        mimeType: typeof file.mimeType === "string" ? file.mimeType : undefined,
        label: typeof file.label === "string" ? file.label : undefined,
      }));
  }, [announcement]);

  if (!announcement) return null;

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
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[100] max-h-[90vh] w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border border-gray-200 bg-white p-6 shadow-xl focus:outline-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.2 }}
          >
            <div className="mb-6 flex items-center justify-between gap-3">
              <Dialog.Title className="text-xl font-bold text-gray-900">
                Announcement Details
              </Dialog.Title>
              <div className="flex items-center gap-2">
                {canDelete ? (
                  <button
                    type="button"
                    onClick={() => void handleDelete()}
                    disabled={isDeleting}
                    className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {isDeleting ? "Deleting..." : "Delete"}
                  </button>
                ) : null}
                <Dialog.Close asChild>
                  <button
                    type="button"
                    className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-red-600"
                    aria-label="Close announcement details"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </Dialog.Close>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Title
                </p>
                <p className="mt-1 text-base font-semibold text-gray-900">
                  {announcement.title}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Message
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                  {announcement.content}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Level
                  </p>
                  <p className="mt-1 text-sm text-gray-800">
                    {announcement.level || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Created At
                  </p>
                  <p className="mt-1 text-sm text-gray-800">
                    {formatDateValue(announcement.createdAt)}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Attachments
                </p>

                {files.length > 0 ? (
                  <div className="mt-2 space-y-2">
                    {files.map((file, index) => (
                      <div
                        key={file.id || `${file.fileName || "file"}-${index}`}
                        className="flex items-center justify-between gap-3 rounded-md border border-gray-200 bg-gray-50 px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-gray-900">
                            {file.fileName ||
                              file.label ||
                              file.id ||
                              "Attachment"}
                          </p>
                          {file.mimeType ? (
                            <p className="text-xs text-gray-500">
                              {file.mimeType}
                            </p>
                          ) : null}
                        </div>
                        {file.url ? (
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-100"
                          >
                            <Paperclip className="h-3.5 w-3.5" />
                            Open
                          </a>
                        ) : (
                          <span className="text-xs text-gray-500">
                            Preview unavailable
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : announcement.fileIds && announcement.fileIds.length > 0 ? (
                  <div className="mt-2 rounded-md border border-gray-200 bg-gray-50 p-3">
                    <p className="text-xs text-gray-600">
                      Attachments are available but cannot be previewed here.
                    </p>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-gray-500">No attachments.</p>
                )}
              </div>
            </div>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
