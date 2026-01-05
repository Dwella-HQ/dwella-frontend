import * as React from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import * as Dialog from "@radix-ui/react-dialog";
import { mockProperties } from "@/data/mockLandlordData";
import type { Manager } from "@/data/mockLandlordData";

const editManagerSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
});

type EditManagerFormValues = z.infer<typeof editManagerSchema>;

export type EditManagerModalProps = {
  isOpen: boolean;
  onClose: () => void;
  manager: Manager | null;
  onSave?: (data: EditManagerFormValues & { properties: string[]; permissions: string[] }) => void;
};

export const EditManagerModal = ({
  isOpen,
  onClose,
  manager,
  onSave,
}: EditManagerModalProps) => {
  const [selectedProperties, setSelectedProperties] = React.useState<string[]>([]);
  const [selectedPermissions, setSelectedPermissions] = React.useState<string[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<EditManagerFormValues>({
    resolver: zodResolver(editManagerSchema),
    defaultValues: manager
      ? {
          fullName: manager.name,
          email: manager.email,
          phone: manager.phone,
        }
      : undefined,
  });

  React.useEffect(() => {
    if (manager) {
      reset({
        fullName: manager.name,
        email: manager.email,
        phone: manager.phone,
      });
      setSelectedProperties(manager.assignedProperties);
      setSelectedPermissions(manager.permissions);
    }
  }, [manager, reset]);

  const permissions = [
    {
      id: "maintenance",
      label: "Manage Maintenance",
      description: "Can view and manage maintenance requests",
    },
    {
      id: "chat",
      label: "Chat with Tenants",
      description: "Can communicate with tenants via chat",
    },
    {
      id: "payments",
      label: "View Payments (Read-only)",
      description: "Can view payment information but cannot modify",
    },
  ];

  const toggleProperty = (propertyId: string) => {
    setSelectedProperties((prev) =>
      prev.includes(propertyId)
        ? prev.filter((id) => id !== propertyId)
        : [...prev, propertyId]
    );
  };

  const togglePermission = (permissionId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const onSubmit = handleSubmit(async (data) => {
    if (onSave) {
      onSave({
        ...data,
        properties: selectedProperties,
        permissions: selectedPermissions,
      });
    }
    onClose();
  });

  if (!manager) return null;

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
              <Dialog.Title className="text-xl font-bold text-gray-900">
                Edit Manager
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
              {/* Manager Information */}
              <div>
                <h3 className="mb-4 text-sm font-semibold uppercase" style={{ color: '#99A1AF' }}>
                  Manager Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Full Name <span className="text-red-500">*</span>
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
                      Email <span className="text-red-500">*</span>
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
                      Phone
                    </label>
                    <input
                      type="tel"
                      placeholder="Placeholder"
                      {...register("phone")}
                      className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
                    />
                    {errors.phone && (
                      <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Assign Properties */}
              <div>
                <h3 className="mb-4 text-sm font-semibold uppercase" style={{ color: '#99A1AF' }}>
                  Assign Properties
                </h3>
                <div className="space-y-2">
                  {mockProperties.map((property) => (
                    <label
                      key={property.id}
                      className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50 transition"
                    >
                      <input
                        type="checkbox"
                        checked={selectedProperties.includes(property.id)}
                        onChange={() => toggleProperty(property.id)}
                        className="h-4 w-4 rounded border-gray-300 text-brand-main focus:ring-2 focus:ring-brand-main focus:ring-offset-2"
                      />
                      <span className="text-sm font-medium text-gray-900">{property.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Permissions */}
              <div>
                <h3 className="mb-4 text-sm font-semibold uppercase" style={{ color: '#99A1AF' }}>
                  Permissions
                </h3>
                <div className="space-y-3">
                  {permissions.map((permission) => (
                    <label
                      key={permission.id}
                      className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-4 hover:bg-gray-50 transition"
                    >
                      <input
                        type="checkbox"
                        checked={selectedPermissions.includes(permission.id)}
                        onChange={() => togglePermission(permission.id)}
                        className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-main focus:ring-2 focus:ring-brand-main focus:ring-offset-2"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{permission.label}</p>
                        <p className="mt-1 text-xs text-gray-600">{permission.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
                >
                  Save
                </button>
              </div>
            </form>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

