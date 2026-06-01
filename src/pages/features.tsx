import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import {
  CheckCircle2,
  BellRing,
  CreditCard,
  FileText,
  Search,
  Wrench,
} from "lucide-react";
import { LandingFooter, LandingHeader, StatsBar } from "@/components/landing";

const features = [
  {
    title: "Smart Property Search",
    description:
      "Filter by exact amenities, commute times, and verified neighborhood safety scores.",
    icon: Search,
    color: "bg-sky-500",
  },
  {
    title: "100% Verified Listings",
    description:
      "Every property and landlord is vetted. We physically inspect homes and verify ownership documents.",
    icon: CheckCircle2,
    color: "bg-emerald-500",
  },
  {
    title: "Digital Lease Signing",
    description:
      "Review, negotiate, and sign your tenancy agreements entirely online.",
    icon: FileText,
    color: "bg-violet-500",
  },
  {
    title: "Secure Payments",
    description:
      "Pay rent securely via bank transfer or card with auto-reminders and payment history.",
    icon: CreditCard,
    color: "bg-indigo-500",
  },
  {
    title: "Maintenance Tracking",
    description:
      "Log repair requests, attach photos, and track status updates in real time.",
    icon: Wrench,
    color: "bg-orange-500",
  },
  {
    title: "Instant Notifications",
    description:
      "Get updates when your request is approved, your lease is due, or a new property matches your criteria.",
    icon: BellRing,
    color: "bg-rose-500",
  },
];

export default function FeaturesPage() {
  return (
    <>
      <Head>
        <title>Features | Dwelliva</title>
      </Head>
      <div className="min-h-screen bg-[#F3F5F8]">
        <LandingHeader />
        <main>
          <section className="relative overflow-hidden bg-[#0D4DA0] text-white">
            <div className="absolute inset-0 opacity-25">
              <Image
                src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1800&q=80"
                alt="Modern building background"
                fill
                className="object-cover"
              />
            </div>
            <div className="relative mx-auto max-w-7xl px-4 py-6 text-sm sm:px-6 lg:px-8">
              <Link href="/" className="opacity-90 hover:opacity-100">
                Home
              </Link>
              <span className="mx-2 opacity-70">›</span>
              <span className="font-medium">Features</span>
            </div>
            <div className="relative mx-auto max-w-4xl px-4 pb-16 pt-4 text-center sm:px-6 lg:px-8 lg:pb-20">
              <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
                Everything you need to rent with confidence
              </h1>
              <p className="mx-auto mt-5 max-w-3xl text-base text-blue-100 sm:text-lg">
                Dwelliva provides a complete toolkit for tenants and landlords
                to manage the entire rental lifecycle in one place.
              </p>
            </div>
          </section>

          <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <article
                    key={feature.title}
                    className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
                  >
                    <div
                      className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${feature.color} text-white`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <h2 className="mt-4 text-xl font-bold text-gray-900">
                      {feature.title}
                    </h2>
                    <p className="mt-3 text-sm leading-7 text-gray-600">
                      {feature.description}
                    </p>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-8 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-16">
            <div>
              <h2 className="text-4xl font-bold leading-tight text-gray-900">
                Move in faster, with zero paperwork
              </h2>
              <p className="mt-5 text-lg leading-8 text-gray-600">
                We&apos;ve digitized the entire move-in process. From paying
                your first month&apos;s rent and security deposit to signing the
                final lease agreement, you can do it all from your phone in
                under 10 minutes.
              </p>
              <ul className="mt-6 space-y-3 text-sm font-medium text-gray-700">
                <li>- Instant deposit transfers</li>
                <li>- Digital inventory checklist</li>
                <li>- Key handover scheduling</li>
              </ul>
            </div>
            <div className="overflow-hidden rounded-3xl bg-white shadow-xl">
              <Image
                src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=80"
                alt="Keys and home move-in"
                width={1200}
                height={900}
                className="h-full w-full object-cover"
              />
            </div>
          </section>
          <StatsBar />
        </main>
        <LandingFooter />
      </div>
    </>
  );
}
