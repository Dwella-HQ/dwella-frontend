import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import loginImage from "@/assets/auth/login_image.png";
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
} from "@/components/landing";

const WAITLIST_URL = "https://app.youform.com/forms/dc4vgu65";

const FEATURE_CARDS = [
  {
    icon: TrendingUp,
    title: "Portfolio Insights",
    desc: "Track occupancy, payments, service activity, and operational performance from one dashboard.",
    color: "bg-sky-500",
    glow: "from-sky-500/20 via-sky-500/5 to-transparent",
    shadow: "shadow-sky-500/25",
  },
  {
    icon: ShieldCheck,
    title: "Verified Records",
    desc: "Keep ownership, compliance, and business records organized for confident operations.",
    color: "bg-emerald-500",
    glow: "from-emerald-500/20 via-emerald-500/5 to-transparent",
    shadow: "shadow-emerald-500/25",
  },
  {
    icon: ClipboardSignature,
    title: "Digital Documentation",
    desc: "Manage agreements, records, approvals, and supporting files in a simple digital workspace.",
    color: "bg-violet-500",
    glow: "from-violet-500/20 via-violet-500/5 to-transparent",
    shadow: "shadow-violet-500/25",
  },
  {
    icon: CreditCard,
    title: "Secure Payments",
    desc: "Record, reconcile, and monitor payments with clearer visibility across your portfolio.",
    color: "bg-indigo-500",
    glow: "from-indigo-500/20 via-indigo-500/5 to-transparent",
    shadow: "shadow-indigo-500/25",
  },
  {
    icon: Wrench,
    title: "Maintenance Tracking",
    desc: "Log repair requests, add photos, and track progress from your dashboard.",
    color: "bg-orange-500",
    glow: "from-orange-500/20 via-orange-500/5 to-transparent",
    shadow: "shadow-orange-500/25",
  },
  {
    icon: BellRing,
    title: "Instant Notifications",
    desc: "Receive alerts when requests, approvals, messages, and operational updates need attention.",
    color: "bg-rose-500",
    glow: "from-rose-500/20 via-rose-500/5 to-transparent",
    shadow: "shadow-rose-500/25",
  },
];

