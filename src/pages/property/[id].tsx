import * as React from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  MapPin,
  DollarSign,
  SlidersHorizontal,
  User,
  Droplets,
  ParkingCircle,
  Wifi,
  Shield,
  Zap,
  Check,
  X,
} from "lucide-react";
import {
  LandingHeader,
  LandingFooter,
  StatsBar,
  LandingPropertyCard,
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
import type { Property } from "@/data/mockLandlordData";

const amenityIconFor = (label: string) => {
  const key = label.toLowerCase();
  if (key.includes("water")) return Droplets;
  if (key.includes("park") || key.includes("car")) return ParkingCircle;
  if (key.includes("internet") || key.includes("fiber") || key.includes("wifi"))
    return Wifi;
  if (key.includes("security") || key.includes("gate")) return Shield;
  if (key.includes("power") || key.includes("electric")) return Zap;
  if (key.includes("refrigerat") || key.includes("air") || key.includes("club"))
    return Check;
  return Check;
};

export default function PropertyDetailPage() {
  const router = useRouter();
  const { user } = useUser();
  const { showToast } = useToast();
  const id = router.query.id as string | undefined;
  const isLoggedInGuest = user?.role === "guest";
  const [property, setProperty] = React.useState<Property | null>(null);
  const [similar, setSimilar] = React.useState<Property[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [guestPreview, setGuestPreview] = React.useState(false);
  const [showGuestModal, setShowGuestModal] = React.useState(false);
  const [activeImageIndex, setActiveImageIndex] = React.useState(0);
  const propertyId = property?.id;

  React.useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setGuestPreview(false);
    setShowGuestModal(false);
    setActiveImageIndex(0);

    void (async () => {
      const authed = await getProperty(id);
      if (cancelled) return;

      if (authed.success) {
        setProperty(mapPropertyDTOToProperty(authed.data));
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
            setProperty(mapPropertyDTOToPublicListingProperty(dto));
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
    getPropertiesQuery().then((result) => {
      if (cancelled || !result.success) return;
      const list = result.data
        .map(mapPropertyDTOToPublicListingProperty)
        .filter((p) => p.id !== propertyId && p.status === "active")
        .slice(0, 3);
      setSimilar(list);
    });
    return () => {
      cancelled = true;
    };
  }, [propertyId]);

  if (router.isFallback || loading || (!property && !error && !guestPreview)) {
    return (
      <>
        {isLoggedInGuest ? <GuestHeader /> : <LandingHeader />}
        <div className="flex min-h-[50vh] items-center justify-center bg-[#F9FAFB]">
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
        <div className="flex min-h-[50vh] items-center justify-center bg-[#F9FAFB] px-4">
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
        <div className="flex min-h-screen flex-col bg-[#F9FAFB]">
          <LandingHeader />
          <main className="flex flex-1 flex-col px-4 py-10 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-2xl">
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-6 shadow-sm">
                <h1 className="text-lg font-semibold text-blue-950">
                  Sign in to view this property
                </h1>
                <p className="mt-2 text-sm text-blue-900/90">
                  This listing is available to signed-in users. Log in to see
                  full details and contact the landlord.
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

  if (!property) {
    return null;
  }

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

  return (
    <>
      <Head>
        <title>{property.name} | Dwelliva</title>
        <meta name="description" content={property.address} />
      </Head>
      <div className="flex min-h-screen flex-col bg-[#F9FAFB]">
        {isLoggedInGuest ? <GuestHeader /> : <LandingHeader />}
        <main
          className={`relative flex-1 bg-[#F9FAFB] ${guestPreview ? "overflow-hidden" : ""}`}
        >
          <div className="mx-auto max-w-7xl px-4 pt-5 sm:px-6 lg:px-8">
            <nav className="text-sm text-gray-500">
              <Link href={homeHref} className="hover:text-[var(--brand-main)]">
                Home
              </Link>
              <span className="mx-2">›</span>
              <span className="text-gray-800">{property.name}</span>
            </nav>
          </div>

          <div
            className={`mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 ${
              guestPreview && showGuestModal ? "select-none blur-[1.2px]" : ""
            }`}
          >
            {/* Full-width gallery */}
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

            {/* Details + pricing card */}
            <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.9fr)] lg:items-start">
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
                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                      {property.amenities.map((amenity) => {
                        const Icon = amenityIconFor(amenity);
                        return (
                          <div
                            key={amenity}
                            className="flex items-center gap-2.5 rounded-full border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                          >
                            <Icon className="h-4 w-4 shrink-0 text-gray-500" />
                            <span className="truncate">{amenity}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <motion.aside
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.05 }}
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm lg:sticky lg:top-24"
              >
                <div className="divide-y divide-gray-100">
                  <div className="flex items-center justify-between gap-4 py-4 first:pt-1">
                    <div className="flex items-center gap-3 text-gray-500">
                      <DollarSign className="h-5 w-5" />
                      <span className="text-xs font-semibold uppercase tracking-wide">
                        Rent
                      </span>
                    </div>
                    <p className="text-right text-base font-bold text-gray-900">
                      {property.monthlyRent > 0
                        ? `₦${property.monthlyRent.toLocaleString()}`
                        : "Contact"}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-4 py-4">
                    <div className="flex items-center gap-3 text-gray-500">
                      <SlidersHorizontal className="h-5 w-5" />
                      <span className="text-xs font-semibold uppercase tracking-wide">
                        Rent Type
                      </span>
                    </div>
                    <p className="text-right text-base font-bold text-gray-900">
                      Monthly
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-4 py-4">
                    <div className="flex items-center gap-3 text-gray-500">
                      <User className="h-5 w-5" />
                      <span className="text-xs font-semibold uppercase tracking-wide">
                        Landlord
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative h-8 w-8 overflow-hidden rounded-full bg-gray-200">
                        {property.landlordAvatarUrl ? (
                          <Image
                            src={property.landlordAvatarUrl}
                            alt={property.landlordName || "Landlord"}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-gray-600">
                            {(property.landlordName || "L")
                              .trim()
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                        )}
                      </div>
                      <p className="max-w-[140px] truncate text-right text-sm font-bold text-gray-900">
                        {property.landlordName &&
                        property.landlordName !== "Contact for details"
                          ? property.landlordName
                          : "Contact for details"}
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
                  className={`mt-2 flex w-full items-center justify-center rounded-xl py-3.5 text-sm font-semibold transition ${
                    isLoggedInGuest
                      ? "border border-gray-900 bg-white text-gray-900 hover:bg-gray-50"
                      : "bg-gray-900 text-white hover:bg-gray-800"
                  }`}
                >
                  Contact Landlord
                </button>

                {isLoggedInGuest ? (
                  <button
                    type="button"
                    onClick={() =>
                      showToast(
                        "Application submitted (mock). We'll notify the landlord.",
                        "success",
                      )
                    }
                    className="mt-3 flex w-full items-center justify-center rounded-xl bg-gray-900 py-3.5 text-sm font-semibold text-white transition hover:bg-gray-800"
                  >
                    Apply To Rent
                  </button>
                ) : null}
              </motion.aside>
            </div>

            {similar.length > 0 && (
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
                  {similar.map((p) => (
                    <LandingPropertyCard key={p.id} property={p} />
                  ))}
                </div>
              </motion.section>
            )}
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
                  Contact the Landlord
                </h3>
                <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-gray-600">
                  To contact the landlord and get more details about this
                  property, please log in or create a free account.
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
