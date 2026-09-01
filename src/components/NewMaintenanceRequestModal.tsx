import * as React from "react";
import { motion } from "framer-motion";
import { X, Plus } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  getMaintenanceRequestTypes,
  type MaintenanceRequestTypeDTO,
} from "@/api/maintenance";
import { getUnitsByProperty } from "@/api/units";

const maintenanceRequestSchema = z.object({
  property: z.string().min(1, "Property is required"),
  unit: z.string().min(1, "Unit is required"),
  maintenanceType: z.string().min(1, "Maintenance type is required"),
  maintenanceSubType: z.string().min(1, "Maintenance sub-type is required"),
  priority: z.enum(["low", "medium", "high"]),
  additionalDetails: z.string().min(1, "Additional details are required"),
});

export type MaintenanceRequestFormValues = z.infer<
  typeof maintenanceRequestSchema
>;

export type NewMaintenanceRequestModalProps = {
  isOpen: boolean;
  onClose: () => void;
  propertyId?: string;
  /** List of properties for dropdown */
  properties?: Array<{ id: string; name: string }>;
  properties?: Array<{ id: string; name: string }>;
  /** When provided, modal calls this to create the request (e.g. landlord flow); unit value is unit id when units are loaded from API */
  onSubmitRequest?: (data: {
    propertyId: string;
    unitId: string;
    maintenanceType: string;
    maintenanceSubType: string;
    priority: string;
    additionalDetails: string;
  }) => Promise<void>;
};

