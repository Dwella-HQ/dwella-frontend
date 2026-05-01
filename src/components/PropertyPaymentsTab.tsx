import * as React from "react";
import { motion } from "framer-motion";
import { Download, ChevronLeft, ChevronRight, CalendarClock } from "lucide-react";
import type { PaymentHistory } from "@/data/mockLandlordData";
import { getPropertySettings } from "@/api/properties";
import {
  buildRentRulesCardLines,
  formatRentRulesPolicyTooltip,
  type PropertyRentRulesCardLines,
} from "@/lib/propertyRentRulesFromSettings";

export type PropertyPaymentsTabProps = {
  payments: PaymentHistory[];
  /** When set, loads and shows this property's saved rent rules (same as Settings). */
  propertyId?: string | null;
};

export const PropertyPaymentsTab = ({
  payments,
  propertyId,
}: PropertyPaymentsTabProps) => {
  const [itemsPerPage, setItemsPerPage] = React.useState(12);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [rules, setRules] = React.useState<PropertyRentRulesCardLines | null>(
    null,
  );
  const [rulesStatus, setRulesStatus] = React.useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");

  React.useEffect(() => {
    if (!propertyId) {
      setRules(null);
      setRulesStatus("idle");
      return;
    }
    let cancelled = false;
    setRulesStatus("loading");
    void getPropertySettings(propertyId).then((result) => {
      if (cancelled) return;
      if (!result.success) {
        setRules(null);
        setRulesStatus("error");
        return;
      }
      setRules(buildRentRulesCardLines(result.data as Record<string, unknown>));
      setRulesStatus("ready");
    });
    return () => {
      cancelled = true;
    };
  }, [propertyId]);

  const totalItems = payments.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const displayedPayments = payments.slice(startIndex, endIndex);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 1);
  };

  // Clean tenant name (remove leading initial if present)
  const cleanTenantName = (name: string) => {
    // If name starts with single letter and space (e.g., "J John Doe"), return "John Doe"
    const match = name.match(/^[A-Z]\s(.+)$/);
    return match ? match[1] : name;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Payment History</h2>
        <motion.button
          type="button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </motion.button>
      </div>

      {propertyId && (rulesStatus === "loading" || rulesStatus === "ready" || rulesStatus === "error") ? (
        <div className="rounded-lg border border-gray-200 bg-slate-50/80 p-4">
          <div className="flex items-start gap-3">
            <CalendarClock className="mt-0.5 h-5 w-5 shrink-0 text-brand-main" />
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-gray-900">
                Rent rules applied to this property
              </h3>
              {rulesStatus === "loading" ? (
                <p className="mt-1 text-sm text-gray-600">Loading…</p>
              ) : rulesStatus === "error" || !rules ? (
                <p className="mt-1 text-sm text-amber-800">
                  Could not load property settings. Table amounts are from
                  payment records only.
                </p>
              ) : (
                <p
                  className="mt-1 text-sm text-gray-700 cursor-help"
                  title={formatRentRulesPolicyTooltip(rules)}
                >
                  <span className="font-medium">{rules.late}</span>
                  <span className="text-gray-500"> · </span>
                  Grace: {rules.monthly} / {rules.quarterly} / {rules.yearly}
                </p>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* Table */}
      {displayedPayments.length > 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-x-auto">
          <table className="w-full table-auto min-w-[640px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Transaction ID
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Tenant
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Unit ID
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {displayedPayments.map((payment, index) => (
                <motion.tr
                  key={payment.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.03 }}
                  whileHover={{ x: 4, transition: { duration: 0.2 } }}
                  className="hover:bg-gray-50"
                >
                  <td className="px-3 sm:px-6 py-4 text-sm font-semibold text-gray-900 whitespace-nowrap">
                    {payment.transactionId}
                  </td>
                  <td className="px-3 sm:px-6 py-4 text-sm text-gray-700 whitespace-nowrap">
                    {payment.date}
                  </td>
                  <td className="px-3 sm:px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-xs font-semibold text-white flex-shrink-0">
                        {getInitials(payment.tenantName)}
                      </div>
                      <span className="text-sm text-gray-700 whitespace-nowrap">{cleanTenantName(payment.tenantName)}</span>
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-4 text-sm text-gray-700 whitespace-nowrap">
                    {payment.unitId}
                  </td>
                  <td className="px-3 sm:px-6 py-4 text-sm font-semibold text-gray-900 whitespace-nowrap">
                    ₦{payment.amount.toLocaleString()}
                  </td>
                  <td className="px-3 sm:px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                        payment.status === "success"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {payment.status === "success" ? "Success" : "Failed"}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-sm text-gray-600">
          No payment history for this property yet.
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 pt-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Rows per page:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-main"
            >
              <option value={6}>6</option>
              <option value={12}>12</option>
              <option value={24}>24</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </motion.button>

            <span className="text-sm text-gray-600 px-2">
              Page {currentPage} of {totalPages}
            </span>

            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </motion.button>
          </div>
        </div>
      )}
    </div>
  );
};
