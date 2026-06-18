import * as React from "react";
import { motion } from "framer-motion";

const stats = [
  { value: "1,200+", label: "Properties Listed" },
  { value: "450+", label: "Verified Landlords" },
  { value: "3,500+", label: "Happy Tenants" },
  { value: "15+", label: "Cities Covered" },
];

export const StatsBar = () => {
  return (
    <section
      className="min-h-[140px] py-12 text-white"
      style={{
        background: "linear-gradient(90deg, #1D63F4 0%, #0A255A 55%, #010101 100%)",
      }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map(({ value, label }, index) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.45, delay: index * 0.06 }}
              className="text-center"
            >
              <p className="text-3xl font-bold md:text-4xl">{value}</p>
              <p className="mt-1 text-sm font-medium opacity-90">{label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
