import * as React from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  MapPin,
  Droplets,
  ParkingCircle,
  Wifi,
  Shield,
  Zap,
  Check,
  X,
  CalendarDays,
  Search,
  Star,
  Building2,
  Minus,
  Plus,
} from "lucide-react";
import {
  LandingHeader,
  LandingFooter,
  StatsBar,
  ShortStayPropertyCard,
} from "@/components/landing";
import { GuestHeader } from "@/components/guest/GuestHeader";
import { useUser } from "@/contexts/UserContext";
import { useToast } from "@/components/Toast";
import {
  getProperty,
  getPropertiesQuery,
  mapPropertyDTOToProperty,
  mapPropertyDTOToPublicListingProperty,
} from "@/api/properties";
import {
  getMockStayById,
  mockShortStayListings,
  toStayListing,
  type StayListing,
} from "@/data/mockShortStay";

const amenityIconFor = (label: string) => {
  const key = label.toLowerCase();
  if (key.includes("water")) return Droplets;
  if (key.includes("park") || key.includes("car")) return ParkingCircle;
  if (key.includes("internet") || key.includes("fiber") || key.includes("wifi"))
    return Wifi;
  if (key.includes("security") || key.includes("gate")) return Shield;
  if (key.includes("power") || key.includes("electric")) return Zap;
  return Check;
};

const nightsBetween = (checkIn: string, checkOut: string) => {
  if (!checkIn || !checkOut) return 0;
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diff = end.getTime() - start.getTime();
  if (!Number.isFinite(diff) || diff <= 0) return 0;
  return Math.round(diff / (1000 * 60 * 60 * 24));
};