export default function LandingPage() {
  return (
    <>
      <Head>
        <title>Dwelliva – Property Management Platform</title>
        <meta
          name="description"
          content="Manage properties, operations, payments, maintenance, and reporting with Dwelliva."
        />
      </Head>
      <div className="min-h-screen flex flex-col bg-[#F3F5F8] font-sans text-[#0F172A]">
        <LandingHeader />
        <main className="flex-1">
          <section className="relative overflow-hidden bg-[#0B4A9E] md:min-h-[82vh]">
            <div className="absolute inset-0">
              <Image
                src="https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=1800&q=80"
                alt="Apartment exterior"
                fill
                className="object-cover opacity-[0.18]"
                sizes="100vw"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-br from-[#02152F]/96 via-[#073B82]/94 to-[#0A448E]/92" />
              <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#F3F5F8] via-[#F3F5F8]/35 to-transparent" />
            </div>
            <div className="relative mx-auto flex max-w-7xl flex-col justify-center px-4 pb-32 pt-24 text-center sm:px-6 lg:px-8 md:min-h-[82vh] md:pb-24 md:pt-24">
              <motion.p
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/[0.22] bg-[#031A3A]/60 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#D7F4FF] shadow-[0_18px_45px_rgba(2,8,23,0.18)] backdrop-blur"
              >
                Property operations platform
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.04 }}
                className="mx-auto mt-6 max-w-6xl text-4xl font-bold leading-tight text-white drop-shadow-[0_4px_20px_rgba(2,8,23,0.26)] md:text-[72px] md:font-bold md:leading-[78px]"
              >
                Manage Properties. Automate Operations. Grow Faster.
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.12 }}
                className="mx-auto mt-6 max-w-3xl text-base font-semibold text-white drop-shadow-[0_2px_16px_rgba(2,8,23,0.42)] md:text-[18px] md:leading-[30px]"
              >
                Streamline operations, maintenance tracking, payments,
                documentation, and reporting from one powerful property
                management platform.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.2 }}
                className="mt-10 flex flex-wrap items-center justify-center gap-4 md:mt-12"
              >
                <a
                  href={WAITLIST_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1FC7FF] px-8 py-3 text-sm font-semibold text-[#062F5F] shadow transition hover:-translate-y-1 hover:bg-[#56D6FF] hover:shadow-lg active:translate-y-0 md:h-[63px] md:w-[276px] md:rounded-[14px] md:px-12 md:py-[17px] md:text-base"
                >
                  Join the Waitlist <ArrowRight className="h-4 w-4" />
                </a>
                {/* Public property browsing CTA hidden for now. */}
                <Link
                  href="/auth/signup?role=landlord"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/70 bg-white/95 px-8 py-3 text-sm font-semibold text-[#062F5F] shadow-[0_18px_45px_rgba(2,8,23,0.14)] transition hover:-translate-y-1 hover:bg-white hover:shadow-lg active:translate-y-0 md:h-[63px] md:w-[276px] md:rounded-[14px] md:px-12 md:py-[17px] md:text-base"
                >
                  Start Managing Now <ArrowRight className="h-4 w-4" />
                </Link>
              </motion.div>
            </div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.48 }}
              className="absolute inset-x-0 bottom-8 hidden flex-col items-center gap-2 text-xs font-semibold text-white/90 drop-shadow-[0_2px_10px_rgba(2,8,23,0.45)] md:flex"
            >
              <span className="rounded-full bg-[#031A3A]/35 px-3 py-1 ring-1 ring-white/15 backdrop-blur">
                Explore platform
              </span>
              <span className="h-9 w-px bg-gradient-to-b from-white/90 to-transparent" />
            </motion.div>
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
                  Dwelliva is a modern property platform designed to simplify how
                  teams manage real estate operations in Nigeria through secure
                  payments, clear records, and reliable property management
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
                  Start Managing
                </Link>
              </div>
            </section>

            <section className="border-y border-[#D9DEE7] py-16 md:py-20">
              {/* Public consumer-facing card paused for now. */}
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ duration: 0.45 }}
                className="grid overflow-hidden rounded-[2rem] bg-[#050F3A] shadow-[0_28px_80px_rgba(5,15,58,0.22)] md:grid-cols-[1.05fr_0.95fr]"
              >
                <div className="relative p-8 text-white sm:p-10 lg:p-12">
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#1FC7FF]/70 to-transparent" />
                  <p className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/90 ring-1 ring-white/10">
                    For Property Teams
                  </p>
                  <h3 className="mt-5 max-w-xl text-4xl font-bold leading-tight md:text-5xl">
                    One workspace for daily property operations
                  </h3>
                  <p className="mt-5 max-w-2xl text-base leading-7 text-white/72 md:text-lg">
                    Bring setup, maintenance, records, activity, and portfolio
                    visibility into a calmer workflow built for repeat daily
                    use.
                  </p>
                  <ul className="mt-8 grid gap-4 text-white/90 sm:grid-cols-2">
                    {[
                      "Set up properties faster",
                      "Track occupancy at a glance",
                      "Organize documents and records",
                      "Coordinate maintenance requests",
                    ].map((item) => (
                      <li key={item} className="flex items-center gap-3 text-sm md:text-base">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1FC7FF]/10 ring-1 ring-[#1FC7FF]/35">
                          <CheckCircle2 className="h-4 w-4 text-[#1FC7FF]" />
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/auth/signup?role=landlord"
                    className="mt-9 inline-flex items-center justify-center gap-2 rounded-xl bg-white px-7 py-3 text-sm font-semibold text-[#050F3A] transition hover:-translate-y-1 hover:shadow-[0_18px_35px_rgba(255,255,255,0.18)] active:translate-y-0"
                  >
                    Start Managing <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
                <motion.div
                  whileHover={{ scale: 1.015 }}
                  transition={{ type: "spring", stiffness: 220, damping: 24 }}
                  className="relative min-h-[360px] overflow-hidden bg-[#0A4C95] md:min-h-full"
                >
                  <Image
                    src={loginImage}
                    alt="Modern managed apartment building"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 42vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#050F3A]/75 via-[#050F3A]/12 to-transparent" />
                  <div className="absolute bottom-5 left-5 right-5 grid grid-cols-2 gap-3">
                    {[
                      ["Clearer", "Operations"],
                      ["Faster", "Follow-ups"],
                    ].map(([value, label]) => (
                      <div
                        key={label}
                        className="rounded-2xl bg-white/12 p-4 text-white shadow-lg ring-1 ring-white/15 backdrop-blur"
                      >
                        <p className="text-lg font-extrabold text-white">{value}</p>
                        <p className="mt-1 text-xs font-bold uppercase tracking-[0.08em] text-white/80">
                          {label}
                        </p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </motion.div>
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
                {FEATURE_CARDS.map(
                  ({ icon: Icon, title, desc, color, glow, shadow }) => (
                  <motion.article
                    key={title}
                    whileHover={{ y: -6, scale: 1.01 }}
                    transition={{ type: "spring", stiffness: 260, damping: 22 }}
                    className="group relative overflow-hidden rounded-2xl border border-white/70 bg-white/95 p-6 shadow-[0_18px_45px_rgba(15,23,42,0.08)] ring-1 ring-slate-900/[0.03] transition-colors duration-300 hover:border-white hover:shadow-[0_24px_60px_rgba(31,147,208,0.18)]"
                  >
                    <div
                      className={`pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${glow} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
                    />
                    <span
                      className={`relative inline-flex h-12 w-12 items-center justify-center rounded-xl ${color} text-white shadow-lg ${shadow} transition duration-300 group-hover:-translate-y-0.5 group-hover:scale-105`}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="relative mt-5 text-xl font-bold leading-tight text-[#111827] transition-colors duration-300 group-hover:text-[#0D4DA0]">
                      {title}
                    </h3>
                    <p className="relative mt-3 text-sm leading-7 text-[#6B7280] md:text-base">
                      {desc}
                    </p>
                    <div
                      className={`relative mt-6 h-1 w-12 rounded-full ${color} opacity-30 transition-all duration-300 group-hover:w-20 group-hover:opacity-80`}
                    />
                  </motion.article>
                  ),
                )}
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

          <section className="border-y border-[#D9DEE7] bg-[#F5F7FB] py-16 md:py-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <p className="text-center text-xs font-semibold uppercase tracking-[0.12em] text-[#1F93D0]">
                Process
              </p>
              <h2 className="mt-2 text-center text-3xl font-bold tracking-tight text-[#111827] md:text-5xl">
                Simple. Fast. Reliable.
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-center text-sm leading-7 text-[#64748B] md:text-base">
                A cleaner operating rhythm from first setup to everyday
                portfolio oversight.
              </p>
              <div className="relative mt-10 grid gap-5 md:grid-cols-3">
                <div className="pointer-events-none absolute left-[18%] right-[18%] top-10 hidden h-px bg-gradient-to-r from-transparent via-[#B9D7EA] to-transparent md:block" />
                {[
                  {
                    icon: Search,
                    number: "01",
                    title: "Set Up",
                    text: "Add your portfolio, team, units, and operating details in minutes.",
                  },
                  {
                    icon: ClipboardSignature,
                    number: "02",
                    title: "Connect & Manage",
                    text: "Coordinate records, requests, approvals, and day-to-day tasks in one dashboard.",
                  },
                  {
                    icon: TrendingUp,
                    number: "03",
                    title: "Grow",
                    text: "Monitor performance, streamline operations, and scale your portfolio confidently.",
                  },
                ].map(({ icon: Icon, number, title, text }, index) => (
                  <motion.article
                    key={title}
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -6 }}
                    viewport={{ once: true, amount: 0.35 }}
                    transition={{ type: "spring", stiffness: 260, damping: 24, delay: index * 0.04 }}
                    className="group relative overflow-hidden rounded-3xl border border-white bg-white p-6 text-left shadow-[0_18px_45px_rgba(15,23,42,0.06)] ring-1 ring-slate-900/[0.03] transition hover:border-sky-100 hover:shadow-[0_24px_60px_rgba(31,147,208,0.16)]"
                  >
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#1F93D0] via-[#1FC7FF] to-[#0F63DE] opacity-70" />
                    <div className="flex items-start justify-between gap-4">
                      <span className="relative z-10 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF7FE] text-[#0A4C95] shadow-sm ring-1 ring-[#BAE6FD] transition group-hover:scale-105">
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="text-4xl font-bold leading-none text-[#E2E8F0]">
                        {number}
                      </span>
                    </div>
                    <h3 className="mt-6 text-2xl font-semibold text-[#111827]">
                      {title}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-[#64748B] md:text-base">
                      {text}
                    </p>
                  </motion.article>
                ))}
              </div>
            </div>
          </section>

          {/* Public browsing section paused for now. */}

          <section className="bg-[#0A448E] py-16 md:py-20">
            <div className="mx-auto grid max-w-7xl gap-10 px-4 text-white sm:px-6 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:px-8">
              <div>
                <p className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#BDEBFF] ring-1 ring-white/10">
                  Trust layer
                </p>
                <h2 className="mt-4 font-sans text-3xl font-bold tracking-tight md:text-5xl">
                  Why Trust Dwelliva?
                </h2>
                <p className="mt-4 max-w-xl text-sm leading-7 text-white/82 md:text-base">
                  We are changing the narrative of Nigerian real estate with
                  verified records, secure payments, and reliable management
                  tools.
                </p>
                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  {[
                    {
                      title: "Verified Records",
                      text: "Key business and property records stay organized and reviewable.",
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
                      text: "Management, communication, and operations in one workflow.",
                    },
                  ].map((item) => (
                    <motion.article
                      key={item.title}
                      whileHover={{ y: -4 }}
                      transition={{ type: "spring", stiffness: 280, damping: 24 }}
                      className="rounded-2xl border border-white/10 bg-white/[0.07] p-5 shadow-[0_18px_38px_rgba(5,15,58,0.12)] backdrop-blur"
                    >
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#1FC7FF]/10 text-[#1FC7FF] ring-1 ring-[#1FC7FF]/20">
                        <ShieldCheck className="h-5 w-5" />
                      </span>
                      <h3 className="mt-2 text-lg font-semibold md:text-xl">
                        {item.title}
                      </h3>
                      <p className="mt-1.5 text-xs leading-6 text-white/80 md:text-sm">
                        {item.text}
                      </p>
                    </motion.article>
                  ))}
                </div>
              </div>
              <motion.div
                whileHover={{ y: -6 }}
                transition={{ type: "spring", stiffness: 260, damping: 22 }}
                className="relative overflow-hidden rounded-[2rem] bg-[#041B3A] p-3 shadow-[0_32px_90px_rgba(2,8,23,0.28)] ring-1 ring-white/10"
              >
                <div className="relative aspect-[16/10] overflow-hidden rounded-[1.45rem] border border-white/10 bg-[#0B1028]">
                  <Image
                    src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1400&q=80"
                    alt="Managed real estate portfolio"
                    fill
                    className="object-cover opacity-90"
                    sizes="(max-width: 1024px) 100vw, 40vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#03152F]/82 via-[#03152F]/18 to-transparent" />
                  <div className="absolute bottom-5 left-5 right-5 rounded-2xl bg-white/12 p-5 text-white ring-1 ring-white/15 backdrop-blur-md">
                    <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#BDEBFF]">
                      Operational clarity
                    </p>
                    <p className="mt-2 max-w-md text-2xl font-bold">
                      Records, payments, requests, and activity in one reliable view.
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </section>

          <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 md:py-20">
            <p className="text-center text-xs font-semibold uppercase tracking-[0.12em] text-[#1F93D0]">
              Customer proof
            </p>
            <h2 className="mt-2 text-center text-3xl font-bold text-[#111827] md:text-5xl">
              Loved by Operators and Property Teams
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-sm leading-7 text-[#64748B] md:text-base">
              Built for people who need real estate operations to feel
              organized, visible, and easier to act on.
            </p>
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              {[
                {
                  name: "Amaka E.",
                  role: "Operations Lead",
                  quote:
                    "Dwelliva gives our team one place to track portfolio activity, requests, and important records without losing context.",
                },
                {
                  name: "David O.",
                  role: "Property Manager",
                  quote:
                    "Managing our portfolio is now much clearer. Payments, maintenance requests, and reporting are easier to follow from anywhere.",
                },
              ].map((item) => (
                <motion.article
                  key={item.name}
                  whileHover={{ y: -5 }}
                  transition={{ type: "spring", stiffness: 260, damping: 22 }}
                  className="group relative overflow-hidden rounded-3xl border border-white bg-white p-7 shadow-[0_18px_45px_rgba(15,23,42,0.07)] ring-1 ring-slate-900/[0.03] transition hover:border-sky-100 hover:shadow-[0_24px_60px_rgba(31,147,208,0.14)] md:p-8"
                >
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-sky-100/70 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF7FE] text-sm font-bold text-[#0A4C95] ring-1 ring-[#BAE6FD]">
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
                    <span className="text-5xl font-serif leading-none text-[#BAE6FD]">
                      &quot;
                    </span>
                  </div>
                  <p className="relative mt-6 text-base leading-8 text-[#334155] md:text-lg">
                    &quot;{item.quote}&quot;
                  </p>
                  <div className="mt-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-[#1F93D0]">
                    <ShieldCheck className="h-4 w-4" />
                    Verified workflow
                  </div>
                </motion.article>
              ))}
            </div>
          </section>

          <section className="mx-auto max-w-7xl px-4 pb-16 pt-4 sm:px-6 lg:px-8">
            <motion.div
              whileInView={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 18 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.5 }}
              className="relative mx-auto overflow-hidden rounded-[2rem] bg-[#050F3A] px-6 py-12 text-center text-white shadow-[0_28px_80px_rgba(5,15,58,0.2)] sm:px-12 md:py-14"
            >
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(31,199,255,0.28),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(15,99,222,0.32),transparent_38%)]" />
              <div className="relative">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#BDEBFF]">
                  Start today
                </p>
                <h2 className="mt-3 text-4xl font-bold md:text-5xl">
                  Ready to run your portfolio with more clarity?
                </h2>
                <p className="mx-auto mt-4 max-w-3xl text-base leading-8 text-white/78 md:text-lg">
                  Bring properties, teams, payments, requests, and daily
                  operations into one calm workspace.
                </p>
                <div className="mt-7 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs font-semibold uppercase tracking-[0.1em] text-white/70">
                  {["Fast setup", "Clear records", "Daily visibility"].map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-2"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#1FC7FF]" />
                      {item}
                    </span>
                  ))}
                </div>
                <div className="mt-10 flex flex-wrap justify-center gap-5">
                  <a
                    href={WAITLIST_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-w-[220px] items-center justify-center gap-2 rounded-xl bg-[#1FC7FF] px-8 py-3 text-sm font-semibold text-[#062F5F] shadow transition hover:-translate-y-0.5 hover:bg-[#56D6FF] active:translate-y-0"
                  >
                    Join the Waitlist <ArrowRight className="h-4 w-4" />
                  </a>
                  {/* Public property browsing CTA hidden for now. */}
                  <Link
                    href="/auth/signup?role=landlord"
                    className="inline-flex min-w-[220px] items-center justify-center gap-2 rounded-xl border border-white/35 px-8 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/10 active:translate-y-0"
                  >
                    Start Managing <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </motion.div>
          </section>

          <StatsBar />
        </main>
        <LandingFooter />
      </div>
    </>
  );
}
