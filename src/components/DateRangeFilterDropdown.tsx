import * as React from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as Dialog from "@radix-ui/react-dialog";
import { Calendar, Check, X } from "lucide-react";
import { DayPicker, type DateRange } from "react-day-picker";
import { format } from "date-fns";

export type DateRangePreset =
  | "last_12_months"
  | "last_6_months"
  | "last_30_days"
  | "last_7_days"
  | "custom";

export type DateRangeFilterValue = {
  preset: DateRangePreset;
  range?: DateRange | undefined;
};

export type DateRangeFilterDropdownProps = {
  value: DateRangeFilterValue;
  onPresetChange: (preset: DateRangePreset) => void;
  onCustomRangeChange: (range: DateRange | undefined) => void;
};

type PresetOption = {
  label: string;
  value: DateRangePreset;
};

const PRESET_OPTIONS: PresetOption[] = [
  { label: "Last 12 months", value: "last_12_months" },
  { label: "Last 6 months", value: "last_6_months" },
  { label: "Last 30 days", value: "last_30_days" },
  { label: "Last 7 days", value: "last_7_days" },
  { label: "Custom", value: "custom" },
];

const formatDateRange = (range?: DateRange) => {
  if (!range?.from) {
    return "Custom range";
  }

  const from = format(range.from, "MMM d, yyyy");
  if (!range.to) {
    return `${from} - …`;
  }

  const to = format(range.to, "MMM d, yyyy");
  return `${from} - ${to}`;
};

export const DateRangeFilterDropdown = ({
  value,
  onPresetChange,
  onCustomRangeChange,
}: DateRangeFilterDropdownProps) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [pendingRange, setPendingRange] = React.useState<DateRange | undefined>(
    value.range
  );

  const selectedLabel =
    value.preset === "custom"
      ? formatDateRange(value.range)
      : (PRESET_OPTIONS.find((option) => option.value === value.preset)
          ?.label ?? PRESET_OPTIONS[0].label);

  React.useEffect(() => {
    if (value.preset === "custom") {
      setPendingRange(value.range);
    }
  }, [value]);

  const handlePresetSelect = React.useCallback(
    (preset: DateRangePreset) => {
      onPresetChange(preset);
      if (preset === "custom") {
        setIsDialogOpen(true);
      }
    },
    [onPresetChange]
  );

  const handleDialogOpenChange = React.useCallback(
    (open: boolean) => {
      setIsDialogOpen(open);
      if (!open && value.preset === "custom" && !value.range) {
        onPresetChange("last_12_months");
      }
    },
    [onPresetChange, value]
  );

  const handleApplyCustomRange = React.useCallback(() => {
    onCustomRangeChange(pendingRange);
    if (value.preset !== "custom") {
      onPresetChange("custom");
    }
    setIsDialogOpen(false);
  }, [onCustomRangeChange, onPresetChange, pendingRange, value.preset]);

  const isApplyDisabled =
    !pendingRange?.from ||
    !pendingRange?.to ||
    pendingRange.from > pendingRange.to;

  return (
    <>
      <DropdownMenu.Root open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <DropdownMenu.Trigger asChild>
          <button
            type="button"
            className="transition-fx flex items-center gap-2 rounded-lg border border-brand-border-light bg-brand-white px-4 py-2 text-sm font-medium text-brand-ash hover:border-brand-main hover:text-brand-main"
          >
            <Calendar className="h-4 w-4" />
            {selectedLabel}
            <svg
              aria-hidden="true"
              width="12"
              height="12"
              viewBox="0 0 12 12"
              className="h-3 w-3 fill-current text-brand-ash"
            >
              <path d="M6 8.5 2 4.5h8L6 8.5Z" />
            </svg>
          </button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            sideOffset={8}
            className="w-48 rounded-lg border border-brand-border-light bg-brand-white p-2 shadow-lg focus:outline-none"
          >
            {PRESET_OPTIONS.map((option) => (
              <DropdownMenu.Item
                key={option.value}
                onSelect={(event) => {
                  event.preventDefault();
                  setIsMenuOpen(false);
                  handlePresetSelect(option.value);
                }}
                className="transition-fx flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm text-brand-ash outline-none hover:bg-brand-main-bg hover:text-brand-main focus:bg-brand-main-bg focus:text-brand-main"
              >
                <span>{option.label}</span>
                {value.preset === option.value ? (
                  <Check className="h-4 w-4 text-brand-main" />
                ) : null}
              </DropdownMenu.Item>
            ))}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      <Dialog.Root open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-brand-black/40 backdrop-blur-sm" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-brand-border-light bg-brand-white p-6 shadow-xl focus:outline-none">
            <div className="flex items-start justify-between">
              <div>
                <Dialog.Title className="text-base font-semibold text-brand-black">
                  Select custom date range
                </Dialog.Title>
                <Dialog.Description className="text-sm text-brand-ash">
                  Choose a start and end date to filter transactions.
                </Dialog.Description>
              </div>
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="rounded-md p-1 text-brand-ash transition-fx hover:bg-brand-light-bg hover:text-brand-black"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </Dialog.Close>
            </div>

            <div className="mt-6 flex justify-center">
              <DayPicker
                mode="range"
                numberOfMonths={2}
                selected={pendingRange}
                onSelect={setPendingRange}
                captionLayout="dropdown"
                className="text-brand-black"
                styles={{
                  caption: { color: "var(--brand-black)" },
                  month_caption: { fontWeight: 600 },
                  day: { borderRadius: "8px" },
                  range_start: {
                    backgroundColor: "var(--brand-main)",
                    color: "white",
                  },
                  range_end: {
                    backgroundColor: "var(--brand-main)",
                    color: "white",
                  },
                  range_middle: {
                    backgroundColor: "var(--brand-main-bg)",
                    color: "var(--brand-black)",
                  },
                }}
              />
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                className="transition-fx rounded-lg border border-brand-border-light px-4 py-2 text-sm font-medium text-brand-ash hover:border-brand-main hover:text-brand-main"
                onClick={() => {
                  setPendingRange(undefined);
                  onCustomRangeChange(undefined);
                  setIsDialogOpen(false);
                }}
              >
                Clear
              </button>
              <button
                type="button"
                disabled={isApplyDisabled}
                className="transition-fx rounded-lg bg-brand-main px-4 py-2 text-sm font-semibold text-brand-white hover:bg-brand-main/90 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={handleApplyCustomRange}
              >
                Apply
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
};
