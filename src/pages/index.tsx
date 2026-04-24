import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  BellRing,
  CheckCircle2,
  ClipboardSignature,
  CreditCard,
  Search,
  ShieldCheck,
  TrendingUp,
  Wrench,
} from "lucide-react";
import {
  LandingHeader,
  LandingFooter,
  StatsBar,
  LandingPropertyCard,
} from "@/components/landing";
import { getProperties } from "@/api/properties";
import { mapPropertyDTOToProperty } from "@/api/properties/mapProperty";
import type { Property } from "@/data/mockLandlordData";

const FEATURE_CARDS = [
  {
    icon: Search,
    title: "Smart Property Search",
    desc: "Filter by exact amenities, commute times, and verified neighborhood safety scores.",
    color: "bg-[#2C8ED2]",
  },
  {
    icon: ShieldCheck,
    title: "100% Verified Listings",
    desc: "Every property and landlord is verified to keep your rental experience safe.",
    color: "bg-[#22C55E]",
  },
  {
    icon: ClipboardSignature,
    title: "Digital Lease Signing",
    desc: "Review, negotiate, and sign your tenancy agreements completely online.",
    color: "bg-[#A855F7]",
  },
  {
    icon: CreditCard,
    title: "Secure Payments",
    desc: "Pay rent securely and never miss a due date with automatic reminders.",
    color: "bg-[#4F46E5]",
  },
  {
    icon: Wrench,
    title: "Maintenance Tracking",
    desc: "Log repair requests, add photos, and track progress from your dashboard.",
    color: "bg-[#F97316]",
  },
  {
    icon: BellRing,
    title: "Instant Notifications",
    desc: "Receive alerts when properties match your criteria or requests are approved.",
    color: "bg-[#F43F5E]",
  },
];

