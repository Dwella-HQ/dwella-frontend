import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { DollarSign } from "lucide-react";
import type { Payment } from "@/data/mockLandlordData";

export type RecentPaymentsProps = {
  payments: Payment[];
  onViewAll?: () => void;
};

export const RecentPayments = ({
  payments,
  onViewAll,
}: RecentPaymentsProps) => {
  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between px-6 py-4">
        <h2 className="text-lg font-semibold text-gray-900">Recent Payments</h2>
        {onViewAll ? (
          <button
            type="button"
            onClick={onViewAll}
            className="text-base font-bold text-brand-main hover:text-brand-main/80 transition"
          >
            View All
          </button>
        ) : (
          <Link
            href="/dashboard/rent"
            className="text-base font-bold text-brand-main hover:text-brand-main/80 transition"
          >
            View All
          </Link>
        )}
      </div>
      {payments.length > 0 ? (
        <div className="divide-y divide-gray-200">
          {payments.map((payment, index) => (
            <motion.div
              key={payment.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              whileHover={{ x: 4, transition: { duration: 0.2 } }}
              className="px-6 py-4 hover:bg-gray-50"
            >
              <div className="flex items-center justify-between min-h-20">
                <div className="flex-1">
                  <p className="text-base font-medium text-gray-900">
                    {payment.tenantName}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    {payment.propertyName} • {payment.unit}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-base font-semibold text-gray-900">
                    ₦{payment.amount.toLocaleString()}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">{payment.dueDate}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center justify-center py-12 px-6"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 mb-4">
            <DollarSign className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-sm font-medium text-gray-900 mb-1">No Recent Payments</p>
          <p className="text-xs text-gray-500 text-center">
            Payment history will appear here when available.
          </p>
        </motion.div>
      )}
    </div>
  );
};
