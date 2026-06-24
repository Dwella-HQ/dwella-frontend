import * as React from "react";
import { motion } from "framer-motion";

const stats = [
  { value: "1,200+", label: "Properties Managed" },
  { value: "450+", label: "Verified Landlords" },
  { value: "3,500+", label: "Active Records" },
  { value: "15+", label: "Cities Covered" },
];

export const StatsBar = () => {
  return (
    <section
      className="relative overflow-hidden py-14 text-white"
      style={{
        background: "linear-gradient(120deg, #0F63DE 0%, #0A448E 52%, #041B3A 100%)",
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(31,199,255,0.28),transparent_32%),radial-gradient(circle_at_88%_100%,rgba(255,255,255,0.14),transparent_30%)]" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative grid overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.08] shadow-[0_24px_70px_rgba(2,8,23,0.18)] backdrop-blur md:grid-cols-4">
          {stats.map(({ value, label }, index) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ y: -4 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ type: "spring", stiffness: 260, damping: 24, delay: index * 0.04 }}
              className="border-b border-white/10 p-7 text-center last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0"
            >
              <p className="text-3xl font-extrabold tracking-tight md:text-4xl">
                {value}
              </p>
              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-white/70">
                {label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
