import * as React from "react";
import { motion } from "framer-motion";
import { X, Plus } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { mockProperties } from "@/data/mockLandlordData";

const maintenanceRequestSchema = z.object({
  property: z.string().min(1, "Property is required"),
  unit: z.string().min(1, "Unit is required"),
  maintenanceType: z.string().min(1, "Maintenance type is required"),
  maintenanceSubType: z.string().min(1, "Maintenance sub-type is required"),
  priority: z.enum(["low", "medium", "high"]),
  additionalDetails: z.string().optional(),
});

export type MaintenanceRequestFormValues = z.infer<typeof maintenanceRequestSchema>;

export type NewMaintenanceRequestModalProps = {
  isOpen: boolean;
  onClose: () => void;
  propertyId?: string;
};

export const NewMaintenanceRequestModal = ({
  isOpen,
  onClose,
  propertyId,
}: NewMaintenanceRequestModalProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<MaintenanceRequestFormValues>({
    resolver: zodResolver(maintenanceRequestSchema),
    defaultValues: {
      property: propertyId || "",
      priority: "medium",
    },
  });

  const onSubmit = handleSubmit(async (data) => {
    // TODO: Submit maintenance request
    console.log("Maintenance request:", data);
    reset();
    onClose();
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
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-[100] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg border border-gray-200 bg-white p-6 shadow-xl focus:outline-none"
        >
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
            {/* Property */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Property <span className="text-red-500">*</span>
              </label>
              <select
                {...register("property")}
                className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
              >
                <option value="">Placeholder</option>
                {mockProperties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.name}
                  </option>
                ))}
              </select>
              {errors.property && (
                <p className="mt-1 text-xs text-red-600">{errors.property.message}</p>
              )}
            </div>

            {/* Unit */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Unit <span className="text-red-500">*</span>
              </label>
              <select
                {...register("unit")}
                className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
              >
                <option value="">Placeholder</option>
                <option value="A101">A101</option>
                <option value="A102">A102</option>
                <option value="A103">A103</option>
                <option value="B202">B202</option>
                <option value="C305">C305</option>
                <option value="D101">D101</option>
                <option value="E203">E203</option>
              </select>
              {errors.unit && (
                <p className="mt-1 text-xs text-red-600">{errors.unit.message}</p>
              )}
            </div>

            {/* Maintenance Type */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Maintenance Type <span className="text-red-500">*</span>
              </label>
              <select
                {...register("maintenanceType")}
                className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
              >
                <option value="">Placeholder</option>
                <option value="Plumbing">Plumbing</option>
                <option value="Electrical">Electrical</option>
                <option value="HVAC">HVAC</option>
              </select>
              {errors.maintenanceType && (
                <p className="mt-1 text-xs text-red-600">{errors.maintenanceType.message}</p>
              )}
            </div>

            {/* Maintenance Sub-Type */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Maintenance Sub-Type <span className="text-red-500">*</span>
              </label>
              <select
                {...register("maintenanceSubType")}
                className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
              >
                <option value="">Placeholder</option>
                <option value="Leaking Sink">Leaking Sink</option>
                <option value="Faulty Switch">Faulty Switch</option>
                <option value="AC not cooling">AC not cooling</option>
              </select>
              {errors.maintenanceSubType && (
                <p className="mt-1 text-xs text-red-600">{errors.maintenanceSubType.message}</p>
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
                    <span className="text-sm text-gray-700 capitalize">{priority}</span>
                  </label>
                ))}
              </div>
              {errors.priority && (
                <p className="mt-1 text-xs text-red-600">{errors.priority.message}</p>
              )}
            </div>

            {/* Additional Details */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Additional Details (Optional)
              </label>
              <textarea
                {...register("additionalDetails")}
                rows={4}
                placeholder="Provide any additional information about the maintenance request..."
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
              />
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
                className="rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Submit Request
              </button>
            </div>
          </form>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

