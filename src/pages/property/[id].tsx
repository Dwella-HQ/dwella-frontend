import * as React from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Link from "next/link";
import Image from "next/image";
import {
  MapPin,
  DollarSign,
  FileText,
  User,
  Calendar,
  Car,
  XCircle,
} from "lucide-react";
import {
  LandingHeader,
  LandingFooter,
  StatsBar,
  LandingPropertyCard,
} from "@/components/landing";
import {
  getProperty,
  getPropertiesQuery,
  mapPropertyDTOToProperty,
  mapPropertyDTOToPublicListingProperty,
} from "@/api/properties";
import type { Property } from "@/data/mockLandlordData";

export default function PropertyDetailPage() {
  const router = useRouter();
  const id = router.query.id as string | undefined;
  const [property, setProperty] = React.useState<Property | null>(null);
  const [similar, setSimilar] = React.useState<Property[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [guestPreview, setGuestPreview] = React.useState(false);
  const [showGuestModal, setShowGuestModal] = React.useState(false);

  React.useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setGuestPreview(false);
    setShowGuestModal(false);

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
    if (!property) return;
    let cancelled = false;
    getPropertiesQuery().then((result) => {
      if (cancelled || !result.success) return;
      const list = result.data
        .map(mapPropertyDTOToPublicListingProperty)
        .filter((p) => p.id !== property.id && p.status === "active")
        .slice(0, 3);
      setSimilar(list);
    });
    return () => {
      cancelled = true;
    };
  }, [property?.id]);

  if (router.isFallback || loading || (!property && !error && !guestPreview)) {
    return (
      <>
        <LandingHeader />
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--brand-main)] border-t-transparent" />
        </div>
        <LandingFooter />
      </>
    );
  }

  if (error || (!property && !guestPreview)) {
    return (
      <>
        <LandingHeader />
        <div className="flex min-h-[50vh] items-center justify-center px-4">
          <p className="text-center text-red-600">
            {error ?? "Property not found"}
          </p>
        </div>
        <LandingFooter />
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
        <div className="flex min-h-screen flex-col bg-gray-50">
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
                    href="/auth/signup?role=tenant"
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

  return (
    <>
      <Head>
        <title>{property.name} | Dwelliva</title>
        <meta name="description" content={property.address} />
      </Head>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <LandingHeader />
        <main
          className={`relative flex-1 ${guestPreview ? "overflow-hidden" : ""}`}
        >
          <div className="border-b border-gray-200 bg-white px-4 py-2 text-sm text-gray-600">
            <div className="mx-auto max-w-7xl">
              <Link href="/" className="hover:text-[var(--brand-main)]">
                Home
              </Link>
              <span className="mx-2">›</span>
              <span className="text-gray-900">{property.name}</span>
            </div>
          </div>
          <div
            className={`mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 ${
              guestPreview && showGuestModal ? "select-none blur-[1.2px]" : ""
            }`}
          >
            <div className="grid gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_150px]">
                  <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-gray-100">
                    <Image
                      src={property.image}
                      alt={property.name}
                      fill
                      className="object-cover"
                      priority
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-1">
                    {[0, 1, 2].map((idx) => (
                      <div
                        key={idx}
                        className="relative aspect-[16/10] overflow-hidden rounded-lg bg-gray-100"
                      >
                        <Image
                          src={property.image}
                          alt={`${property.name} preview ${idx + 1}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <h1 className="mt-6 text-2xl font-bold text-gray-900">
                  {property.name}
                </h1>
                <p className="mt-2 flex items-center gap-2 text-gray-600">
                  <MapPin className="h-5 w-5 flex-shrink-0" />
                  {property.address}
                </p>
                <div className="mt-5 flex flex-wrap gap-5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <p className="inline-flex items-center gap-2">
                    <Calendar className="h-4 w-4" /> Built: 2018
                  </p>
                  <p className="inline-flex items-center gap-2">
                    <Car className="h-4 w-4" /> Parking Space: 300sqm
                  </p>
                </div>
                <div className="mt-6">
                  <h3 className="text-sm font-semibold uppercase text-gray-700">
                    Amenities
                  </h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {property.amenities.map((a) => (
                      <span
                        key={a}
                        className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm text-gray-700"
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <div className="sticky top-24 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="text-xs text-gray-500">RENT</p>
                        <p className="font-semibold text-gray-900">
                          N{property.monthlyRent.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="text-xs text-gray-500">RENT TYPE</p>
                        <p className="font-medium text-gray-900">Monthly</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="text-xs text-gray-500">LANDLORD</p>
                        <p className="font-medium text-gray-900">
                          Contact for details
                        </p>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (guestPreview) {
                        setShowGuestModal(true);
                        return;
                      }
                      void router.push(
                        "/auth/login?redirect=/property/" + property.id,
                      );
                    }}
                    className="mt-6 flex w-full items-center justify-center rounded-lg bg-gray-900 py-3 text-sm font-medium text-white hover:bg-gray-800"
                  >
                    Contact Landlord
                  </button>
                </div>
              </div>
            </div>
            {similar.length > 0 && (
              <section className="mt-16">
                <h2 className="text-xl font-bold text-gray-900">
                  Similar Properties
                </h2>
                <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {similar.map((p) => (
                    <LandingPropertyCard key={p.id} property={p} />
                  ))}
                </div>
              </section>
            )}
          </div>
          {guestPreview && showGuestModal && id ? (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
              onClick={() => setShowGuestModal(false)}
            >
              <div
                className="w-full max-w-xl rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="mb-4 flex items-start justify-between gap-4">
                  <h3 className="text-xl font-bold text-gray-900">
                    Contact the Landlord
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowGuestModal(false)}
                    className="text-red-500 hover:text-red-600"
                  >
                    <XCircle className="h-6 w-6" />
                  </button>
                </div>
                <p className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                  To contact the landlord and get more details about this
                  property, please log in or create a free account.
                </p>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <Link
                    href={`/auth/login?redirect=${encodeURIComponent(`/property/${id}`)}`}
                    className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-100"
                  >
                    Log In
                  </Link>
                  <Link
                    href="/auth/signup?role=tenant"
                    className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
                  >
                    Create An Account
                  </Link>
                </div>
              </div>
            </div>
          ) : null}
          <StatsBar />
        </main>
        <LandingFooter />
      </div>
    </>
  );
}
