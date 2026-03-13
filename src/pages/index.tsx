import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import { Home } from "lucide-react";
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

        {/* Floating "List Your Property" – signup as landlord */}
        <Link
          href="/auth/signup?role=landlord"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2"
          style={{
            background: "linear-gradient(90deg, #155DFC 0%, #10C7FA 100%)",
          }}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
            <Home className="h-4 w-4" />
          </span>
          List Your Property
        </Link>
      </div>
    </>
  );
}
