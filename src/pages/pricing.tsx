import * as React from "react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { LandingFooter, LandingHeader } from "@/components/landing";
import { SUPPORT_MAILTO } from "@/lib/supportContact";

type BillingCycle = "monthly" | "yearly";

const corePlans = [
  {
    name: "Starter",
    units: "1 - 5 units",
    bestFor: "Individual landlords starting out",
    unitPrice: 2000,
    exampleUnits: 5,
    highlighted: false,
  },
  {
    name: "Professional",
    units: "6 - 15 units",
    bestFor: "Growing landlords with multiple properties",
    unitPrice: 1750,
    exampleUnits: 10,
    highlighted: true,
  },
  {
    name: "Enterprise",
    units: "16 - 30 units",
    bestFor: "Established landlords and small managers",
    unitPrice: 1500,
    exampleUnits: 20,
    highlighted: false,
  },
];

const inspectionPlans = [
  {
    name: "Basic Inspection",
    cadence: "Once a month",
    price: 15000,
    highlighted: false,
  },
  {
    name: "Standard Inspection",
    cadence: "Twice a month",
    price: 25000,
    highlighted: false,
  },
  {
    name: "Premium Inspection",
    cadence: "Weekly",
    price: 50000,
    highlighted: true,
  },
];

const includedFeatures = [
  "Rent Collection & Tracking",
  "Tenant Management",
  "Maintenance Tracking",
  "Financial Dashboard",
  "Document Storage",
  "Tenant Communication",
];

const currency = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

function formatNaira(value: number) {
  return currency.format(value).replace("NGN", "₦").replace(/\s/g, "");
}

