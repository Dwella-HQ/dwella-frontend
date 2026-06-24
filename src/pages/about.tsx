import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, ShieldCheck, Workflow } from "lucide-react";
import {
  LandingFooter,
  LandingHeader,
  StatsBar,
} from "@/components/landing";

export default function AboutPage() {
  return (
    <>
      <Head>
        <title>About Us | Dwelliva</title>
      </Head>
      <div className="min-h-screen bg-[#F3F5F8]">
        <LandingHeader />
        <main>
          <section className="relative overflow-hidden bg-[#F3F5F8]">
            <div className="mx-auto max-w-7xl px-4 py-6 text-sm text-[#64748B] sm:px-6 lg:px-8">
              <Link
                href="/"
                className="font-medium transition hover:text-[#0A4C95]"
              >
                Home
              </Link>
              <span className="mx-2 text-[#94A3B8]">›</span>
              <span className="font-semibold text-[#0F172A]">About Us</span>
            </div>
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55 }}
              className="mx-auto max-w-7xl px-4 pb-12 pt-4 sm:px-6 lg:px-8 lg:pb-16 lg:pt-8"
            >
              <div className="relative overflow-hidden rounded-[2rem] bg-[#050F3A] p-8 text-white shadow-[0_28px_80px_rgba(5,15,58,0.2)] md:p-10 lg:p-12">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(31,199,255,0.24),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(15,99,222,0.25),transparent_38%)]" />
                <div className="relative grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
                  <div>
                    <p className="inline-flex rounded-full border border-white/[0.18] bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#D7F4FF]">
                      About Dwelliva
                    </p>
                    <h1 className="mt-6 max-w-4xl text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
                      The operating layer for property teams in Nigeria
                    </h1>
                    <p className="mt-6 max-w-2xl text-base font-medium leading-8 text-white/78 sm:text-lg">
                      We help property teams replace scattered records, manual
                      coordination, and unclear workflows with one reliable
                      digital operating system.
                    </p>
                    <Link
                      href="#story"
                      className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#1FC7FF] px-6 py-3 text-sm font-semibold text-[#062F5F] transition hover:-translate-y-0.5 hover:bg-[#56D6FF] active:translate-y-0"
                    >
                      Read Our Story <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                    {[
                      ["01", "Organize operational records"],
                      ["02", "Coordinate daily property work"],
                      ["03", "Build trust with clearer visibility"],
                    ].map(([number, text]) => (
                      <div
                        key={number}
                        className="rounded-2xl border border-white/10 bg-white/[0.08] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                      >
                        <p className="text-sm font-bold text-[#1FC7FF]">
                          {number}
                        </p>
                        <p className="mt-2 text-sm font-semibold leading-6 text-white/86">
                          {text}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </section>

          <section
            id="story"
            className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16"
          >
            <div className="grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ duration: 0.5 }}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#1F93D0]">
                  Our Story
                </p>
                <h2 className="mt-3 text-4xl font-bold text-gray-900 md:text-5xl">
                  Born from the messy middle of property operations
                </h2>
                <div className="mt-7 space-y-5 text-base leading-8 text-gray-600 md:text-lg md:leading-9">
                  <p className="rounded-3xl border border-white bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
                    Dwelliva was born out of frustration with fragmented real
                    estate operations in Nigeria. Paper-based processes,
                    scattered records, and unclear workflows made portfolio
                    management harder than it needed to be.
                  </p>
                  <p className="rounded-3xl border border-white bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
                    We set out to create a platform that brings transparency and
                    trust to property operations. By digitizing records,
                    organizing approvals, and providing a unified payment system,
                    we help property teams run with more confidence.
                  </p>
                  {/* <p>
                    Today, we are building the operating layer for modern real
                    estate teams across Nigeria.
                  </p> */}
                </div>
              </motion.div>
              <motion.div
                whileHover={{ y: -6 }}
                transition={{ type: "spring", stiffness: 260, damping: 22 }}
                className="relative overflow-hidden rounded-[2rem] bg-[#041B3A] p-3 shadow-[0_28px_80px_rgba(15,23,42,0.18)] ring-1 ring-slate-900/[0.04]"
              >
                <div className="relative aspect-[4/3] overflow-hidden rounded-[1.45rem]">
                  <Image
                    src="https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1200&q=80"
                    alt="Team collaborating"
                    fill
                    className="object-cover transition duration-500 hover:scale-105"
                    sizes="(max-width: 1024px) 100vw, 48vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#041B3A]/70 via-transparent to-transparent" />
                  <div className="absolute bottom-5 left-5 right-5 rounded-2xl bg-white/12 p-5 text-white ring-1 ring-white/15 backdrop-blur-md">
                    <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#BDEBFF]">
                      Built for trust
                    </p>
                    <p className="mt-2 text-xl font-bold">
                      Clearer records. Better coordination. Fewer blind spots.
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </section>

          <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
            <div className="grid gap-5 md:grid-cols-3">
              {[
                {
                  icon: ShieldCheck,
                  title: "Trust by design",
                  text: "Records, payments, approvals, and documentation stay easier to verify and review.",
                },
                {
                  icon: Workflow,
                  title: "Operational clarity",
                  text: "Teams get one place to manage the daily work that keeps portfolios moving.",
                },
                {
                  icon: CheckCircle2,
                  title: "Built for Nigeria",
                  text: "Designed around local property workflows, teams, and market realities.",
                },
              ].map(({ icon: Icon, title, text }) => (
                <motion.article
                  key={title}
                  whileHover={{ y: -5 }}
                  transition={{ type: "spring", stiffness: 260, damping: 24 }}
                  className="rounded-3xl border border-white bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)] ring-1 ring-slate-900/[0.03]"
                >
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF7FE] text-[#0A4C95] ring-1 ring-[#BAE6FD]">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-5 text-xl font-bold text-[#111827]">
                    {title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-[#64748B]">
                    {text}
                  </p>
                </motion.article>
              ))}
            </div>
          </section>
          <StatsBar />
        </main>{" "}
        <LandingFooter />
      </div>
    </>
  );
}
