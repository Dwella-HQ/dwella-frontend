import * as React from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  updateMaintenanceRequest,
  getMaintenanceRequestTypes,
} from "@/api/maintenance";
import type {
  MaintenanceRequestItemDTO,
  MaintenanceRequestTypeDTO,
} from "@/api/maintenance";

const editMaintenanceSchema = z.object({
  maintenanceType: z.string().min(1, "Type is required"),
  maintenanceSubType: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]),
  title: z.string().min(1, "Title is required"),
  additionalDetails: z.string().min(1, "Description is required"),
});

type EditMaintenanceFormValues = z.infer<typeof editMaintenanceSchema>;

function formatLabel(value: string): string {
  return value
    .replace(/_/g, " ")
    .replace(/\bac\b/gi, "AC")
    .replace(/\bhvac\b/gi, "HVAC")
    .replace(/\b[a-z]/g, (m) => m.toUpperCase());
}

export type EditMaintenanceRequestModalProps = {
  isOpen: boolean;
  onClose: () => void;
  requestId: string;
  initialRequest: MaintenanceRequestItemDTO;
  onSuccess: (updated: MaintenanceRequestItemDTO) => void;
};

function extractTypeName(
  value: string | { name?: string } | undefined,
): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && value !== null && "name" in value) {
    const n = (value as { name?: unknown }).name;
    return typeof n === "string" ? n : "";
  }
  return "";
}

export const EditMaintenanceRequestModal = ({
  isOpen,
  onClose,
  requestId,
  initialRequest,
  onSuccess,
}: EditMaintenanceRequestModalProps) => {
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [requestTypes, setRequestTypes] = React.useState<
    MaintenanceRequestTypeDTO[]
  >([]);
  const [typesLoading, setTypesLoading] = React.useState(false);

  const typeName = extractTypeName(initialRequest.type);
  const subTypeStr = extractTypeName(
    initialRequest.subType ?? initialRequest.sub_type,
  );

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<EditMaintenanceFormValues>({
    resolver: zodResolver(editMaintenanceSchema),
    defaultValues: {
      maintenanceType: typeName || "",
      maintenanceSubType: subTypeStr || "",
      priority: (initialRequest.priority ?? "medium").toLowerCase() as
        | "low"
        | "medium"
        | "high",
      title: initialRequest.title ?? "",
      additionalDetails: initialRequest.description ?? "",
    },
  });

  const selectedMaintenanceType = watch("maintenanceType");
  const selectedType = React.useMemo(
    () =>
      requestTypes.find(
        (t) =>
          t.name === selectedMaintenanceType ||
          t.name?.toLowerCase() === selectedMaintenanceType?.toLowerCase(),
      ),
    [requestTypes, selectedMaintenanceType],
  );
  const subTypeOptions = selectedType?.subTypes ?? [];

  React.useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setTypesLoading(true);
    getMaintenanceRequestTypes()
      .then((result) => {
        if (cancelled) return;
        if (result.success) setRequestTypes(result.data);
      })
      .finally(() => {
        if (!cancelled) setTypesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  React.useEffect(() => {
    if (isOpen && initialRequest) {
      const nextTypeName = extractTypeName(initialRequest.type);
      const nextSubTypeStr = extractTypeName(
        initialRequest.subType ?? initialRequest.sub_type,
      );
      reset({
        maintenanceType: nextTypeName || "",
        maintenanceSubType: nextSubTypeStr || "",
        priority: (initialRequest.priority ?? "medium").toLowerCase() as
          | "low"
          | "medium"
          | "high",
        title: initialRequest.title ?? "",
        additionalDetails: initialRequest.description ?? "",
      });
      setSubmitError(null);
    }
  }, [isOpen, initialRequest, reset]);

  React.useEffect(() => {
    if (!selectedMaintenanceType) setValue("maintenanceSubType", "");
  }, [selectedMaintenanceType, setValue]);

  const onSubmit = handleSubmit(async (data) => {
    setSubmitError(null);
    setIsSubmitting(true);
    const priorityMap = { low: "LOW", medium: "MEDIUM", high: "HIGH" } as const;
    const result = await updateMaintenanceRequest(requestId, {
      type:
        typeof data.maintenanceType === "string"
          ? data.maintenanceType.toLowerCase()
          : "",
      priority: priorityMap[data.priority],
      subType: data.maintenanceSubType || undefined,
      title: data.title,
      description: data.additionalDetails,
    });
    setIsSubmitting(false);
    if (result.success) {
      onSuccess(result.data);
      onClose();
    } else {
      setSubmitError(result.error ?? "Failed to update request");
    }
  });

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay asChild>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50"
          />
        </Dialog.Overlay>
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[100] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg border border-gray-200 bg-white p-6 shadow-xl focus:outline-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <div className="flex items-center justify-between mb-4">
              <Dialog.Title className="text-xl font-bold text-gray-900">
                Edit Maintenance Request
              </Dialog.Title>
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </Dialog.Close>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              {submitError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {submitError}
                </div>
              )}

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Type <span className="text-red-500">*</span>
                </label>
                <select
                  {...register("maintenanceType")}
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-main"
                >
                  <option value="">
                    {typesLoading ? "Loading types…" : "Select type"}
                  </option>
                  {requestTypes.map((type) => (
                    <option key={type.id} value={type.name}>
                      {formatLabel(type.name)}
                    </option>
                  ))}
                </select>
                {errors.maintenanceType && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.maintenanceType.message}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Sub-type
                </label>
                <select
                  {...register("maintenanceSubType")}
                  disabled={!selectedType || subTypeOptions.length === 0}
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-main disabled:bg-gray-50 disabled:text-gray-500"
                >
                  <option value="">
                    {selectedType && subTypeOptions.length > 0
                      ? "Select sub-type"
                      : "No sub-types for this type"}
                  </option>
                  {subTypeOptions.map((sub) => (
                    <option key={sub.id} value={sub.name}>
                      {formatLabel(sub.name)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Priority <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-4">
                  {(["low", "medium", "high"] as const).map((p) => (
                    <label
                      key={p}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="radio"
                        {...register("priority")}
                        value={p}
                        className="h-4 w-4 text-brand-main focus:ring-brand-main"
                      />
                      <span className="text-sm text-gray-700 capitalize">
                        {p}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register("title")}
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-main"
                />
                {errors.title && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.title.message}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  {...register("additionalDetails")}
                  rows={4}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-main"
                />
                {errors.additionalDetails && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.additionalDetails.message}
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-gray-300 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-70"
                >
                  {isSubmitting ? "Saving…" : "Save changes"}
                </button>
              </div>
            </form>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
