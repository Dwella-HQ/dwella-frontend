import * as React from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Check, AlertCircle } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { updateUnit } from "@/api/units";
import { useToast } from "@/components/Toast";

const editUnitSchema = z.object({
  name: z.string().min(1, "Unit name is required"),
  rentAmount: z.string().min(1, "Rent is required"),
  numberOfBedrooms: z.string().min(1, "Bedrooms is required"),
  numberOfBathrooms: z.string().min(1, "Bathrooms is required"),
  isAvailable: z.boolean(),
});

export type EditUnitFormValues = z.infer<typeof editUnitSchema>;

export type EditUnitModalProps = {
  isOpen: boolean;
  onClose: () => void;
  /** API unit UUID */
  unitApiId: string;
  initial: {
    name: string;
    rentAmount: number;
    numberOfBedrooms: number;
    numberOfBathrooms: number;
    isAvailable: boolean;
  };
  onSuccess?: () => void;
};

function formatRentInput(n: number): string {
  if (!Number.isFinite(n) || n < 0) return "";
  return n.toLocaleString("en-NG");
}

export const EditUnitModal = ({
  isOpen,
  onClose,
  unitApiId,
  initial,
  onSuccess,
}: EditUnitModalProps) => {
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<EditUnitFormValues>({
    resolver: zodResolver(editUnitSchema),
    defaultValues: {
      name: initial.name,
      rentAmount: formatRentInput(initial.rentAmount),
      numberOfBedrooms: String(initial.numberOfBedrooms),
      numberOfBathrooms: String(initial.numberOfBathrooms),
      isAvailable: initial.isAvailable,
    },
  });

  const isAvailable = watch("isAvailable");

  React.useEffect(() => {
    if (isOpen) {
      reset({
        name: initial.name,
        rentAmount: formatRentInput(initial.rentAmount),
        numberOfBedrooms: String(initial.numberOfBedrooms),
        numberOfBathrooms: String(initial.numberOfBathrooms),
        isAvailable: initial.isAvailable,
      });
      setSubmitError(null);
    }
  }, [isOpen, initial, reset]);

  const onSubmit = handleSubmit(async (data) => {
    if (!unitApiId) return;
    setIsSubmitting(true);
    setSubmitError(null);

    const rentAmount = Number(data.rentAmount.replace(/\D/g, "")) || 0;
    const numberOfBedrooms = parseInt(data.numberOfBedrooms, 10);
    const numberOfBathrooms = parseInt(data.numberOfBathrooms, 10);

    if (rentAmount <= 0) {
      setSubmitError("Enter a valid rent amount.");
      setIsSubmitting(false);
      return;
    }
    if (!Number.isFinite(numberOfBedrooms) || numberOfBedrooms < 0) {
      setSubmitError("Enter a valid bedroom count.");
      setIsSubmitting(false);
      return;
    }
    if (!Number.isFinite(numberOfBathrooms) || numberOfBathrooms < 0) {
      setSubmitError("Enter a valid bathroom count.");
      setIsSubmitting(false);
      return;
    }

    const result = await updateUnit(unitApiId, {
      name: data.name.trim(),
      rentAmount,
      numberOfBedrooms,
      numberOfBathrooms,
      isAvailable: data.isAvailable,
    });

    if (result.success) {
      showToast("Unit updated successfully", "success");
      onSuccess?.();
      onClose();
    } else {
      const message = result.error || "Failed to update unit";
      setSubmitError(message);
      showToast(message, "error");
    }
    setIsSubmitting(false);
  });

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
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
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Dialog.Close asChild>
                  <button
                    type="button"
                    className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                </Dialog.Close>
                <div>
                  <Dialog.Title className="text-xl font-bold text-gray-900">
                    Edit Unit
                  </Dialog.Title>
                  <Dialog.Description className="mt-1 text-sm text-gray-600">
                    Update unit details and availability.
                  </Dialog.Description>
                </div>
              </div>
              <button
                type="submit"
                form="edit-unit-form"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Save
                  </>
                )}
              </button>
            </div>

            <form id="edit-unit-form" onSubmit={onSubmit} className="space-y-6">
              {submitError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{submitError}</p>
                </div>
              )}

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Unit name
                </label>
                <input
                  type="text"
                  {...register("name")}
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Monthly rent (₦)
                </label>
                <Controller
                  name="rentAmount"
                  control={control}
                  render={({ field }) => (
                    <input
                      type="text"
                      inputMode="numeric"
                      value={field.value}
                      onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, "");
                        field.onChange(
                          v === "" ? "" : Number(v).toLocaleString("en-NG"),
                        );
                      }}
                      className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
                    />
                  )}
                />
                {errors.rentAmount && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.rentAmount.message}
                  </p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Bedrooms
                  </label>
                  <input
                    type="number"
                    min={0}
                    {...register("numberOfBedrooms")}
                    className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
                  />
                  {errors.numberOfBedrooms && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.numberOfBedrooms.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Bathrooms
                  </label>
                  <input
                    type="number"
                    min={0}
                    {...register("numberOfBathrooms")}
                    className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
                  />
                  {errors.numberOfBathrooms && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.numberOfBathrooms.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    {...register("isAvailable")}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-brand-main focus:ring-brand-main"
                  />
                  <span className="text-sm text-gray-700">
                    Available for rent
                    <span className="mt-1 block text-xs text-gray-500">
                      Uncheck if the unit is occupied or not listed.
                    </span>
                  </span>
                </label>
                <p className="mt-2 text-xs text-gray-600">
                  Status:{" "}
                  <span className="font-medium text-gray-900">
                    {isAvailable ? "Vacant" : "Occupied / unavailable"}
                  </span>
                </p>
              </div>
            </form>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