export const NewMaintenanceRequestModal = ({
  isOpen,
  onClose,
  propertyId,
  properties = [],
  onSubmitRequest,
}: NewMaintenanceRequestModalProps) => {
  const [units, setUnits] = React.useState<Array<{ id: string; name: string }>>(
    [],
  );
  const [unitsLoading, setUnitsLoading] = React.useState(false);
  const [requestTypes, setRequestTypes] = React.useState<
    MaintenanceRequestTypeDTO[]
  >([]);
  const [typesLoading, setTypesLoading] = React.useState(false);
  const [typesError, setTypesError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<MaintenanceRequestFormValues>({
    resolver: zodResolver(maintenanceRequestSchema),
    defaultValues: {
      property: propertyId || "",
      unit: "",
      priority: "medium",
    },
  });

  const selectedPropertyId = watch("property");
  const selectedMaintenanceType = watch("maintenanceType");

  const propertyOptions = React.useMemo(() => {
    if (propertyId && !properties.some((p) => p.id === propertyId)) {
      return [{ id: propertyId, name: "This property" }, ...properties];
    }
    return properties;
  }, [properties, propertyId]);

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

  const selectedType = React.useMemo(
    () => requestTypes.find((t) => t.id === selectedMaintenanceType),
    [requestTypes, selectedMaintenanceType],
  );

  const formatLabel = (value: string) =>
    value
      .replace(/_/g, " ")
      .replace(/\bac\b/gi, "AC")
      .replace(/\bhvac\b/gi, "HVAC")
      .replace(/\b[a-z]/g, (m) => m.toUpperCase());

  React.useEffect(() => {
    if (!selectedPropertyId) {
      setUnits([]);
      setValue("unit", "");
      return;
    }
    let cancelled = false;
    setUnitsLoading(true);
    getUnitsByProperty(selectedPropertyId).then((result) => {
      if (cancelled) return;
      if (result.success) {
        setUnits(result.data.map((u) => ({ id: u.id, name: u.name })));
        setValue("unit", "");
      } else {
        setUnits([]);
      }
      setUnitsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [selectedPropertyId, setValue]);

  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const onSubmit = handleSubmit(async (data) => {
    setSubmitError(null);
    if (onSubmitRequest) {
      setIsSubmitting(true);
      try {
        const selectedType = requestTypes.find(
          (t) => t.id === data.maintenanceType,
        );
        const selectedSubType = selectedType?.subTypes?.find(
          (s) => s.id === data.maintenanceSubType,
        );
        const typeName = selectedType?.name ?? "";
        const subTypeName = selectedSubType?.name ?? "";
        await onSubmitRequest({
          propertyId: data.property,
          unitId: data.unit,
          maintenanceType: typeName,
          maintenanceSubType: subTypeName,
          priority: data.priority,
          additionalDetails: data.additionalDetails,
        });
        reset();
        onClose();
      } catch (err) {
        setSubmitError(
          err instanceof Error ? err.message : "Failed to submit request",
        );
      } finally {
        setIsSubmitting(false);
      }
    } else {
      reset();
      onClose();
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
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[100] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg border border-gray-200 bg-white p-6 shadow-xl focus:outline-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <Dialog.Title className="text-xl font-bold text-gray-900">
                  New Maintenance Request
                </Dialog.Title>
                <Dialog.Description className="mt-1 text-sm text-gray-600">
                  Submit a maintenance request for a unit
                </Dialog.Description>
              </div>
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </Dialog.Close>
            </div>

            {/* Form */}
            <form onSubmit={onSubmit} className="space-y-4">
              {submitError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {submitError}
                </div>
              )}
              {/* Property */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Property <span className="text-red-500">*</span>
                </label>
                <select
                  {...register("property")}
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-brand-main"
                >
                  <option value="">Select property</option>
                  {propertyOptions.length === 0 ? (
                    <option value="" disabled>
                      No properties available
                    </option>
                  ) : (
                    propertyOptions.map((property) => (
                      <option key={property.id} value={property.id}>
                        {property.name}
                      </option>
                    ))
                  )}
                </select>
                {errors.property && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.property.message}
                  </p>
                )}
              </div>

              {/* Unit */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Unit <span className="text-red-500">*</span>
                </label>
                <select
                  {...register("unit")}
                  disabled={unitsLoading || !selectedPropertyId}
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-brand-main disabled:bg-gray-50 disabled:text-gray-500"
                >
                  <option value="">
                    {!selectedPropertyId
                      ? "Select property first"
                      : unitsLoading
                        ? "Loading units…"
                        : "Select unit"}
                  </option>
                  {units.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.name}
                    </option>
                  ))}
                </select>
                {errors.unit && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.unit.message}
                  </p>
                )}
              </div>

              {/* Maintenance Type */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Maintenance Type <span className="text-red-500">*</span>
                </label>
                <select
                  {...register("maintenanceType")}
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-brand-main"
                >
                  <option value="">
                    {typesLoading
                      ? "Loading types…"
                      : typesError
                        ? "Unable to load types"
                        : "Select type"}
                  </option>
                  {requestTypes.map((type) => (
                    <option key={type.id} value={type.id}>
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

              {/* Maintenance Sub-Type */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Maintenance Sub-Type <span className="text-red-500">*</span>
                </label>
                <select
                  {...register("maintenanceSubType")}
                  disabled={
                    !selectedType || (selectedType?.subTypes?.length ?? 0) === 0
                  }
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-brand-main disabled:bg-gray-50 disabled:text-gray-500"
                >
                  <option value="">
                    {selectedType && (selectedType.subTypes?.length ?? 0) > 0
                      ? "Select sub-type"
                      : "No sub-types"}
                  </option>
                  {selectedType?.subTypes?.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {formatLabel(sub.name)}
                    </option>
                  ))}
                </select>
                {errors.maintenanceSubType && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.maintenanceSubType.message}
                  </p>
                )}
              </div>

              {/* Priority */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Priority <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-4">
                  {(["low", "medium", "high"] as const).map((priority) => (
                    <label
                      key={priority}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="radio"
                        {...register("priority")}
                        value={priority}
                        className="h-4 w-4 text-brand-main focus:ring-brand-main"
                      />
                      <span className="text-sm text-gray-700 capitalize">
                        {priority}
                      </span>
                    </label>
                  ))}
                </div>
                {errors.priority && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.priority.message}
                  </p>
                )}
              </div>

              {/* Additional Details */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Additional Details <span className="text-red-500">*</span>
                </label>
                <textarea
                  {...register("additionalDetails")}
                  rows={4}
                  placeholder="Provide any additional information about the maintenance request..."
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-brand-main"
                />
                {errors.additionalDetails && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.additionalDetails.message}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4">
                <Dialog.Close asChild>
                  <button
                    type="button"
                    className="rounded-lg border border-gray-300 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </Dialog.Close>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <Plus className="h-4 w-4" />
                  {isSubmitting ? "Submitting…" : "Submit Request"}
                </button>
              </div>
            </form>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
