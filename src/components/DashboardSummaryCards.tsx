import * as React from "react";
import { motion } from "framer-motion";
import { Building2, Home, DollarSign, AlertCircle } from "lucide-react";
import type { DashboardStats } from "@/data/mockLandlordData";
import {
  ADMIN_STAT_BG,
  ADMIN_STAT_CYCLE,
  ADMIN_STAT_LABEL,
} from "@/lib/adminDesignTokens";

export type DashboardSummaryCardsProps = {
  stats: DashboardStats;
  /** When true, show skeleton placeholders instead of values */
  loading?: boolean;
};

export const DashboardSummaryCards = ({
  stats,
  loading = false,
}: DashboardSummaryCardsProps) => {
  const pendingLabel =
    stats.pendingVerification === 0
      ? "All properties verified"
      : `${stats.pendingVerification} pending verification`;
  const maintenanceLabel =
    stats.unitsUnderMaintenance === 0
      ? "No units under maintenance"
      : `${stats.unitsUnderMaintenance} unit${
          stats.unitsUnderMaintenance === 1 ? "" : "s"
        } under maintenance`;
  const overdueSubtitle =
    stats.overdueCount === 0
      ? "No overdue balances"
      : `${stats.overdueCount} tenant${
          stats.overdueCount === 1 ? "" : "s"
        } overdue`;

  const cards = [
    {
      title: "Total Properties",
      value: stats.totalProperties.toString(),
      subtitle: pendingLabel,
      icon: Building2,
    },
    {
      title: "Total Units",
      value: stats.totalUnits.toString(),
      subtitle: maintenanceLabel,
      icon: Home,
    },
    {
      title: "Rent Collected",
      value: `₦${stats.rentCollected.toLocaleString()}`,
      subtitle: stats.rentCollectedPeriod,
      icon: DollarSign,
    },
    {
      title: "Overdue Amount",
      value: `₦${stats.overdueAmount.toLocaleString()}`,
      subtitle: overdueSubtitle,
      icon: AlertCircle,
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-lg border border-gray-200 bg-white p-3 lg:p-5 shadow-sm animate-pulse"
          >
            <div className="flex items-center gap-2 lg:gap-4">
              <div className="h-9 w-9 lg:h-11 lg:w-11 rounded-lg bg-gray-200" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-24 rounded bg-gray-200" />
                <div className="h-7 w-16 rounded bg-gray-200" />
                <div className="h-3 w-32 rounded bg-gray-200" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        const tint = ADMIN_STAT_CYCLE[index % ADMIN_STAT_CYCLE.length];
        return (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="rounded-lg border border-gray-200 bg-white p-3 lg:p-5 shadow-sm overflow-hidden"
          >
            <div className="flex items-center gap-2 lg:gap-4">
              <div
                className="rounded-lg p-1.5 lg:p-2 flex-shrink-0"
                style={{ backgroundColor: ADMIN_STAT_BG[tint] }}
              >
                <Icon
                  className="h-4 w-4 lg:h-5 lg:w-5 flex-shrink-0"
                  style={{ color: ADMIN_STAT_LABEL[tint] }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs lg:text-sm font-medium text-gray-600 truncate">
                  {card.title}
                </p>
                <p className="mt-1 lg:mt-2 text-xl lg:text-3xl font-bold text-gray-900 break-words leading-tight">
                  {card.value}
                </p>
                <p className="mt-1 text-xs text-gray-500 line-clamp-2">
                  {card.subtitle}
                </p>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
