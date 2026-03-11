import * as React from "react";
import Head from "next/head";
import {
  LandingHeader,
  LandingFooter,
  StatsBar,
  HeroSearch,
  CategoryTabs,
  LandingPropertyCard,
} from "@/components/landing";
import { getProperties } from "@/api/properties";
import { mapPropertyDTOToProperty } from "@/api/properties/mapProperty";
import type { Property } from "@/data/mockLandlordData";

const LISTINGS_PER_PAGE = 9;

function filterByCategory(list: Property[], category: string) {
  if (category === "All") return list;
  const key = category.toLowerCase().replace(/\s+/g, " ");
  return list.filter(
    (p) =>
      p.name.toLowerCase().includes(key) ||
      (category === "Self Contain" && p.name.toLowerCase().includes("self")),
  );
}

export default function LandingPage() {
  const [category, setCategory] = React.useState("All");
  const [displayCount, setDisplayCount] = React.useState(LISTINGS_PER_PAGE);
  const [properties, setProperties] = React.useState<Property[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getProperties()
      .then((result) => {
        if (cancelled) return;
        if (result.success) {
          setProperties(
            result.data
              .map(mapPropertyDTOToProperty)
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

  React.useEffect(() => setDisplayCount(LISTINGS_PER_PAGE), [category]);
  const listings = React.useMemo(
    () => filterByCategory(properties, category),
    [properties, category],
  );
  const visible = listings.slice(0, displayCount);
  const hasMore = displayCount < listings.length;

  return (
    <>
      <Head>
        <title>DWELLA NG – Find Your Perfect Home</title>
        <meta
          name="description"
          content="Discover verified properties across Nigeria. Rent or list your property with DWELLA NG."
        />
      </Head>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <LandingHeader />
        <main className="flex-1">
          <HeroSearch />
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <CategoryTabs value={category} onChange={setCategory} />
            <section className="py-8">
              {loading ? (
                <div className="flex min-h-[280px] items-center justify-center">
                  <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--brand-main)] border-t-transparent" />
                </div>
              ) : error ? (
                <div className="rounded-lg border border-gray-200 bg-gray-50 py-12 text-center text-gray-600">
                  <p>
                    {error === "Unauthorized"
                      ? "Properties are temporarily unavailable. Please try again later."
                      : error}
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {visible.map((property, index) => (
                      <LandingPropertyCard
                        key={property.id}
                        property={property}
                        showListCta={index === 2}
                      />
                    ))}
                  </div>
                  {hasMore && (
                    <div className="mt-10 flex justify-center">
                      <button
                        type="button"
                        onClick={() =>
                          setDisplayCount((c) => c + LISTINGS_PER_PAGE)
                        }
                        className="rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                      >
                        Load More Properties
                      </button>
                    </div>
                  )}
                </>
              )}
            </section>
          </div>
          <StatsBar />
        </main>
        <LandingFooter />
      </div>
    </>
  );
}
