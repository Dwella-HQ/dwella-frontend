import * as React from "react";

export type StatsCardProps = {
  title: string;
  value: string;
  subtitle: string;
  trend: {
    value: string;
    isPositive: boolean;
  };
};

export const StatsCard = ({
  title,
  value,
  subtitle,
  trend,
}: StatsCardProps) => {
  return (
    <div className="rounded-2xl border border-brand-border-light bg-brand-white p-6 shadow-sm">
      <p className="text-xs font-medium text-brand-ash">{title}</p>
      <h3 className="mt-2 text-2xl font-bold text-brand-black">{value}</h3>
      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs text-brand-ash">{subtitle}</p>
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
            trend.isPositive
              ? "bg-brand-success-bg text-brand-success-text"
              : "bg-brand-failed-bg text-brand-failed-text"
          }`}
        >
          {trend.isPositive ? "+" : ""}
          {trend.value}
        </span>
      </div>
    </div>
  );
};
