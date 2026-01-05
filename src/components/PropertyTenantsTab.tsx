import * as React from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { MessageSquare, User, Users, Plus } from "lucide-react";
import { AddTenantModal } from "@/components/AddTenantModal";
import type { Tenant } from "@/data/mockLandlordData";

export type PropertyTenantsTabProps = {
  tenants: Tenant[];
  propertyId: string;
};

export const PropertyTenantsTab = ({ tenants, propertyId }: PropertyTenantsTabProps) => {
  const router = useRouter();
  const [isAddTenantOpen, setIsAddTenantOpen] = React.useState(false);
  
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">Current Tenants</h2>
      </div>

      {/* Tenants Grid */}
      {tenants.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tenants.map((tenant, index) => (
          <motion.div
            key={tenant.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
          >
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-main text-sm font-semibold text-white">
                {getInitials(tenant.name)}
              </div>

              {/* Tenant Info */}
              <div className="flex-1">
                <h3 className="text-base font-semibold text-gray-900">{tenant.name}</h3>
                <p className="mt-1 text-sm text-gray-600">{tenant.phone}</p>
                <div className="mt-3 space-y-1">
                  <p className="text-xs text-gray-500">
                    <span className="font-medium">UNIT:</span> {tenant.unitId}
                  </p>
                  <p className="text-xs text-gray-500">
                    <span className="font-medium">LEASE ENDS:</span> {tenant.leaseEnd}
                  </p>
                </div>
                <div className="mt-3">
                  <span className="inline-flex rounded-full bg-brand-green px-3 py-1 text-xs font-medium text-white">
                    Paid
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-4 flex gap-2">
              <motion.button
                type="button"
                onClick={() => router.push("/dashboard/messages")}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 flex items-center justify-center gap-2"
              >
                <MessageSquare className="h-4 w-4" />
                Message
              </motion.button>
              <motion.button
                type="button"
                onClick={() => router.push(`/dashboard/tenants/${tenant.id}`)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 rounded-lg bg-brand-main px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-main/90 flex items-center justify-center gap-2"
              >
                <User className="h-4 w-4" />
                Profile
              </motion.button>
            </div>
          </motion.div>
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center justify-center py-12 px-6 rounded-lg border border-gray-200 bg-white"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 mb-4">
            <Users className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-sm font-medium text-gray-900 mb-1">No Tenants</p>
          <p className="text-xs text-gray-500 text-center mb-4">
            No tenants are currently assigned to this property.
          </p>
          <motion.button
            type="button"
            onClick={() => setIsAddTenantOpen(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            <Plus className="h-4 w-4" />
            Add Tenant
          </motion.button>
        </motion.div>
      )}

      <AddTenantModal
        isOpen={isAddTenantOpen}
        onClose={() => setIsAddTenantOpen(false)}
        propertyId={propertyId}
      />
    </div>
  );
};

