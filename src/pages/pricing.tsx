import Head from "next/head";
import Link from "next/link";
import { LandingFooter, LandingHeader } from "@/components/landing";

export default function PricingPage() {
  return (
    <>
      <Head>
        <title>Pricing | DWELLA NG</title>
      </Head>
      <div className="min-h-screen bg-[#F3F5F8]">
        <LandingHeader />
        <main className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl rounded-3xl bg-white p-8 shadow-sm md:p-12">
            <h1 className="text-3xl font-bold text-[#111827] md:text-5xl">
              Pricing
            </h1>
            <p className="mt-6 text-base leading-8 text-[#4B5563] md:text-lg">
              Flexible plans for tenants, landlords, and property managers.
              Detailed pricing tiers will be published here.
            </p>
            <Link
              href="/"
              className="mt-8 inline-flex rounded-xl bg-[#0A4C95] px-6 py-3 text-sm font-semibold text-white"
            >
              Back to Home
            </Link>
          </div>
        </main>
        <LandingFooter />
      </div>
    </>
  );
}
