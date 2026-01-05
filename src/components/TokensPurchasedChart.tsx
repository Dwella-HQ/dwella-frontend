import * as React from "react";
import { ChevronDown } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

const chartData = [
  { month: "Jan", value: 50 },
  { month: "Feb", value: 15 },
  { month: "Mar", value: 50 },
  { month: "Apr", value: 65 },
  { month: "May", value: 45 },
  { month: "Jun", value: 82 },
  { month: "Jul", value: 82 },
  { month: "Aug", value: 18 },
  { month: "Sep", value: 65 },
  { month: "Oct", value: 62 },
  { month: "Nov", value: 22 },
  { month: "Dec", value: 38 },
];

const timeRangeOptions = [
  { label: "Last 12 months", value: "last_12_months" },
  { label: "Last 6 months", value: "last_6_months" },
  { label: "Last 30 days", value: "last_30_days" },
  { label: "Last 7 days", value: "last_7_days" },
];

export const TokensPurchasedChart = () => {
  const [selectedRange, setSelectedRange] = React.useState("last_12_months");
  const maxValue = 100;

  const selectedLabel =
    timeRangeOptions.find((opt) => opt.value === selectedRange)?.label ??
    timeRangeOptions[0].label;

  return (
    <div className="rounded-2xl border border-brand-border-light bg-brand-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-brand-black">
            Tokens Purchased
          </h3>
          <p className="text-xs text-brand-ash">
            Latest transactions with Partner
          </p>
        </div>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              className="transition-fx flex cursor-pointer items-center gap-2 rounded-lg border border-brand-border-light bg-brand-white px-3 py-2 text-xs font-medium text-brand-ash hover:border-brand-main hover:text-brand-main"
            >
              {selectedLabel}
              <ChevronDown className="h-3 w-3" />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              sideOffset={8}
              className="w-44 rounded-lg border border-brand-border-light bg-brand-white p-2 shadow-lg focus:outline-none"
            >
              {timeRangeOptions.map((option) => (
                <DropdownMenu.Item
                  key={option.value}
                  onSelect={(event) => {
                    event.preventDefault();
                    setSelectedRange(option.value);
                  }}
                  className="transition-fx flex cursor-pointer items-center rounded-md px-3 py-2 text-sm text-brand-ash outline-none hover:bg-brand-main-bg hover:text-brand-main focus:bg-brand-main-bg focus:text-brand-main"
                >
                  {option.label}
                </DropdownMenu.Item>
              ))}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>

      <div className="mt-8 relative h-64">
        <div className="absolute inset-0 flex items-end justify-between gap-2 px-2">
          {chartData.map((data) => {
            const height = (data.value / maxValue) * 100;
            return (
              <div
                key={data.month}
                className="flex flex-1 flex-col items-center gap-2"
              >
                <div className="relative w-full flex-1 flex items-end">
                  <div
                    className="w-full rounded-t-md bg-brand-main/20 relative group cursor-pointer transition-all hover:bg-brand-main/30"
                    style={{ height: `${height}%` }}
                  >
                    <div
                      className="absolute bottom-0 w-full rounded-t-md bg-brand-main transition-all"
                      style={{ height: "100%" }}
                    />
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="rounded bg-brand-black px-2 py-1 text-[10px] text-brand-white whitespace-nowrap">
                        {data.value}
                      </div>
                    </div>
                  </div>
                </div>
                <span className="text-[10px] text-brand-ash">{data.month}</span>
              </div>
            );
          })}
        </div>

        <div className="absolute left-0 top-0 flex h-full flex-col justify-between text-[10px] text-brand-ash">
          <span>100</span>
          <span>80</span>
          <span>60</span>
          <span>40</span>
          <span>20</span>
          <span>0</span>
        </div>

        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
          {[0, 20, 40, 60, 80, 100].map((val) => (
            <div
              key={val}
              className="h-px bg-brand-border-light/50"
              style={{ marginLeft: "24px" }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