export default function PropertyDetailPage() {
  const router = useRouter();
  const { user } = useUser();
  const { showToast } = useToast();
  const id = router.query.id as string | undefined;
  const isLoggedInGuest = user?.role === "guest";
  const [property, setProperty] = React.useState<StayListing | null>(null);
  const [similar, setSimilar] = React.useState<StayListing[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [guestPreview, setGuestPreview] = React.useState(false);
  const [showGuestModal, setShowGuestModal] = React.useState(false);
  const [activeImageIndex, setActiveImageIndex] = React.useState(0);
  const [visibleReviews, setVisibleReviews] = React.useState(3);
  const [checkIn, setCheckIn] = React.useState("");
  const [checkOut, setCheckOut] = React.useState("");
  const [guests, setGuests] = React.useState(1);
  const propertyId = property?.id;

  React.useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setGuestPreview(false);
    setShowGuestModal(false);
    setActiveImageIndex(0);
    setVisibleReviews(3);
    setCheckIn("");
    setCheckOut("");
    setGuests(1);

    void (async () => {
      const mock = getMockStayById(id);
      if (mock) {
        if (cancelled) return;
        setProperty(mock);
        setLoading(false);
        return;
      }

      const authed = await getProperty(id);
      if (cancelled) return;

      if (authed.success) {
        setProperty(toStayListing(mapPropertyDTOToProperty(authed.data)));
        setLoading(false);
        return;
      }

      const statusCode = "statusCode" in authed ? authed.statusCode : undefined;
      const isUnauthorized =
        authed.error === "Unauthorized" || statusCode === 401;

      if (isUnauthorized) {
        const pub = await getPropertiesQuery();
        if (cancelled) return;
        if (pub.success) {
          const dto = pub.data.find((p) => p.id === id);
          if (dto) {
            setProperty(
              toStayListing(mapPropertyDTOToPublicListingProperty(dto)),
            );
            setGuestPreview(true);
            setLoading(false);
            return;
          }
        }
        setProperty(null);
        setGuestPreview(true);
        setError(null);
        setLoading(false);
        return;
      }

      setError(authed.error);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  React.useEffect(() => {
    if (!propertyId) return;
    let cancelled = false;

    const fromMocks = mockShortStayListings
      .filter((p) => p.id !== propertyId && p.status === "active")
      .slice(0, 3);

    void getPropertiesQuery().then((result) => {
      if (cancelled) return;
      if (!result.success) {
        setSimilar(fromMocks);
        return;
      }
      const fromApi = result.data
        .map(mapPropertyDTOToPublicListingProperty)
        .filter((p) => p.id !== propertyId && p.status === "active")
        .map((p) => toStayListing(p))
        .slice(0, 3);
      setSimilar(fromMocks.length >= 3 ? fromMocks : [...fromMocks, ...fromApi].slice(0, 3));
    });

    return () => {
      cancelled = true;
    };
  }, [propertyId]);

  const nights = nightsBetween(checkIn, checkOut);
  const isShortLet = property?.listingType === "short_let";
  const nightly = property?.pricePerNight ?? 0;
  const bookingNights =
    nights > 0 ? nights : isShortLet ? Math.max(property?.minNights || 2, 2) : 0;
  const total =
    isShortLet && nightly > 0 ? nightly * Math.max(bookingNights, 1) : 0;

  const handleBook = React.useCallback(() => {
    if (!property) return;

    if (!isLoggedInGuest && guestPreview) {
      setShowGuestModal(true);
      return;
    }

    if (!isLoggedInGuest) {
      void router.push(
        `/auth/login?redirect=${encodeURIComponent(`/property/${property.id}`)}`,
      );
      return;
    }

    if (isShortLet) {
      if (!checkIn || !checkOut) {
        showToast("Please select check-in and check-out dates.", "info");
        return;
      }
      if (nights < (property.minNights || 1)) {
        showToast(
          `Minimum stay is ${property.minNights} night${property.minNights === 1 ? "" : "s"}.`,
          "error",
        );
        return;
      }
      if (property.maxNights > 0 && nights > property.maxNights) {
        showToast(`Maximum stay is ${property.maxNights} nights.`, "error");
        return;
      }

      // Mock gateway redirect until booking APIs are ready.
      const params = new URLSearchParams({
        propertyId: property.id,
        propertyName: property.name,
        nights: String(nights),
        amount: String(total),
        guests: String(guests),
        checkIn,
        checkOut,
        reference: `MOCK-${Date.now()}`,
      });
      void router.push(`/booking/confirmation?${params.toString()}`);
      return;
    }

    showToast(
      "Application submitted (mock). We'll notify the landlord.",
      "success",
    );
  }, [
    property,
    isLoggedInGuest,
    guestPreview,
    isShortLet,
    checkIn,
    checkOut,
    nights,
    total,
    guests,
    router,
    showToast,
  ]);

  if (router.isFallback || loading || (!property && !error && !guestPreview)) {
    return (
      <>
        {isLoggedInGuest ? <GuestHeader /> : <LandingHeader />}
        <div className="flex min-h-[50vh] items-center justify-center bg-white">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--brand-main)] border-t-transparent" />
        </div>
        {isLoggedInGuest ? null : <LandingFooter />}
      </>
    );
  }

  if (error || (!property && !guestPreview)) {
    return (
      <>
        {isLoggedInGuest ? <GuestHeader /> : <LandingHeader />}
        <div className="flex min-h-[50vh] items-center justify-center bg-white px-4">
          <p className="text-center text-red-600">
            {error ?? "Property not found"}
          </p>
        </div>
        {isLoggedInGuest ? null : <LandingFooter />}
      </>
    );
  }

  if (guestPreview && !property) {
    const loginHref = `/auth/login?redirect=${encodeURIComponent(`/property/${id}`)}`;
    return (
      <>
        <Head>
          <title>Property | Dwelliva</title>
        </Head>
        <div className="flex min-h-screen flex-col bg-white">
          <LandingHeader />
          <main className="flex flex-1 flex-col px-4 py-10 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-2xl">
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-6 shadow-sm">
                <h1 className="text-lg font-semibold text-blue-950">
                  Sign in to view this property
                </h1>
                <p className="mt-2 text-sm text-blue-900/90">
                  This listing is available to signed-in users. Log in to see
                  full details and continue booking.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href={loginHref}
                    className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="inline-flex items-center justify-center rounded-lg border border-blue-300 bg-white px-4 py-2.5 text-sm font-semibold text-blue-900 transition hover:bg-blue-100/60"
                  >
                    Create an account
                  </Link>
                  <Link
                    href="/properties"
                    className="inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium text-blue-900 underline-offset-4 hover:underline"
                  >
                    Browse properties
                  </Link>
                </div>
              </div>
            </div>
          </main>
          <LandingFooter />
        </div>
      </>
    );
  }

  if (!property) return null;

  const gallery =
    property.images && property.images.length > 0
      ? property.images
      : [property.image];
  const mainImage = gallery[activeImageIndex] || gallery[0];
  const thumbs = gallery.slice(0, 3);
  while (thumbs.length < 3) {
    thumbs.push(gallery[0]);
  }

  const parkingLabel =
    property.parkingSpace === true
      ? "300SQM"
      : property.parkingSpace === false
        ? "Not available"
        : "N/A";

  const loginHref = `/auth/login?redirect=${encodeURIComponent(`/property/${property.id}`)}`;
  const signupHref = `/auth/signup`;
  const homeHref = isLoggedInGuest ? "/guest" : "/";
  const categoryLabel = isShortLet
    ? "Serviced Apartment"
    : property.propertyType || "Property";

  return (
    <>
      <Head>
        <title>{property.name} | Dwelliva</title>
        <meta name="description" content={property.description} />
      </Head>
      <div className="flex min-h-screen flex-col bg-white">
        {isLoggedInGuest ? <GuestHeader /> : <LandingHeader />}
        <main
          className={`relative flex-1 ${guestPreview ? "overflow-hidden" : ""}`}
        >
          <div className="mx-auto max-w-7xl px-4 pt-5 sm:px-6 lg:px-8">
            <nav className="text-sm text-gray-500">
              <Link href={homeHref} className="hover:text-[var(--brand-main)]">
                Home
              </Link>
              <span className="mx-2">›</span>
              <span className="text-gray-800">{categoryLabel}</span>
            </nav>
          </div>

          <div
            className={`mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 ${
              guestPreview && showGuestModal ? "select-none blur-[1.2px]" : ""
            }`}
          >
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_180px] lg:grid-cols-[1fr_200px]"
            >
              <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-gray-200 sm:aspect-[16/9]">
                <Image
                  src={mainImage}
                  alt={property.name}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-1">
                {thumbs.map((src, idx) => (
                  <button
                    key={`${src}-${idx}`}
                    type="button"
                    onClick={() =>
                      setActiveImageIndex(
                        Math.min(idx, Math.max(gallery.length - 1, 0)),
                      )
                    }
                    className={`relative aspect-[16/10] overflow-hidden rounded-2xl bg-gray-200 transition ${
                      activeImageIndex === idx
                        ? "ring-2 ring-[var(--brand-main)] ring-offset-2"
                        : "hover:opacity-90"
                    }`}
                  >
                    <Image
                      src={src}
                      alt={`${property.name} preview ${idx + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            </motion.div>

            <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(300px,0.9fr)] lg:items-start">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
                  {property.name}
                </h1>
                <p className="mt-3 flex items-start gap-2 text-base text-gray-600">
                  <MapPin className="mt-0.5 h-5 w-5 flex-shrink-0 text-[var(--brand-main)]" />
                  <span>{property.address}</span>
                </p>

                <p className="mt-4 text-xs font-medium uppercase tracking-[0.08em] text-gray-400">
                  Built : {property.yearBuilt || "N/A"}
                  <span className="mx-3 text-gray-300">|</span>
                  Parking Space : {parkingLabel}
                </p>

                <p className="mt-6 max-w-3xl text-sm leading-7 text-gray-600 md:text-base">
                  {property.description}
                </p>

                <div className="mt-8">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full border border-gray-300 text-gray-500">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                    <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-400">
                      Amenities
                    </h3>
                  </div>

                  {property.amenities.length === 0 ? (
                    <p className="mt-4 text-sm text-gray-500">
                      No amenities listed for this property.
                    </p>
                  ) : (
                    <div className="mt-4 flex flex-wrap gap-3">
                      {property.amenities.map((amenity) => {
                        const Icon = amenityIconFor(amenity);
                        return (
                          <div
                            key={amenity}
                            className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3.5 py-2 text-sm text-gray-700"
                          >
                            <Icon className="h-4 w-4 shrink-0 text-gray-500" />
                            <span>{amenity}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {isShortLet ? (
                  <div className="mt-10">
                    <h3 className="text-lg font-bold text-gray-900">
                      House Rules & Info
                    </h3>
                    <div className="mt-4 space-y-4">
                      <div className="flex items-start gap-3 text-sm text-gray-700">
                        <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-gray-500" />
                        <p>
                          Check-in from {property.checkInTime} • Check-out by{" "}
                          {property.checkOutTime}
                        </p>
                      </div>
                      <div className="flex items-start gap-3 text-sm text-gray-700">
                        <Search className="mt-0.5 h-5 w-5 shrink-0 text-gray-500" />
                        <p>
                          Minimum {property.minNights} night
                          {property.minNights === 1 ? "" : "s"} • Maximum{" "}
                          {property.maxNights} nights
                        </p>
                      </div>
                      <div className="flex items-start gap-3 text-sm text-gray-700">
                        <Shield className="mt-0.5 h-5 w-5 shrink-0 text-gray-500" />
                        <ul className="list-disc space-y-1 pl-4">
                          {property.houseRules.map((rule) => (
                            <li key={rule}>{rule}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ) : null}

                <div className="mt-10">
                  <h3 className="text-lg font-bold text-gray-900">Location</h3>
                  <p className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4 text-[var(--brand-main)]" />
                    {property.locationLabel}
                  </p>
                  <div className="relative mt-4 overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-slate-100 via-blue-50 to-slate-200">
                    <div className="flex aspect-[16/7] items-center justify-center p-6">
                      <div className="text-center">
                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--brand-main)] text-white shadow-lg">
                          <Building2 className="h-6 w-6" />
                        </div>
                        <div className="inline-flex rounded-full bg-white px-4 py-2 text-sm font-medium text-gray-800 shadow-md">
                          Exact location provided after booking
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-10">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-bold text-gray-900">Reviews</h3>
                    <Star className="h-4 w-4 fill-[var(--brand-main)] text-[var(--brand-main)]" />
                    <span className="text-sm font-semibold text-[var(--brand-main)]">
                      {property.rating.toFixed(1)}
                    </span>
                    <span className="text-sm text-gray-500">
                      ({property.reviewCount} reviews)
                    </span>
                  </div>

                  <div className="mt-5 space-y-4">
                    {property.reviews.slice(0, visibleReviews).map((review) => (
                      <div
                        key={review.id}
                        className="rounded-2xl border border-gray-200 bg-white p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-700">
                              {review.author.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900">
                                {review.author}
                              </p>
                              <p className="text-xs text-gray-500">
                                {review.dateLabel}
                              </p>
                            </div>
                          </div>
                          <span className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--brand-main)]">
                            <Star className="h-3.5 w-3.5 fill-[var(--brand-main)] text-[var(--brand-main)]" />
                            {review.rating}
                          </span>
                        </div>
                        <p className="mt-3 text-sm italic leading-6 text-gray-700">
                          &ldquo;{review.comment}&rdquo;
                        </p>
                      </div>
                    ))}
                  </div>

                  {visibleReviews < property.reviews.length ? (
                    <button
                      type="button"
                      onClick={() =>
                        setVisibleReviews((count) =>
                          Math.min(count + 3, property.reviews.length),
                        )
                      }
                      className="mt-4 w-full rounded-xl border border-gray-900 bg-white py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
                    >
                      Load More
                    </button>
                  ) : null}
                </div>
              </div>

              <motion.aside
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.05 }}
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm lg:sticky lg:top-24"
              >
                {isShortLet ? (
                  <>
                    <p className="text-2xl font-bold text-gray-900">
                      ₦{nightly.toLocaleString("en-NG")}{" "}
                      <span className="text-base font-medium text-gray-500">
                        / night
                      </span>
                    </p>

                    <div className="mt-4 overflow-hidden rounded-xl border border-gray-200">
                      <div className="grid grid-cols-2 divide-x divide-gray-200 border-b border-gray-200">
                        <label className="block px-3 py-2.5">
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                            Check-in
                          </span>
                          <input
                            type="date"
                            value={checkIn}
                            onChange={(e) => setCheckIn(e.target.value)}
                            className="mt-1 w-full border-0 bg-transparent p-0 text-sm text-gray-900 outline-none focus:ring-0"
                          />
                        </label>
                        <label className="block px-3 py-2.5">
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                            Checkout
                          </span>
                          <input
                            type="date"
                            value={checkOut}
                            onChange={(e) => setCheckOut(e.target.value)}
                            className="mt-1 w-full border-0 bg-transparent p-0 text-sm text-gray-900 outline-none focus:ring-0"
                          />
                        </label>
                      </div>
                      <div className="flex items-center justify-between px-3 py-2.5">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                            Guests
                          </p>
                          <p className="text-sm text-gray-900">
                            {guests} guest{guests === 1 ? "" : "s"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            aria-label="Decrease guests"
                            onClick={() =>
                              setGuests((count) => Math.max(1, count - 1))
                            }
                            className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            aria-label="Increase guests"
                            onClick={() =>
                              setGuests((count) => Math.min(12, count + 1))
                            }
                            className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-3 border-t border-gray-100 pt-4">
                      <div className="relative h-10 w-10 overflow-hidden rounded-full bg-gray-200">
                        {property.hostAvatarUrl ? (
                          <Image
                            src={property.hostAvatarUrl}
                            alt={property.hostName}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-gray-600">
                            {property.hostName.trim().charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                          Host
                        </p>
                        <p className="text-sm font-semibold text-gray-900">
                          {property.hostName}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleBook}
                      className="mt-5 flex w-full items-center justify-center rounded-xl bg-gray-900 py-3.5 text-sm font-semibold text-white transition hover:bg-gray-800"
                    >
                      Book
                    </button>

                    <div className="mt-4 flex items-center justify-between text-sm">
                      <span className="text-gray-500">
                        Total (x {bookingNights} Night
                        {bookingNights === 1 ? "" : "s"})
                      </span>
                      <span className="font-bold text-gray-900">
                        ₦{total.toLocaleString("en-NG")}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-4">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                          Monthly Rent
                        </p>
                        <p className="mt-1 text-2xl font-bold text-gray-900">
                          {property.monthlyRent > 0
                            ? `₦${property.monthlyRent.toLocaleString("en-NG")}`
                            : "Contact"}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 border-t border-gray-100 pt-4">
                        <div className="relative h-10 w-10 overflow-hidden rounded-full bg-gray-200">
                          <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-gray-600">
                            {property.hostName.trim().charAt(0).toUpperCase()}
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                            Landlord
                          </p>
                          <p className="text-sm font-semibold text-gray-900">
                            {property.hostName}
                          </p>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (isLoggedInGuest) {
                          void router.push("/guest/messages");
                          return;
                        }
                        if (guestPreview) {
                          setShowGuestModal(true);
                          return;
                        }
                        void router.push(loginHref);
                      }}
                      className="mt-5 flex w-full items-center justify-center rounded-xl border border-gray-900 bg-white py-3.5 text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
                    >
                      Contact Landlord
                    </button>
                    <button
                      type="button"
                      onClick={handleBook}
                      className="mt-3 flex w-full items-center justify-center rounded-xl bg-gray-900 py-3.5 text-sm font-semibold text-white transition hover:bg-gray-800"
                    >
                      Apply To Rent
                    </button>
                  </>
                )}
              </motion.aside>
            </div>

            {similar.length > 0 ? (
              <motion.section
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.45 }}
                className="mt-16"
              >
                <h2 className="text-xl font-bold text-gray-900">
                  Similar Properties
                </h2>
                <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {similar.map((item) => (
                    <ShortStayPropertyCard key={item.id} property={item} />
                  ))}
                </div>
              </motion.section>
            ) : null}
          </div>

          {guestPreview && showGuestModal && id ? (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
              onClick={() => setShowGuestModal(false)}
            >
              <motion.div
                initial={{ opacity: 0, y: 18, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.25 }}
                className="relative w-full max-w-lg rounded-2xl bg-white px-6 py-8 text-center shadow-2xl sm:px-10"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => setShowGuestModal(false)}
                  className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white transition hover:bg-red-600"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
                <h3 className="text-xl font-bold text-gray-900">
                  Continue to book
                </h3>
                <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-gray-600">
                  Log in or create a free guest account to book this stay or
                  contact the host.
                </p>
                <div className="mt-8 grid grid-cols-2 gap-3">
                  <Link
                    href={loginHref}
                    className="inline-flex items-center justify-center rounded-xl border border-gray-900 px-4 py-2.5 text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
                  >
                    Log In
                  </Link>
                  <Link
                    href={signupHref}
                    className="inline-flex items-center justify-center rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
                  >
                    Create An Account
                  </Link>
                </div>
              </motion.div>
            </div>
          ) : null}

          {isLoggedInGuest ? null : <StatsBar />}
        </main>
        {isLoggedInGuest ? null : <LandingFooter />}
      </div>
    </>
  );
}
