import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
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
    title: "Portfolio Overview",
    description:
      "See portfolio activity, service requests, payments, and records from one focused workspace.",
    icon: Search,
    color: "bg-sky-500",
    glow: "from-sky-500/20 via-sky-500/5 to-transparent",
    shadow: "shadow-sky-500/25",
  },
  {
    title: "Verified Records",
    description:
      "Keep ownership, compliance, and supporting documents organized for review.",
    icon: CheckCircle2,
    color: "bg-emerald-500",
    glow: "from-emerald-500/20 via-emerald-500/5 to-transparent",
    shadow: "shadow-emerald-500/25",
  },
  {
    title: "Digital Documentation",
    description:
      "Manage agreements, uploads, approvals, and supporting files entirely online.",
    icon: FileText,
    color: "bg-violet-500",
    glow: "from-violet-500/20 via-violet-500/5 to-transparent",
    shadow: "shadow-violet-500/25",
  },
  {
    title: "Secure Payments",
    description:
      "Track payment activity, account details, and financial records with clearer visibility.",
    icon: CreditCard,
    color: "bg-indigo-500",
    glow: "from-indigo-500/20 via-indigo-500/5 to-transparent",
    shadow: "shadow-indigo-500/25",
  },
  {
    title: "Maintenance Tracking",
    description:
      "Log repair requests, attach photos, and track status updates in real time.",
    icon: Wrench,
    color: "bg-orange-500",
    glow: "from-orange-500/20 via-orange-500/5 to-transparent",
    shadow: "shadow-orange-500/25",
  },
  {
    title: "Instant Notifications",
    description:
      "Get updates when requests, approvals, messages, and operational tasks need attention.",
    icon: BellRing,
    color: "bg-rose-500",
    glow: "from-rose-500/20 via-rose-500/5 to-transparent",
    shadow: "shadow-rose-500/25",
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
                Everything you need to manage with confidence
              </h1>
              <p className="mx-auto mt-5 max-w-3xl text-base text-blue-100 sm:text-lg">
                Dwelliva provides a complete toolkit for property teams to
                manage operations, records, payments, and service workflows in
                one place.
              </p>
            </div>
          </section>

          <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <motion.article
                    key={feature.title}
                    whileHover={{ y: -8, scale: 1.01 }}
                    transition={{ type: "spring", stiffness: 260, damping: 22 }}
                    className="group relative overflow-hidden rounded-2xl border border-white/70 bg-white/95 p-6 shadow-[0_18px_45px_rgba(15,23,42,0.08)] ring-1 ring-slate-900/[0.03] transition-colors duration-300 hover:border-white hover:shadow-[0_24px_60px_rgba(31,147,208,0.18)]"
                  >
                    <div
                      className={`pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${feature.glow} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
                    />
                    <div className="relative flex items-start justify-between gap-4">
                      <motion.div
                        whileHover={{ rotate: -4, scale: 1.08 }}
                        transition={{
                          type: "spring",
                          stiffness: 360,
                          damping: 18,
                        }}
                        className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${feature.color} text-white shadow-lg ${feature.shadow} transition-transform duration-300 group-hover:-translate-y-0.5`}
                      >
                        <Icon className="h-5 w-5" />
                      </motion.div>
                    </div>
                    <h2 className="relative mt-5 text-xl font-bold text-gray-900 transition-colors duration-300 group-hover:text-[#0D4DA0]">
                      {feature.title}
                    </h2>
                    <p className="relative mt-3 text-sm leading-7 text-gray-600">
                      {feature.description}
                    </p>
                    <div
                      className={`relative mt-6 h-1 w-12 rounded-full ${feature.color} opacity-30 transition-all duration-300 group-hover:w-20 group-hover:opacity-80`}
                    />
                  </motion.article>
                );
              })}
            </div>
          </section>

          <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-8 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-16">
            <div>
              <h2 className="text-4xl font-bold leading-tight text-gray-900">
                Work faster, with less paperwork
              </h2>
              <p className="mt-5 text-lg leading-8 text-gray-600">
                We&apos;ve digitized the operational paperwork that slows teams
                down. From records and approvals to payment visibility and
                service coordination, your team can manage more from one place.
              </p>
              <ul className="mt-6 space-y-3 text-sm font-medium text-gray-700">
                <li>- Digital records and approvals</li>
                <li>- Portfolio activity tracking</li>
                <li>- Maintenance coordination</li>
              </ul>
            </div>
            <div className="overflow-hidden rounded-3xl bg-white shadow-xl">
              <Image
                src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=80"
                alt="Modern property operations"
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
