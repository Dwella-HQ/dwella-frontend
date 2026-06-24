import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { LandingFooter, LandingHeader } from "@/components/landing";

export default function PropertiesPage() {
  return (
    <>
      <Head>
        <title>Properties | Dwelliva</title>
      </Head>
      <div className="min-h-screen bg-[#F3F5F8]">
        <LandingHeader />
        <main className="mx-auto flex min-h-[calc(100vh-69px)] max-w-4xl items-center px-4 py-16 text-center sm:px-6 lg:px-8">
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="w-full rounded-3xl border border-[#E2E8F0] bg-white px-6 py-14 shadow-sm sm:px-10"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#1F93D0]">
              Coming Soon
            </p>
            <h1 className="mt-4 text-3xl font-bold text-[#111827] md:text-5xl">
              Public browsing is paused for now.
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-[#64748B] md:text-lg">
              We are focusing this experience on property management tools while
              public browsing features are temporarily hidden.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-xl bg-[#0A4C95] px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#083E7C] active:translate-y-0"
              >
                Back Home <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/auth/signup?role=landlord"
                className="inline-flex items-center gap-2 rounded-xl border border-[#0A4C95] px-6 py-3 text-sm font-semibold text-[#0A4C95] transition hover:-translate-y-0.5 hover:bg-[#0A4C95]/5 active:translate-y-0"
              >
                Start Managing
              </Link>
            </div>
          </motion.section>
        </main>
        <LandingFooter />
      </div>
    </>
  );
}
