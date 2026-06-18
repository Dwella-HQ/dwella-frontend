import * as React from "react";
import Head from "next/head";
import { motion } from "framer-motion";
import {
  LandingFooter,
  LandingHeader,
  LandingPropertyCard,
} from "@/components/landing";
import {
  getPropertiesQuery,
  mapPropertyDTOToPublicListingProperty,
} from "@/api/properties";
import type { Property } from "@/data/mockLandlordData";

export default function PropertiesPage() {
  const [properties, setProperties] = React.useState<Property[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getPropertiesQuery()
      .then((result) => {
        if (cancelled) return;
        if (result.success) {
          setProperties(
            result.data
              .map(mapPropertyDTOToPublicListingProperty)
              .filter((p) => p.status === "active"),
          );
        } else {
          setError(result.error);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <Head>
        <title>Properties | Dwelliva</title>
      </Head>
      <div className="min-h-screen bg-[#F3F5F8]">
        <LandingHeader />
        <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <h1 className="text-3xl font-bold text-[#111827] md:text-5xl">
              Available Properties
            </h1>
            <p className="mt-3 text-base text-[#6B7280] md:text-lg">
              Browse verified homes across Nigeria.
            </p>
          </motion.div>

          {loading ? (
            <div className="flex min-h-[280px] items-center justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#1F93D0] border-t-transparent" />
            </div>
          ) : error ? (
            <div className="mt-10 rounded-xl border border-[#E5E7EB] bg-white py-12 text-center text-[#4B5563]">
              {error === "Unauthorized"
                ? "Properties are temporarily unavailable. Please try again later."
                : error}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.35 }}
              className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3"
            >
              {properties.map((property) => (
                <LandingPropertyCard key={property.id} property={property} />
              ))}
            </motion.div>
          )}
        </main>
        <LandingFooter />
      </div>
    </>
  );
}
