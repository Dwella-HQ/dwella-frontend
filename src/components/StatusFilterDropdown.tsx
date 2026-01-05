import * as React from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Check, ChevronDown } from "lucide-react";

import type { TransactionStatus } from "@/components/TransactionTable";
import type { PartnerStatus } from "@/components/PartnersTable";

export type StatusFilterDropdownValue =
  | "all"
  | TransactionStatus
  | PartnerStatus;

export type StatusFilterDropdownProps = {
  value: StatusFilterDropdownValue;
  onChange: (value: StatusFilterDropdownValue) => void;
  options?: Array<{
    label: string;
    value: StatusFilterDropdownValue;
  }>;
};

const DEFAULT_TRANSACTION_OPTIONS: Array<{
  label: string;
  value: StatusFilterDropdownValue;
}> = [
  { label: "All Status", value: "all" },
  { label: "Successful", value: "Successful" },
  { label: "Pending", value: "Pending" },
  { label: "Failed", value: "Failed" },
];

const PARTNER_STATUS_OPTIONS: Array<{
  label: string;
  value: StatusFilterDropdownValue;
}> = [
  { label: "All Status", value: "all" },
  { label: "Active", value: "Active" },
  { label: "Suspended", value: "Suspended" },
  { label: "Inactive", value: "Inactive" },
];

export const StatusFilterDropdown = ({
  value,
  onChange,
  options = DEFAULT_TRANSACTION_OPTIONS,
}: StatusFilterDropdownProps) => {
  const handleSelect = React.useCallback(
    (nextValue: StatusFilterDropdownValue) => {
      onChange(nextValue);
    },
    [onChange]
  );

  const selectedLabel =
    options.find((option) => option.value === value)?.label ?? options[0].label;

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="transition-fx flex cursor-pointer items-center gap-2 rounded-lg border border-brand-border-light bg-brand-light-bg px-3 py-2 text-xs font-medium text-brand-black hover:border-brand-main hover:text-brand-main"
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
          {options.map((option) => (
            <DropdownMenu.Item
              key={option.value}
              onSelect={(event) => {
                event.preventDefault();
                handleSelect(option.value);
              }}
              className="transition-fx flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm text-brand-ash outline-none hover:bg-brand-main-bg hover:text-brand-main focus:bg-brand-main-bg focus:text-brand-main"
            >
              <span>{option.label}</span>
              {value === option.value ? (
                <Check className="h-4 w-4 text-brand-main" />
              ) : null}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};

export { PARTNER_STATUS_OPTIONS };
