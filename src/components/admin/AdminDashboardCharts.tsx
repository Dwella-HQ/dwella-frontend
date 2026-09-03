import * as React from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  aggregatePropertyCategories,
  cumulativePropertiesByDayInCurrentMonth,
  cumulativePropertiesByYearMonth,
  cumulativeUsersByWeekDays,
  cumulativeUsersByYearMonth,
  dailyTransactionVolumeCurrentMonth,
  monthlyTransactionVolumeByYear,
  parseIsoDate,
} from "@/lib/admin/adminDashboardSeries";

export type AdminDashboardChartsProps = {
  propertyDatesIso: string[];
  userDatesIso: string[];
  transactions: { createdAt?: string; amount?: unknown }[];
  propertyCategoryRows: {
    isOpenForServiceApartment?: boolean;
  }[];
};

function parseTxAmount(raw: unknown): number {
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : 0;
  if (typeof raw === "string") {
    const n = parseFloat(raw.replace(/[^0-9.-]/g, ""));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function formatAxisNumber(v: number): string {
  if (!Number.isFinite(v)) return "0";
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (abs >= 1000) return `${(v / 1000).toFixed(1)}k`;
  return String(Math.round(v));
}

function formatTooltipVolume(v: number): string {
  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(v);
  } catch {
    return formatAxisNumber(v);
  }
}

/** Recharts 3 tooltip values may be undefined — normalize for stable typing. */
function coerceTooltipNumber(value: unknown): number {
  if (value === undefined || value === null) return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

const selectCls =
  "rounded-md border border-[#E2E8F0] bg-white px-2 py-1.5 text-[11px] font-medium text-[#0F172A] [color-scheme:light]";

const chartWrap = "h-[220px] w-full min-h-[200px]";

export function AdminDashboardCharts({
  propertyDatesIso,
  userDatesIso,
  transactions,
  propertyCategoryRows,
}: AdminDashboardChartsProps) {
  const now = React.useMemo(() => new Date(), []);

  const [propRange, setPropRange] = React.useState<"year" | "month">("year");
  const [userRange, setUserRange] = React.useState<"week" | "year">("week");
  const [volRange, setVolRange] = React.useState<"year" | "month">("year");

  const propertyDates = React.useMemo(
    () =>
      propertyDatesIso
        .map((s) => parseIsoDate(s))
        .filter((d): d is Date => d !== null),
    [propertyDatesIso],
  );

  const userDates = React.useMemo(
    () =>
      userDatesIso
        .map((s) => parseIsoDate(s))
        .filter((d): d is Date => d !== null),
    [userDatesIso],
  );

  const txEntries = React.useMemo(() => {
    const out: { date: Date; amount: number }[] = [];
    for (const t of transactions) {
      const d = parseIsoDate(t.createdAt ?? null);
      if (!d) continue;
      out.push({ date: d, amount: parseTxAmount(t.amount) });
    }
    return out;
  }, [transactions]);

  const year = now.getFullYear();

  const propertiesSeries = React.useMemo(() => {
    if (propRange === "year") {
      return cumulativePropertiesByYearMonth(propertyDates, year);
    }
    return cumulativePropertiesByDayInCurrentMonth(propertyDates, now);
  }, [propRange, propertyDates, year, now]);

  const usersSeries = React.useMemo(() => {
    if (userRange === "week") {
      return cumulativeUsersByWeekDays(userDates, now);
    }
    return cumulativeUsersByYearMonth(userDates, year);
  }, [userRange, userDates, year, now]);

  const volumeSeries = React.useMemo(() => {
    if (volRange === "year") {
      return monthlyTransactionVolumeByYear(txEntries, year);
    }
    return dailyTransactionVolumeCurrentMonth(txEntries, now);
  }, [volRange, txEntries, year, now]);

  const listingTypes = React.useMemo(
    () => aggregatePropertyCategories(propertyCategoryRows),
    [propertyCategoryRows],
  );

  return (
    <>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="rounded-[10px] border border-[#E2E8F0] bg-white p-4">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-lg font-semibold leading-none sm:text-xl lg:text-[24px]">
                Total Properties
              </p>
              <p className="mt-1 text-[12px] text-[#64748B]">
                Properties on the platform over time (cumulative)
              </p>
            </div>
            <select
              value={propRange}
              onChange={(e) =>
                setPropRange(e.target.value as "year" | "month")
              }
              className={selectCls}
              aria-label="Properties time range"
            >
              <option value="year">This Year</option>
              <option value="month">This Month</option>
            </select>
          </div>
          <div className={chartWrap}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={propertiesSeries}
                margin={{ top: 8, right: 12, left: 8, bottom: 4 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#E5E7EB"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "#64748B" }}
                  axisLine={{ stroke: "#E5E7EB" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#64748B" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={formatAxisNumber}
                  width={40}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid #E2E8F0",
                    fontSize: 12,
                  }}
                  formatter={(value?: unknown) => {
                    const n = coerceTooltipNumber(value);
                    return [n, "Properties"] as const;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: "#10B981" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-[10px] border border-[#E2E8F0] bg-white p-4">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-lg font-semibold leading-none sm:text-xl lg:text-[24px]">
                Total Users
              </p>
              <p className="mt-1 text-[12px] text-[#64748B]">
                Tenants, landlords &amp; managers (cumulative)
              </p>
            </div>
            <select
              value={userRange}
              onChange={(e) =>
                setUserRange(e.target.value as "week" | "year")
              }
              className={selectCls}
              aria-label="Users time range"
            >
              <option value="week">This Week</option>
              <option value="year">This Year</option>
            </select>
          </div>
          <div className={chartWrap}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={usersSeries}
                margin={{ top: 8, right: 12, left: 8, bottom: 4 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#E5E7EB"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "#64748B" }}
                  axisLine={{ stroke: "#E5E7EB" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#64748B" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={formatAxisNumber}
                  width={40}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid #E2E8F0",
                    fontSize: 12,
                  }}
                  formatter={(value?: unknown) => {
                    const n = coerceTooltipNumber(value);
                    return [n, "Users"] as const;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#2563EB"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: "#2563EB" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="rounded-[10px] border border-[#E2E8F0] bg-white p-4">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-lg font-semibold leading-none sm:text-xl lg:text-[24px]">
                Total Transaction Volume
              </p>
              <p className="mt-1 text-[12px] text-[#64748B]">
                Sum of recorded payment amounts (period totals)
              </p>
            </div>
            <select
              value={volRange}
              onChange={(e) =>
                setVolRange(e.target.value as "year" | "month")
              }
              className={selectCls}
              aria-label="Volume time range"
            >
              <option value="year">This Year</option>
              <option value="month">This Month</option>
            </select>
          </div>
          <div className={chartWrap}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={volumeSeries}
                margin={{ top: 8, right: 12, left: 8, bottom: 4 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#E5E7EB"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "#64748B" }}
                  axisLine={{ stroke: "#E5E7EB" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#64748B" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={formatAxisNumber}
                  width={44}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid #E2E8F0",
                    fontSize: 12,
                  }}
                  formatter={(value?: unknown) => {
                    const n = coerceTooltipNumber(value);
                    return [formatTooltipVolume(n), "Volume"] as const;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#1E66FF"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: "#1E66FF" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-[10px] border border-[#E2E8F0] bg-white p-4">
          <p className="text-lg font-semibold leading-none sm:text-xl lg:text-[24px]">
            Property listing type
          </p>
          <p className="mt-2 text-[12px] text-[#64748B]">
            Properties marked as service apartments vs long-term rentals.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
            {listingTypes.map((row, index) => (
              <div
                key={row.name}
                className="rounded-md border border-[#F1F5F9] bg-[#F8FAFC] px-3 py-2.5"
              >
                <p className="text-[15px] font-medium text-[#0F172A]">
                  {index + 1}. {row.name}
                </p>
                <p className="text-[12px] text-[#64748B]">
                  {row.count.toLocaleString()}{" "}
                  {row.count === 1 ? "property" : "properties"}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export default AdminDashboardCharts;
