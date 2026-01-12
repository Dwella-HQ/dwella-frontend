import * as React from "react";
import { motion } from "framer-motion";
import { Building2, Home, DollarSign, AlertCircle } from "lucide-react";
import type { DashboardStats } from "@/data/mockLandlordData";

export type DashboardSummaryCardsProps = {
  stats: DashboardStats;
};

export const DashboardSummaryCards = ({
  stats,
}: DashboardSummaryCardsProps) => {
  const cards = [
    {
      title: "Total Properties",
      value: stats.totalProperties.toString(),
      subtitle: `${stats.pendingVerification} pending verification`,
      icon: Building2,
    },
    {
      title: "Total Units",
      value: stats.totalUnits.toString(),
      subtitle: `${stats.unitsUnderMaintenance} units under maintenance`,
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
      subtitle: `${stats.overdueCount} tenant overdue`,
      icon: AlertCircle,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
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
              <div className="rounded-lg bg-blue-50 p-1.5 lg:p-2 flex-shrink-0">
                <Icon className="h-4 w-4 lg:h-5 lg:w-5 text-brand-main" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs lg:text-sm font-medium text-gray-600 truncate">
                  {card.title}
                </p>
                <p className="mt-1 lg:mt-2 text-xl lg:text-3xl font-bold text-gray-900 break-words leading-tight">
                  {card.value}
                </p>
                <p className="mt-1 text-xs text-gray-500 line-clamp-2">{card.subtitle}</p>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
