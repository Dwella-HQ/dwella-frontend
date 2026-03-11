import * as React from "react";

const stats = [
  { value: "1,200+", label: "Properties Listed" },
  { value: "450+", label: "Verified Landlords" },
  { value: "3,500+", label: "Happy Tenants" },
  { value: "15+", label: "Cities Covered" },
];

export const StatsBar = () => {
  return (
    <section
      className="min-h-[140px] py-10 text-white"
      style={{
        background: "linear-gradient(180deg, #155DFC 0%, #000000 100%)",
      }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="text-3xl font-bold md:text-4xl">{value}</p>
              <p className="mt-1 text-sm font-medium opacity-90">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