export default function LandingPage() {
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

  const featuredProperties = React.useMemo(
    () => properties.slice(0, 6),
    [properties],
  );

  return (
    <>
      <Head>
        <title>DWELLA NG – Find. Rent. Manage.</title>
        <meta
          name="description"
          content="Discover homes, manage tenants, and automate rentals with DWELLA NG."
        />
      </Head>
      <div className="min-h-screen flex flex-col bg-[#F3F5F8] font-sans text-[#0F172A]">
        <LandingHeader />
        <main className="flex-1">
          <section className="relative overflow-hidden bg-[#0B4A9E] md:min-h-[80vh]">
            <div className="absolute inset-0">
              <Image
                src="https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=1800&q=80"
                alt="Apartment exterior"
                fill
                className="object-cover opacity-25"
                sizes="100vw"
                priority
              />
              <div className="absolute inset-0 bg-[#0B4A9E]/80" />
            </div>
            <div className="relative mx-auto flex max-w-7xl flex-col justify-center px-4 pb-28 pt-24 text-center sm:px-6 lg:px-8 md:min-h-[80vh] md:pb-20 md:pt-20">
              <h1 className="mx-auto max-w-5xl text-4xl font-bold leading-tight text-white md:text-[70px] md:font-bold md:leading-[77px]">
                Manage Properties. Automate Operations. Grow Faster.
              </h1>
              <p className="mx-auto mt-6 max-w-3xl text-base font-medium text-white/90 md:text-[18px] md:font-medium md:leading-[28px]">
                Streamline tenant management, rent collection, maintenance
                tracking, and reporting from one powerful property management
                platform.
              </p>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-4 md:mt-12">
                <Link
                  href="/properties"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-3 text-sm font-semibold text-[#103B73] shadow hover:bg-gray-100 md:h-[63px] md:w-[276px] md:rounded-[14px] md:px-12 md:py-[17px] md:text-base"
                >
                  Explore Managed Properties <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/auth/signup?role=landlord"
                  className="inline-flex items-center justify-center rounded-xl border border-white/50 px-8 py-3 text-sm font-semibold text-white hover:bg-white/10 md:h-[63px] md:w-[276px] md:rounded-[14px] md:px-12 md:py-[17px] md:text-base"
                >
                  Start Managing Now
                </Link>
              </div>
            </div>
          </section>

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <section
              id="about"
              className="grid gap-10 py-20 md:min-h-[80vh] md:grid-cols-2 md:items-center"
            >
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#1F93D0]">
                  Who We Are
                </p>
                <h2 className="mt-3 text-3xl font-bold text-[#111827] md:text-6xl">
                  Simplifying Real Estate in Nigeria
                </h2>
                <p className="mt-6 text-lg leading-8 text-[#4B5563] md:text-xl md:leading-9">
                  Dwella is a modern property platform designed to simplify how
                  people find and manage homes in Nigeria through verified
                  listings, secure payments, and reliable property management
                  tools.
                </p>
                <Link
                  href="/about"
                  className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[#0A4C95] md:text-base"
                >
                  Learn More <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="relative">
                <div className="relative aspect-[4/3] overflow-hidden rounded-3xl shadow-xl">
                  <Image
                    src="https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=1300&q=80"
                    alt="Aerial city view"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                </div>
                <Link
                  href="/auth/signup?role=landlord"
                  className="absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#0F63DE] to-[#0CC6FA] px-5 py-2.5 text-sm font-medium text-white shadow-lg"
                >
                  List Your Property
                </Link>
              </div>
            </section>

            <section className="grid gap-6 border-y border-[#D9DEE7] py-16 md:min-h-[80vh] md:grid-cols-2 md:items-center">
              <article className="rounded-3xl border border-[#E7EAF0] bg-[#F5F8FC] p-8 shadow-sm">
                <p className="inline-flex rounded-full bg-[#DEE9F8] px-3 py-1 text-xs font-medium text-[#184A91]">
                  For Tenants
                </p>
                <h3 className="mt-5 text-4xl font-bold leading-tight text-[#111827] md:text-5xl">
                  Find Your Next Home Without Stress
                </h3>
                <ul className="mt-6 space-y-4 text-[#334155]">
                  {[
                    "Browse verified listings only",
                    "No unnecessary agent hassle",
                    "Secure and transparent payments",
                    "Easy communication with landlords",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-3 text-base md:text-lg"
                    >
                      <CheckCircle2 className="h-5 w-5 text-[#2C8ED2]" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/properties"
                  className="mt-8 inline-flex rounded-xl bg-[#0A4C95] px-7 py-3 text-sm font-semibold text-white shadow hover:bg-[#083E7C]"
                >
                  Find a Home
                </Link>
              </article>

              <article className="rounded-3xl bg-[#050F3A] p-8 text-white shadow-xl">
                <p className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/90">
                  For Landlords
                </p>
                <h3 className="mt-5 text-4xl font-bold leading-tight md:text-5xl">
                  Manage Properties Smarter
                </h3>
                <ul className="mt-6 space-y-4 text-white/90">
                  {[
                    "List properties easily and fast",
                    "Automate your rent collection",
                    "Track tenants and real-time occupancy",
                    "Handle maintenance requests digitally",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-3 text-base md:text-lg"
                    >
                      <CheckCircle2 className="h-5 w-5 text-[#1FC7FF]" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/auth/signup?role=landlord"
                  className="mt-8 inline-flex w-full items-center justify-center rounded-xl bg-white px-7 py-3 text-sm font-semibold text-[#050F3A]"
                >
                  List Property
                </Link>
              </article>
            </section>

            <section id="features" className="py-14 md:py-16">
              <h2 className="text-center text-3xl font-bold tracking-tight text-[#111827] md:text-5xl">
                Built for Modern Property Management
              </h2>
              <p className="mx-auto mt-2 max-w-3xl text-center text-sm text-[#6B7280] md:text-base">
                Everything you need to automate workflows and scale your real
                estate portfolio, all in one dashboard.
              </p>
              <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {FEATURE_CARDS.map(({ icon: Icon, title, desc, color }) => (
                  <article
                    key={title}
                    className="rounded-2xl border border-[#E5E7EB] bg-white p-5 md:p-6"
                  >
                    <span
                      className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${color} text-white shadow-sm`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <h3 className="mt-4 text-[22px] font-bold leading-tight text-[#111827] md:text-[40px]">
                      {title}
                    </h3>
                    <p className="mt-2.5 text-sm leading-7 text-[#6B7280] md:text-base">
                      {desc}
                    </p>
                  </article>
                ))}
              </div>
              <div className="mt-7 text-center">
                <Link
                  href="/features"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#0A4C95]"
                >
                  Learn More <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </section>
          </div>

          <section className="border-y border-[#D9DEE7] bg-[#F5F7FB] py-14 md:py-16">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <p className="text-center text-xs font-semibold uppercase tracking-[0.12em] text-[#1F93D0]">
                Process
              </p>
              <h2 className="mt-2 text-center text-3xl font-bold tracking-tight text-[#111827] md:text-5xl">
                Simple. Fast. Reliable.
              </h2>
              <div className="relative mt-9 grid gap-8 md:grid-cols-3 md:gap-6">
                <div className="pointer-events-none absolute left-[16.66%] right-[16.66%] top-7 hidden h-px bg-[#D7DEE9] md:block" />
                {[
                  {
                    icon: Search,
                    title: "Step 1: Search or List",
                    text: "Browse verified properties that fit your needs, or add your own listing in minutes.",
                  },
                  {
                    icon: ClipboardSignature,
                    title: "Step 2: Connect & Manage",
                    text: "Communicate safely, screen tenants, and track everything in one dashboard.",
                  },
                  {
                    icon: TrendingUp,
                    title: "Step 3: Rent & Grow",
                    text: "Pay rent seamlessly, collect funds securely, and scale your portfolio effortlessly.",
                  },
                ].map(({ icon: Icon, title, text }) => (
                  <article key={title} className="text-center">
                    <span className="relative z-10 mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full border border-[#D8DFEA] bg-white text-[#0A4C95] shadow-sm">
                      <Icon className="h-4 w-4" />
                    </span>
                    <h3 className="mt-4 text-2xl font-semibold text-[#111827]">
                      {title}
                    </h3>
                    <p className="mt-2 text-sm text-[#6B7280] md:text-base">
                      {text}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section
            id="properties"
            className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 md:min-h-[80vh]"
          >
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold text-[#111827] md:text-6xl">
                  Explore Available Properties
                </h2>
                <p className="mt-2 text-base text-[#6B7280] md:text-lg">
                  Discover premium spaces tailored to your lifestyle. Every home
                  listed here is fully verified.
                </p>
              </div>
              <Link
                href="/properties"
                className="inline-flex items-center gap-2 rounded-xl bg-[#ECEFF4] px-5 py-3 text-sm font-semibold text-[#111827]"
              >
                View All Properties <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            {loading ? (
              <div className="flex min-h-[220px] items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#1F93D0] border-t-transparent" />
              </div>
            ) : error ? (
              <div className="rounded-xl border border-[#E5E7EB] bg-white py-12 text-center text-[#4B5563]">
                {error === "Unauthorized"
                  ? "Properties are temporarily unavailable. Please try again later."
                  : error}
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {featuredProperties.map((property) => (
                  <LandingPropertyCard key={property.id} property={property} />
                ))}
              </div>
            )}
          </section>

          <section className="bg-[#0A448E] py-14 md:py-16">
            <div className="mx-auto grid max-w-7xl gap-8 px-4 text-white sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8">
              <div>
                <h2 className="font-sans text-3xl font-bold tracking-tight md:text-5xl">
                  Why Trust Dwella?
                </h2>
                <p className="mt-3 max-w-xl text-sm text-white/85 md:text-base">
                  We are changing the narrative of Nigerian real estate with
                  verified listings, secure payments, and reliable management
                  tools.
                </p>
                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  {[
                    {
                      title: "Verified Listings Only",
                      text: "Every property and landlord undergoes strict checks.",
                    },
                    {
                      title: "Secure & Transparent",
                      text: "Financial transactions are fully digital and traceable.",
                    },
                    {
                      title: "Built for Nigeria",
                      text: "Designed for local market realities and infrastructure.",
                    },
                    {
                      title: "All-in-One Platform",
                      text: "Search, leasing, and management in one workflow.",
                    },
                  ].map((item) => (
                    <article key={item.title}>
                      <ShieldCheck className="h-5 w-5 text-[#1FC7FF]" />
                      <h3 className="mt-2 text-lg font-semibold md:text-xl">
                        {item.title}
                      </h3>
                      <p className="mt-1.5 text-xs leading-6 text-white/80 md:text-sm">
                        {item.text}
                      </p>
                    </article>
                  ))}
                </div>
              </div>
              <div className="relative rounded-3xl bg-black p-4 shadow-2xl">
                <div className="relative aspect-[16/9] overflow-hidden rounded-xl border border-white/10 bg-[#0B1028]">
                  <Image
                    src="https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?auto=format&fit=crop&w=1400&q=80"
                    alt="Dwella dashboard preview"
                    fill
                    className="object-cover opacity-90"
                    sizes="(max-width: 1024px) 100vw, 40vw"
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <h2 className="text-center text-3xl font-bold text-[#111827] md:text-5xl">
              Loved by Tenants and Landlords
            </h2>
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              {[
                {
                  name: "Chioma A.",
                  role: "Verified Tenant",
                  quote:
                    "I found my apartment without stress. No more running around with agents, and digital lease signing made everything quick and secure.",
                },
                {
                  name: "David O.",
                  role: "Property Manager",
                  quote:
                    "Managing my rentals is now effortless. Rent collection is automated, and I can track maintenance requests from anywhere.",
                },
              ].map((item) => (
                <article
                  key={item.name}
                  className="rounded-3xl border border-[#E5E7EB] bg-white p-6 shadow-sm md:p-7"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E2E8F0] text-xs font-semibold text-[#0F172A]">
                        {item.name
                          .split(" ")
                          .map((part) => part[0])
                          .join("")
                          .slice(0, 2)}
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-[#111827]">
                          {item.name}
                        </p>
                        <p className="text-sm text-[#6B7280]">{item.role}</p>
                      </div>
                    </div>
                    <span className="text-4xl leading-none text-[#D1D5DB]">
                      "
                    </span>
                  </div>
                  <p className="mt-5 text-base leading-8 text-[#334155]">
                    "{item.quote}"
                  </p>
                </article>
              ))}
            </div>
          </section>

          <section className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-5xl rounded-3xl bg-[#E8EEF9] px-6 py-12 text-center sm:px-12">
              <h2 className="text-4xl font-bold text-[#111827] md:text-5xl">
                Ready to Get Started?
              </h2>
              <p className="mx-auto mt-4 max-w-3xl text-base text-[#4B5563] md:text-lg">
                Join thousands of users experiencing the future of real estate.
                Whether you are looking for a home or managing properties, we
                have got you covered.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <Link
                  href="/properties"
                  className="rounded-xl bg-[#0A4C95] px-8 py-3 text-sm font-semibold text-white shadow hover:bg-[#083E7C]"
                >
                  Browse Properties
                </Link>
                <Link
                  href="/auth/signup?role=landlord"
                  className="rounded-xl border border-[#0A4C95] px-8 py-3 text-sm font-semibold text-[#0A4C95] hover:bg-[#0A4C95]/5"
                >
                  List Your Property
                </Link>
              </div>
            </div>
          </section>

          <StatsBar />
        </main>
        <LandingFooter />
      </div>
    </>
  );
}
