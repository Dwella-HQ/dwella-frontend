import * as React from "react";
import { ArrowDown, ArrowUp } from "lucide-react";

export type PartnerAnalyticsKPICardProps = {
  title: string;
  value: string;
  change: number;
  changeLabel: string;
  isPositive?: boolean;
};

export const PartnerAnalyticsKPICard = ({
  title,
  value,
  change,
  changeLabel,
  isPositive = true,
}: PartnerAnalyticsKPICardProps) => {
  const isChangePositive = change > 0;

  return (
    <div className="rounded-2xl border border-brand-border-light bg-brand-white p-6 shadow-sm">
      <p className="text-sm font-medium text-brand-ash">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-brand-black">{value}</p>
      <div className="mt-3 flex items-center gap-2">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
            isChangePositive
              ? "bg-brand-success-bg text-brand-success-text"
              : "bg-brand-failed-bg text-brand-failed-text"
          }`}
        >
          {isChangePositive ? (
            <ArrowUp className="h-3 w-3" />
          ) : (
            <ArrowDown className="h-3 w-3" />
          )}
          {Math.abs(change).toFixed(2)}%
        </span>
        <span className="text-xs text-brand-ash">{changeLabel}</span>
      </div>
    </div>
  );
};
