import * as React from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import * as Dialog from "@radix-ui/react-dialog";
import { getPropertiesByLandlord } from "@/api/properties";
import type { PropertyDTO } from "@/api/properties";
import { invitePropertyManager } from "@/api/property-managers";
import { useToast } from "@/components/Toast";
import { PhoneInputWithCountry } from "@/components/PhoneInputWithCountry";

const inviteManagerSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
});

type InviteManagerFormValues = z.infer<typeof inviteManagerSchema>;

export type InviteManagerModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onInvite?: (data: InviteManagerFormValues & { properties: string[]; permissions: string[] }) => void;
};

export const InviteManagerModal = ({
  isOpen,
  onClose,
  onInvite,
}: InviteManagerModalProps) => {
  const { showToast } = useToast();
  const [selectedProperties, setSelectedProperties] = React.useState<string[]>([]);
  const [selectedPermissions, setSelectedPermissions] = React.useState<string[]>([]);
  const [properties, setProperties] = React.useState<PropertyDTO[]>([]);
  const [isLoadingProperties, setIsLoadingProperties] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm<InviteManagerFormValues>({
    resolver: zodResolver(inviteManagerSchema),
  });

  // Fetch landlord's properties when modal opens
  React.useEffect(() => {
    if (isOpen) {
      const fetchProperties = async () => {
        setIsLoadingProperties(true);
        const landlordId = typeof window !== "undefined" ? localStorage.getItem("landlordId") : null;
        if (landlordId) {
          const result = await getPropertiesByLandlord(landlordId);
          if (result.success) {
            setProperties(result.data);
          } else {
            showToast(result.error || "Failed to fetch properties", "error");
            setProperties([]);
          }
        }
        setIsLoadingProperties(false);
      };
      fetchProperties();
    }
  }, [isOpen, showToast]);

  const permissions = [
    {
      id: "manage_maintenance_requests",
      label: "Manage Maintenance",
      description: "Can view and manage maintenance requests",
    },
    {
      id: "manage_chat",
      label: "Chat with Tenants",
      description: "Can communicate with tenants via chat",
    },
    {
      id: "manage_property_announcement",
      label: "Manage Property Announcements",
      description: "Can send and manage announcements for assigned properties",
    },
    {
      id: "read_payment",
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
    setIsSubmitting(true);
    
    try {
      const landlordId = typeof window !== "undefined" ? localStorage.getItem("landlordId") : null;
      
      if (!landlordId) {
        showToast("No landlord account found. Please log in again.", "error");
        setIsSubmitting(false);
        return;
      }

      // Invite property manager via API
      const result = await invitePropertyManager(landlordId, {
        fullName: data.fullName,
        email: data.email,
        phoneNumber: data.phone,
        propertyIds: selectedProperties.length > 0 ? selectedProperties : undefined,
        permissions: selectedPermissions.length > 0 ? selectedPermissions : undefined,
      });

      if (result.success) {
        // Show success message from API or default message
        const successMessage = result.message || "Property manager invited successfully";
        showToast(successMessage, "success");
        if (onInvite) {
          onInvite({
            ...data,
            properties: selectedProperties,
            permissions: selectedPermissions,
          });
        }
        reset();
        setSelectedProperties([]);
        setSelectedPermissions([]);
        onClose();
      } else {
        showToast(result.error || "Failed to invite property manager", "error");
      }
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "An error occurred",
        "error"
      );
    } finally {
      setIsSubmitting(false);
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
                Invite Manager
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
                      placeholder="e.g. Chinedu Okafor"
                      {...register("fullName")}
                      className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-brand-main"
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
                      placeholder="e.g. manager@example.com"
                      {...register("email")}
                      className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-brand-main"
                    />
                    {errors.email && (
                      <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Phone
                    </label>
                    <Controller
                      name="phone"
                      control={control}
                      render={({ field }) => (
                        <PhoneInputWithCountry
                          id="phone"
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="801 234 5678"
                          aria-invalid={!!errors.phone}
                          aria-describedby={
                            errors.phone ? "invite-manager-phone-error" : undefined
                          }
                        />
                      )}
                    />
                    {errors.phone && (
                      <p id="invite-manager-phone-error" className="mt-1 text-xs text-red-600">
                        {errors.phone.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Assign Properties */}
              <div>
                <h3 className="mb-4 text-sm font-semibold uppercase" style={{ color: '#99A1AF' }}>
                  Assign Properties
                </h3>
                {isLoadingProperties ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-brand-main border-r-transparent"></div>
                      <p className="mt-2 text-sm text-gray-600">Loading properties...</p>
                    </div>
                  </div>
                ) : properties.length > 0 ? (
                  <div className="max-h-64 space-y-2 overflow-y-auto">
                    {properties.map((property) => (
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
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 px-4 rounded-lg border border-gray-200 bg-gray-50">
                    <p className="text-sm font-medium text-gray-900 mb-1">No Properties</p>
                    <p className="text-xs text-gray-500 text-center">
                      You don&apos;t have any properties yet. Create a property
                      first to assign it to a manager.
                    </p>
                  </div>
                )}
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
                  disabled={isSubmitting}
                  className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition ${
                    isSubmitting
                      ? "cursor-not-allowed bg-gray-400"
                      : "bg-gray-900 hover:bg-gray-800"
                  }`}
                >
                  {isSubmitting ? "Sending..." : "Send Invite"}
                </button>
              </div>
            </form>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
