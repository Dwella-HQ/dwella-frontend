import * as React from "react";
import { SlidersHorizontal } from "lucide-react";

export const PROPERTY_CATEGORIES = [
  "All",
  "Self Contain",
  "2 Bedroom Flat",
  "3 Bedroom Flat",
  "Duplex",
  "Serviced Apartment",
] as const;

export type PropertyCategory = (typeof PROPERTY_CATEGORIES)[number];

type CategoryTabsProps = {
  value: string;
  onChange: (value: string) => void;
};

export const CategoryTabs = ({ value, onChange }: CategoryTabsProps) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-4">
      <div className="flex max-w-full gap-2 overflow-x-auto pb-1">
        {PROPERTY_CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => onChange(cat)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
              value === cat
                ? "bg-[var(--brand-main)] text-white shadow-sm"
                : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
      <button
        type="button"
        className="inline-flex shrink-0 items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
      >
        <SlidersHorizontal className="h-4 w-4" />
        Filters
      </button>
    </div>
  );
};
