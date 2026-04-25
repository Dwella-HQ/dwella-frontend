import * as React from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Link from "next/link";
import Image from "next/image";
import { MapPin, DollarSign, FileText, User } from "lucide-react";
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

  React.useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    getProperty(id)
      .then((result) => {
        if (cancelled) return;
        if (result.success) {
          setProperty(mapPropertyDTOToProperty(result.data));
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

  if (router.isFallback || loading || (!property && !error)) {
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

  if (error || !property) {
    return (
      <>
        <LandingHeader />
        <div className="flex min-h-[50vh] items-center justify-center">
          <p className="text-red-600">{error ?? "Property not found"}</p>
        </div>
        <LandingFooter />
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{property.name} | DWELLA NG</title>
        <meta name="description" content={property.address} />
      </Head>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <LandingHeader />
        <main className="flex-1">
          <div className="border-b border-gray-200 bg-white px-4 py-2 text-sm text-gray-600">
            <div className="mx-auto max-w-7xl">
              <Link href="/" className="hover:text-[var(--brand-main)]">
                Home
              </Link>
              <span className="mx-2">›</span>
              <span className="text-gray-900">{property.name}</span>
            </div>
          </div>
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="grid gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-gray-100">
                  <Image
                    src={property.image}
                    alt={property.name}
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
                <h1 className="mt-6 text-2xl font-bold text-gray-900">
                  {property.name}
                </h1>
                <p className="mt-2 flex items-center gap-2 text-gray-600">
                  <MapPin className="h-5 w-5 flex-shrink-0" />
                  {property.address}
                </p>
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
                  <Link
                    href={"/auth/login?redirect=/property/" + property.id}
                    className="mt-6 flex w-full items-center justify-center rounded-lg bg-gray-900 py-3 text-sm font-medium text-white hover:bg-gray-800"
                  >
                    Contact Landlord
                  </Link>
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
          <StatsBar />
        </main>
        <LandingFooter />
      </div>
    </>
  );
}
