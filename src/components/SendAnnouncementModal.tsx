import * as React from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import * as Dialog from "@radix-ui/react-dialog";
import { uploadFile } from "@/api/files";
import { useUser } from "@/contexts/UserContext";

const sendAnnouncementSchema = z.object({
  title: z.string().min(1, "Title is required"),
  message: z.string().min(1, "Message is required"),
  propertyIds: z.array(z.string()),
  // API requires `fileIds` (can be empty); keep as plain strings so upload IDs always validate.
  fileIds: z.array(z.string()),
});

export type SendAnnouncementFormValues = z.infer<typeof sendAnnouncementSchema>;

export type AnnouncementPropertyOption = {
  id: string;
  name: string;
  address?: string;
};

export type SendAnnouncementModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSend?: (data: SendAnnouncementFormValues) => Promise<void> | void;
  propertyOptions?: AnnouncementPropertyOption[];
  requirePropertySelection?: boolean;
};

export const SendAnnouncementModal = ({
  isOpen,
  onClose,
  onSend,
  propertyOptions = [],
  requirePropertySelection = false,
}: SendAnnouncementModalProps) => {
  const { user } = useUser();
  const [isSending, setIsSending] = React.useState(false);
  const [propertyError, setPropertyError] = React.useState("");
  const [selectedPropertyIds, setSelectedPropertyIds] = React.useState<
    string[]
  >([]);
  const [attachments, setAttachments] = React.useState<
    {
      localId: string;
      name: string;
      progress: number;
      fileId?: string;
      error?: string;
      isUploading: boolean;
    }[]
  >([]);
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<SendAnnouncementFormValues>({
    resolver: zodResolver(sendAnnouncementSchema),
    defaultValues: {
      title: "",
      message: "",
      propertyIds: [],
      fileIds: [],
    },
  });

  React.useEffect(() => {
    if (!isOpen) return;
    const nextPropertyIds = propertyOptions.map((property) => property.id);
    setSelectedPropertyIds(nextPropertyIds);
    setValue("propertyIds", nextPropertyIds);
    setPropertyError("");
  }, [isOpen, propertyOptions, setValue]);

  const uploadedFileIds = React.useMemo(() => {
    return attachments
      .map((a) => a.fileId)
      .filter((v): v is string => typeof v === "string" && v.length > 0);
  }, [attachments]);

  React.useEffect(() => {
    setValue("fileIds", uploadedFileIds);
  }, [setValue, uploadedFileIds]);

  React.useEffect(() => {
    setValue("propertyIds", selectedPropertyIds);
    if (selectedPropertyIds.length > 0) {
      setPropertyError("");
    }
  }, [selectedPropertyIds, setValue]);

  const toggleProperty = React.useCallback((propertyId: string) => {
    setSelectedPropertyIds((prev) =>
      prev.includes(propertyId)
        ? prev.filter((id) => id !== propertyId)
        : [...prev, propertyId],
    );
  }, []);

  const toggleAllProperties = React.useCallback(() => {
    setSelectedPropertyIds((prev) =>
      prev.length === propertyOptions.length
        ? []
        : propertyOptions.map((property) => property.id),
    );
  }, [propertyOptions]);

  const handleFilesSelected = React.useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files ?? []);
      if (files.length === 0) return;

      // reset the input so selecting the same file again triggers change
      event.target.value = "";

      for (const file of files) {
        const localId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
        setAttachments((prev) => [
          ...prev,
          {
            localId,
            name: file.name,
            progress: 0,
            isUploading: true,
          },
        ]);

        const result = await uploadFile({
          file,
          folder: "announcement",
          label: "announcement_file",
          token: user?.token,
          onProgress: (percent) => {
            setAttachments((prev) =>
              prev.map((a) =>
                a.localId === localId ? { ...a, progress: percent } : a,
              ),
            );
          },
        });

        if (result.success) {
          setAttachments((prev) =>
            prev.map((a) =>
              a.localId === localId
                ? { ...a, fileId: result.data.id, isUploading: false }
                : a,
            ),
          );
        } else {
          setAttachments((prev) =>
            prev.map((a) =>
              a.localId === localId
                ? { ...a, error: result.error, isUploading: false }
                : a,
            ),
          );
        }
      }
    },
    [user?.token],
  );

  const handleRemoveAttachment = React.useCallback((localId: string) => {
    setAttachments((prev) => prev.filter((a) => a.localId !== localId));
  }, []);

  const onSubmit = handleSubmit(async (data) => {
    if (!onSend) {
      // No handler wired yet; do nothing visible to avoid false success.
      return;
    }

    if (requirePropertySelection && selectedPropertyIds.length === 0) {
      setPropertyError("Select at least one property.");
      return;
    }

    // Prevent sending while uploads are in-flight or failed
    const hasUploading = attachments.some((a) => a.isUploading);
    const hasFailed = attachments.some((a) => a.error);
    if (hasUploading || hasFailed) {
      return;
    }

    setIsSending(true);
    try {
      await onSend({ ...data, propertyIds: selectedPropertyIds });
      reset();
      setSelectedPropertyIds([]);
      setAttachments([]);
      onClose();
    } catch {
      // Caller should show a toast; keep modal open for user to retry/edit.
    } finally {
      setIsSending(false);
    }
  });

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
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[100] max-h-[90vh] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border border-gray-200 bg-white p-6 shadow-xl focus:outline-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <Dialog.Title className="text-xl font-bold text-gray-900">
                Send Announcement
              </Dialog.Title>
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-red-600 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </Dialog.Close>
            </div>

            <form onSubmit={onSubmit} className="space-y-6">
              {/* Title */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Title
                </label>
                <input
                  placeholder="e.g. Water supply update"
                  {...register("title")}
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
                />
                {errors.title && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.title.message}
                  </p>
                )}
              </div>

              {/* Message */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Message body
                </label>
                <textarea
                  placeholder="Write your announcement..."
                  rows={8}
                  {...register("message")}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
                />
                {errors.message && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.message.message}
                  </p>
                )}
              </div>

              {(propertyOptions.length > 0 || requirePropertySelection) && (
                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Properties
                    </label>
                    {propertyOptions.length > 0 ? (
                      <button
                        type="button"
                        onClick={toggleAllProperties}
                        disabled={isSending}
                        className="text-xs font-semibold text-brand-main transition hover:text-brand-main/80 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {selectedPropertyIds.length === propertyOptions.length
                          ? "Clear all"
                          : "Select all"}
                      </button>
                    ) : null}
                  </div>
                  {propertyOptions.length > 0 ? (
                    <div className="max-h-44 space-y-2 overflow-y-auto rounded-lg border border-gray-200 bg-white p-2">
                      {propertyOptions.map((property) => {
                        const checked = selectedPropertyIds.includes(
                          property.id,
                        );
                        return (
                          <label
                            key={property.id}
                            className="flex cursor-pointer items-start gap-3 rounded-md px-2 py-2 transition hover:bg-gray-50"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleProperty(property.id)}
                              disabled={isSending}
                              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-main focus:ring-brand-main"
                            />
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-medium text-gray-900">
                                {property.name}
                              </span>
                              {property.address ? (
                                <span className="block truncate text-xs text-gray-500">
                                  {property.address}
                                </span>
                              ) : null}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500">
                      No properties available.
                    </div>
                  )}
                  {propertyError ? (
                    <p className="mt-1 text-xs text-red-600">
                      {propertyError}
                    </p>
                  ) : null}
                  {errors.propertyIds && (
                    <p className="mt-1 text-xs text-red-600">
                      Invalid property selection
                    </p>
                  )}
                </div>
              )}

              {/* Attachments */}
              <div>
                <div className="flex items-center justify-between gap-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Attach images (optional)
                  </label>
                  <label className="inline-flex cursor-pointer items-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleFilesSelected}
                      disabled={isSending}
                    />
                    Add images
                  </label>
                </div>

                {attachments.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {attachments.map((a) => (
                      <div
                        key={a.localId}
                        className="rounded-lg border border-gray-200 bg-white px-3 py-2"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-xs font-medium text-gray-900">
                              {a.name}
                            </p>
                            {a.isUploading ? (
                              <p className="text-[11px] text-gray-500">
                                Uploading... {a.progress}%
                              </p>
                            ) : a.error ? (
                              <p className="text-[11px] text-red-600">
                                {a.error}
                              </p>
                            ) : (
                              <p className="text-[11px] text-green-700">
                                Uploaded
                              </p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveAttachment(a.localId)}
                            className="rounded-md p-1 text-gray-400 transition hover:bg-gray-100 hover:text-red-600"
                            disabled={isSending}
                            aria-label="Remove attachment"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        {a.isUploading && (
                          <div className="mt-2 h-1.5 w-full rounded-full bg-gray-200">
                            <div
                              className="h-1.5 rounded-full bg-brand-main"
                              style={{ width: `${a.progress}%` }}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {errors.fileIds && (
                  <p className="mt-1 text-xs text-red-600">
                    Invalid attachment(s)
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSending}
                  className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    isSending ||
                    attachments.some((a) => a.isUploading) ||
                    attachments.some((a) => a.error)
                  }
                  className="flex-1 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
                >
                  {isSending ? "Sending..." : "Send"}
                </button>
              </div>
            </form>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
