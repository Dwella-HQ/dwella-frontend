import * as React from "react";
import { motion } from "framer-motion";
import { X, Upload, Plus } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

const addTenantSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  dateOfBirth: z.string().optional(),
  idType: z.string().optional(),
  idNumber: z.string().optional(),
  employed: z.string().optional(),
  employerName: z.string().optional(),
  property: z.string().min(1, "Property is required"),
  unit: z.string().min(1, "Unit is required"),
  rentAmount: z.string().min(1, "Rent amount is required"),
  cautionFee: z.string().optional(),
  leaseStartDate: z.string().min(1, "Lease start date is required"),
  leaseEndDate: z.string().min(1, "Lease end date is required"),
  emergencyContactName: z.string().optional(),
  emergencyContactRelationship: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  sendWelcomeEmail: z.boolean().optional(),
});

export type AddTenantFormValues = z.infer<typeof addTenantSchema>;

export type AddTenantModalProps = {
  isOpen: boolean;
  onClose: () => void;
  propertyId?: string;
  unitId?: string;
};

export const AddTenantModal = ({
  isOpen,
  onClose,
  propertyId,
  unitId,
}: AddTenantModalProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AddTenantFormValues>({
    resolver: zodResolver(addTenantSchema),
    defaultValues: {
      property: propertyId || "",
      unit: unitId || "",
      sendWelcomeEmail: true,
    },
  });

  const onSubmit = handleSubmit(async (data) => {
    // TODO: Submit tenant data
    console.log("Add tenant:", data);
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
          className="fixed left-1/2 top-1/2 z-[100] max-h-[90vh] w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border border-gray-200 bg-white p-6 shadow-xl focus:outline-none"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <Dialog.Title className="text-xl font-bold text-gray-900">
                Add Tenant
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-gray-600">
                Fill in tenant information and lease details.
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
          <form onSubmit={onSubmit} className="space-y-6">
            {/* Tenant Information */}
            <div>
              <h3 className="mb-4 text-sm font-semibold uppercase text-gray-700">
                Tenant Information
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="Placeholder"
                    {...register("fullName")}
                    className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
                  />
                  {errors.fullName && (
                    <p className="mt-1 text-xs text-red-600">{errors.fullName.message}</p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="Placeholder"
                    {...register("email")}
                    className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="Placeholder"
                    {...register("phoneNumber")}
                    className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
                  />
                  {errors.phoneNumber && (
                    <p className="mt-1 text-xs text-red-600">{errors.phoneNumber.message}</p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    placeholder="Placeholder"
                    {...register("dateOfBirth")}
                    className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Id Type
                  </label>
                  <select
                    {...register("idType")}
                    className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
                  >
                    <option value="">Placeholder</option>
                    <option value="NIN">NIN</option>
                    <option value="Driver's License">Driver's License</option>
                    <option value="International Passport">International Passport</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Id Number
                  </label>
                  <input
                    type="text"
                    placeholder="Placeholder"
                    {...register("idNumber")}
                    className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Employed?
                  </label>
                  <select
                    {...register("employed")}
                    className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
                  >
                    <option value="">Placeholder</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Employer Name
                  </label>
                  <input
                    type="text"
                    placeholder="Placeholder"
                    {...register("employerName")}
                    className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
                  />
                </div>
              </div>

              {/* Upload ID Document */}
              <div className="mt-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Upload ID Document
                </label>
                <div className="flex h-32 w-full items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50">
                  <div className="text-center">
                    <Upload className="mx-auto h-8 w-8 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-600">Click to upload ID documents</p>
                    <p className="mt-1 text-xs text-gray-500">
                      PNG, JPG, PDF up to 5MB
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Lease Information */}
            <div>
              <h3 className="mb-4 text-sm font-semibold uppercase text-gray-700">
                Lease Information
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Property <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register("property")}
                    className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
                  >
                    <option value="">Placeholder</option>
                    <option value="1">Harmony Court - 3BR Duplex</option>
                  </select>
                  {errors.property && (
                    <p className="mt-1 text-xs text-red-600">{errors.property.message}</p>
                  )}
                </div>
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
                  </select>
                  {errors.unit && (
                    <p className="mt-1 text-xs text-red-600">{errors.unit.message}</p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Rent Amount
                  </label>
                  <input
                    type="text"
                    placeholder="Placeholder"
                    {...register("rentAmount")}
                    className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
                  />
                  {errors.rentAmount && (
                    <p className="mt-1 text-xs text-red-600">{errors.rentAmount.message}</p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Caution Fee
                  </label>
                  <input
                    type="text"
                    placeholder="Placeholder"
                    {...register("cautionFee")}
                    className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Lease Start Date
                  </label>
                  <input
                    type="date"
                    placeholder="Placeholder"
                    {...register("leaseStartDate")}
                    className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
                  />
                  {errors.leaseStartDate && (
                    <p className="mt-1 text-xs text-red-600">{errors.leaseStartDate.message}</p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Lease End Date
                  </label>
                  <input
                    type="date"
                    placeholder="Placeholder"
                    {...register("leaseEndDate")}
                    className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
                  />
                  {errors.leaseEndDate && (
                    <p className="mt-1 text-xs text-red-600">{errors.leaseEndDate.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div>
              <h3 className="mb-4 text-sm font-semibold uppercase text-gray-700">
                Emergency Contact
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="Placeholder"
                    {...register("emergencyContactName")}
                    className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Relationship
                  </label>
                  <select
                    {...register("emergencyContactRelationship")}
                    className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
                  >
                    <option value="">Placeholder</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Parent">Parent</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Friend">Friend</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="Placeholder"
                    {...register("emergencyContactPhone")}
                    className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex flex-col gap-4 border-t border-gray-200 pt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  {...register("sendWelcomeEmail")}
                  className="h-4 w-4 rounded border-gray-300 text-brand-main focus:ring-brand-main"
                />
                <span className="text-xs text-gray-700">
                  Send welcome email and payment link to tenant
                </span>
              </label>
              <div className="flex gap-3">
                <Dialog.Close asChild>
                  <button
                    type="button"
                    className="flex-1 rounded-lg border border-gray-300 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </Dialog.Close>
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 flex items-center justify-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add & Send Login Email
                </button>
              </div>
            </div>
          </form>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

