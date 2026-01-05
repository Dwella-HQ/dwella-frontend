import * as React from "react";

import { PartnerAnalyticsKPICard } from "@/components/PartnerAnalyticsKPICard";
import { TokensPurchasedChart } from "@/components/TokensPurchasedChart";

export const PartnerAnalyticsTab = () => {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-3">
        <PartnerAnalyticsKPICard
          title="Token Balance (kWh)"
          value="402,600.40 kWh"
          change={2.15}
          changeLabel="Since last month"
          isPositive={true}
        />
        <PartnerAnalyticsKPICard
          title="Successful Transactions"
          value="8"
          change={2.15}
          changeLabel="Since last month"
          isPositive={true}
        />
        <PartnerAnalyticsKPICard
          title="Failed Transactions"
          value="2"
          change={-6.15}
          changeLabel="Since last month"
          isPositive={false}
        />
      </div>

      <TokensPurchasedChart />
    </div>
  );
};
