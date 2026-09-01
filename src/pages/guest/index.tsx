import * as React from "react";
import Head from "next/head";
import { GuestLayout } from "@/components/guest/GuestLayout";
import {
  HeroSearch,
  CategoryTabs,
  ShortStayPropertyCard,
  type HeroSearchValues,
} from "@/components/landing";
import { useUser } from "@/contexts/UserContext";
import { loadGuestStayListings } from "@/lib/loadGuestStayListings";
import type { StayListing } from "@/data/mockShortStay";
import { DataUnavailableBanner } from "@/components/DataUnavailableBanner";
import type { NextPageWithLayout } from "../_app";

const LISTINGS_PER_PAGE = 8;

const matchesBudget = (property: StayListing, budget: string) => {
  if (!budget) return true;
  const rent =
    property.listingType === "short_let" && property.pricePerNight > 0
      ? property.pricePerNight * 30
      : property.monthlyRent;
  if (budget === "0-200000") return rent > 0 && rent < 200000;
  if (budget === "200000-500000") return rent >= 200000 && rent <= 500000;
  if (budget === "500000-1000000") return rent >= 500000 && rent <= 1000000;
  if (budget === "1000000+") return rent >= 1000000;
  return true;
};

const GuestDashboardPage: NextPageWithLayout = () => {
  const { user } = useUser();
  const firstName = user?.name?.trim().split(/\s+/)[0] || "there";

  const [allProperties, setAllProperties] = React.useState<StayListing[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [unavailable, setUnavailable] = React.useState(false);
  const [category, setCategory] = React.useState("All");
  const [visibleCount, setVisibleCount] = React.useState(LISTINGS_PER_PAGE);
  const [searchValues, setSearchValues] = React.useState<HeroSearchValues>({
    destination: "",
    type: "",
    budget: "",
    amenity: "",
  });
  const [appliedSearch, setAppliedSearch] =
    React.useState<HeroSearchValues>(searchValues);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void loadGuestStayListings()
      .then((result) => {
        if (cancelled) return;
        setAllProperties(result.listings);
        setUnavailable(result.unavailable);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setAllProperties([]);
        setUnavailable(true);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = React.useMemo(() => {
    const destination = appliedSearch.destination.trim().toLowerCase();
    const typeFilter =
      appliedSearch.type || (category !== "All" ? category : "");
    const amenity = appliedSearch.amenity.trim().toLowerCase();

    return allProperties.filter((property) => {
      if (destination) {
        const haystack = `${property.name} ${property.address}`.toLowerCase();
        if (!haystack.includes(destination)) return false;
      }
      if (typeFilter) {
        const typeHaystack =
          `${property.propertyType ?? ""} ${property.name}`.toLowerCase();
        if (!typeHaystack.includes(typeFilter.toLowerCase())) return false;
      }
      if (amenity) {
        const hasAmenity = property.amenities.some((a) =>
          a.toLowerCase().includes(amenity),
        );
        if (!hasAmenity) return false;
      }
      if (!matchesBudget(property, appliedSearch.budget)) {
        return false;
      }
      return true;
    });
  }, [allProperties, appliedSearch, category]);

  const visible = filtered.slice(0, visibleCount);
  const canLoadMore = visibleCount < filtered.length;

  const handleCategoryChange = React.useCallback((next: string) => {
    setCategory(next);
    setVisibleCount(LISTINGS_PER_PAGE);
    if (next !== "All") {
      setSearchValues((prev) => ({ ...prev, type: next }));
      setAppliedSearch((prev) => ({ ...prev, type: next }));
    } else {
      setSearchValues((prev) => ({ ...prev, type: "" }));
      setAppliedSearch((prev) => ({ ...prev, type: "" }));
    }
  }, []);

  return (
    <>
      <Head>
        <title>Dashboard | Dwelliva</title>
      </Head>

      <HeroSearch
        id="guest-search"
        showBreadcrumb={false}
        title={<>Hi {firstName}! Find Your Perfect Stay</>}
        subtitle="Browse short-lets and long-term homes across Nigeria"
        values={searchValues}
        onChange={setSearchValues}
        onSearch={(values) => {
          setAppliedSearch(values);
          setVisibleCount(LISTINGS_PER_PAGE);
          if (values.type) setCategory(values.type);
          else setCategory("All");
        }}
      />

      <div className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <CategoryTabs value={category} onChange={handleCategoryChange} />

        {loading ? (
          <div className="flex min-h-[40vh] items-center justify-center py-16">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--brand-main)] border-t-transparent" />
          </div>
        ) : unavailable ? (
          <DataUnavailableBanner
            title="Property listings are unavailable"
            description="We couldn't load properties right now. Please try again later."
          />
        ) : allProperties.length === 0 ? (
          <DataUnavailableBanner
            tone="neutral"
            title="No properties listed yet"
            description="There are no published listings to show."
          />
        ) : filtered.length === 0 ? (
          <DataUnavailableBanner
            tone="neutral"
            title="No properties found"
            description="Try adjusting your search or category filters."
          />
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((property) => (
                <ShortStayPropertyCard key={property.id} property={property} />
              ))}
            </div>

            <div className="mt-10 flex justify-center">
              {canLoadMore ? (
                <button
                  type="button"
                  onClick={() =>
                    setVisibleCount((count) => count + LISTINGS_PER_PAGE)
                  }
                  className="rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-800 shadow-sm transition hover:bg-gray-50"
                >
                  Load More Properties
                </button>
              ) : null}
            </div>
          </>
        )}
      </div>
    </>
  );
};

GuestDashboardPage.getLayout = (page) => (
  <GuestLayout showSearch>{page}</GuestLayout>
);

export default GuestDashboardPage;