export default function PricingPage() {
  const [billingCycle, setBillingCycle] =
    React.useState<BillingCycle>("monthly");
  const multiplier = billingCycle === "yearly" ? 12 : 1;
  const period = billingCycle === "yearly" ? "year" : "month";

  return (
    <>
      <Head>
        <title>Pricing | Dwelliva</title>
      </Head>
      <div className="min-h-screen bg-white">
        <LandingHeader />
        <main>
          <section className="relative overflow-hidden bg-[#0A4F98] text-white">
            <Image
              src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1800&q=85"
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover opacity-35"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#064C94]/95 via-[#0C5DAB]/90 to-[#135EA1]/90" />
            <div className="relative mx-auto max-w-7xl px-4 py-6 text-sm sm:px-6 lg:px-8">
              <Link
                href="/"
                className="text-white/90 transition hover:text-white"
              >
                Home
              </Link>
              <span className="mx-2 text-white/60">›</span>
              <span className="font-medium text-white">Pricing</span>
            </div>
            <div className="relative mx-auto flex min-h-[390px] max-w-5xl flex-col items-center justify-center px-4 pb-16 pt-8 text-center sm:px-6 lg:px-8">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-4xl text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl"
              >
                Pricing that scales with you
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.08 }}
                className="mx-auto mt-6 max-w-3xl text-base leading-8 text-white/90 sm:text-lg"
              >
                Whether you&apos;re managing a single property or running a
                large portfolio, we have the perfect plan for your needs.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.16 }}
                className="mt-10 inline-flex rounded-full bg-white p-1 text-xs font-bold uppercase tracking-[0.12em] text-[#0D3B66] shadow-[0_18px_50px_rgba(2,8,23,0.18)]"
              >
                {(["monthly", "yearly"] as BillingCycle[]).map((cycle) => (
                  <button
                    key={cycle}
                    type="button"
                    onClick={() => setBillingCycle(cycle)}
                    className={`rounded-full px-6 py-3 transition ${
                      billingCycle === cycle
                        ? "bg-[#2092CE] text-white shadow-[0_10px_22px_rgba(32,146,206,0.28)]"
                        : "text-[#37506A] hover:bg-slate-100"
                    }`}
                  >
                    {cycle}
                  </button>
                ))}
              </motion.div>
            </div>
          </section>

          <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.45 }}
              className="rounded-xl border border-[#B9D8FF] bg-[#EAF4FF] px-6 py-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)] sm:flex sm:items-center sm:justify-between sm:gap-8"
            >
              <div>
                <span className="inline-flex rounded-full bg-[#2169F3] px-4 py-1 text-xs font-bold uppercase tracking-wide text-white">
                  Free Trial
                </span>
                <h2 className="mt-3 text-2xl font-bold text-[#0D223A]">
                  30-Day Free Trial
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#536B85]">
                  Full access to all features for 30 days — up to 3 units. No
                  credit card required.
                </p>
              </div>
              <Link
                href="/auth/signup"
                className="mt-5 inline-flex w-full items-center justify-center rounded-lg bg-[#071D38] px-6 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#020B16] active:translate-y-0 sm:mt-0 sm:w-auto"
              >
                Start Free Trial
              </Link>
            </motion.div>

            <div className="mt-14 grid gap-8 lg:grid-cols-3">
              {corePlans.map((plan, index) => {
                const unitPrice = plan.unitPrice * multiplier;
                const exampleTotal = unitPrice * plan.exampleUnits;

                return (
                  <motion.article
                    key={plan.name}
                    initial={{ opacity: 0, y: 22 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -8 }}
                    viewport={{ once: true, amount: 0.25 }}
                    transition={{
                      type: "spring",
                      stiffness: 230,
                      damping: 22,
                      delay: index * 0.06,
                    }}
                    className={`relative rounded-2xl border p-8 transition ${
                      plan.highlighted
                        ? "border-[#082744] bg-[#082744] text-white shadow-[0_24px_70px_rgba(8,39,68,0.24)]"
                        : "border-[#E0E7EF] bg-white text-[#101828] shadow-[0_16px_45px_rgba(15,23,42,0.06)] hover:border-[#BBDCF2]"
                    }`}
                  >
                    {plan.highlighted ? (
                      <span className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-[#2092CE] px-8 py-2 text-sm font-bold text-white shadow-[0_12px_26px_rgba(32,146,206,0.28)]">
                        Most Popular
                      </span>
                    ) : null}
                    <h2 className="text-3xl font-bold">{plan.name}</h2>
                    <span className="mt-4 inline-flex rounded-lg bg-[#1D75D6] px-4 py-2 text-sm font-bold text-white">
                      {plan.units}
                    </span>
                    <p
                      className={`mt-5 min-h-[48px] text-base leading-6 ${
                        plan.highlighted ? "text-white/78" : "text-[#61738A]"
                      }`}
                    >
                      Best for: {plan.bestFor}
                    </p>
                    <p className="mt-6 text-4xl font-bold tracking-tight">
                      {formatNaira(unitPrice)}
                      <span
                        className={`ml-1 text-sm font-medium ${
                          plan.highlighted ? "text-white/70" : "text-[#65758B]"
                        }`}
                      >
                        /unit/{period}
                      </span>
                    </p>
                    <div
                      className={`mt-5 rounded-md px-4 py-3 text-center text-sm ${
                        plan.highlighted
                          ? "bg-[#0F4D87] text-white"
                          : "bg-[#F4F4F5] text-[#8A9AB0]"
                      }`}
                    >
                      e.g. {plan.exampleUnits} units ={" "}
                      {formatNaira(exampleTotal)}/{period}
                    </div>
                    <Link
                      href="/auth/signup"
                      className={`mt-5 inline-flex w-full items-center justify-center rounded-lg px-5 py-3.5 text-sm font-bold transition hover:-translate-y-0.5 active:translate-y-0 ${
                        plan.highlighted
                          ? "bg-white text-[#082744] hover:bg-slate-100"
                          : "bg-[#071D38] text-white hover:bg-[#020B16]"
                      }`}
                    >
                      Get Started
                    </Link>
                  </motion.article>
                );
              })}
            </div>

            <section className="mt-16 text-center">
              <span className="inline-flex rounded-full bg-[#FFF3CE] px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-[#D47500]">
                Optional Add-On
              </span>
              <h2 className="mt-5 text-2xl font-bold text-[#0D223A]">
                Concierge Inspection Service
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-[#64748B]">
                A trained representative visits, inspects, photographs, and
                reports — uploading everything directly to your dashboard.
                Billed per property.
              </p>

              <div className="mt-8 grid gap-6 text-left lg:grid-cols-3">
                {inspectionPlans.map((plan, index) => (
                  <motion.article
                    key={plan.name}
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -6 }}
                    viewport={{ once: true, amount: 0.25 }}
                    transition={{
                      type: "spring",
                      stiffness: 230,
                      damping: 22,
                      delay: index * 0.05,
                    }}
                    className={`rounded-xl border p-7 shadow-[0_14px_38px_rgba(15,23,42,0.04)] transition ${
                      plan.highlighted
                        ? "border-[#F3C24F] bg-[#FFF9E7]"
                        : "border-[#E0E7EF] bg-white hover:border-[#BBDCF2]"
                    }`}
                  >
                    <h3 className="text-lg font-bold text-[#0D223A]">
                      {plan.name}
                    </h3>
                    <p className="mt-5 text-sm text-[#607086]">
                      {plan.cadence}
                    </p>
                    <p className="mt-5 text-3xl font-bold text-[#0D223A]">
                      {formatNaira(plan.price)}
                      <span className="ml-1 text-sm font-medium text-[#66758A]">
                        /month / property
                      </span>
                    </p>
                    <Link
                      href="/auth/signup"
                      className="mt-5 inline-flex w-full items-center justify-center rounded-md border border-[#0D223A] px-4 py-3 text-sm font-bold text-[#0D223A] transition hover:-translate-y-0.5 hover:bg-[#0D223A] hover:text-white active:translate-y-0"
                    >
                      Add to Plan
                    </Link>
                  </motion.article>
                ))}
              </div>
            </section>

            <section className="mt-14 rounded-xl border border-[#E0E7EF] bg-[#F8FAFC] px-6 py-8">
              <h2 className="text-center text-xs font-bold uppercase tracking-[0.28em] text-[#66758A]">
                All Plans Include
              </h2>
              <div className="mx-auto mt-6 grid max-w-3xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {includedFeatures.map((feature) => (
                  <div
                    key={feature}
                    className="flex items-center gap-3 text-sm font-medium text-[#0D223A]"
                  >
                    <CheckCircle2 className="h-5 w-5 shrink-0 fill-[#2169F3] text-white" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </section>

            <p className="mt-12 text-center text-sm text-[#5D6B80]">
              Have more questions?{" "}
              <Link href="/faqs" className="font-bold text-[#0B63F6]">
                Check our FAQs
              </Link>{" "}
              or{" "}
              <a href={SUPPORT_MAILTO} className="font-bold text-[#0B63F6]">
                contact support.
              </a>
            </p>
          </section>
        </main>
        <LandingFooter />
      </div>
    </>
  );
}
