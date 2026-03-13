import * as React from "react";
import { SlidersHorizontal } from "lucide-react";

const categories = [
  "All",
  "Self Contain",
  "2 Bedroom Flat",
  "3 Bedroom Flat",
  "Duplex",
] as const;

type CategoryTabsProps = {
  value: string;
  onChange: (value: string) => void;
};

export const CategoryTabs = ({ value, onChange }: CategoryTabsProps) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-white py-4">
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => onChange(cat)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              value === cat
                ? "bg-[var(--brand-main)] text-white"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
      <button
        type="button"
        className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        <SlidersHorizontal className="h-4 w-4" />
        Filters
      </button>
    </div>
  );
};
