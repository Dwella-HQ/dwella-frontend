import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { LandingFooter, LandingHeader, StatsBar } from "@/components/landing";
import { SUPPORT_EMAIL, SUPPORT_MAILTO } from "@/lib/supportContact";

const plans = [
  {
    name: "Starter",
    description:
      "Perfect for independent landlords managing a single property.",
    price: "Free",
    period: "",
    highlighted: false,
    features: [
      "Manage up to 2 properties",
      "Basic contact records",
      "Manual payment tracking",
      "Standard email support",
    ],
    unavailable: [
      "Automated payment workflows",
      "Digital document workflows",
      "Dedicated property manager",
    ],
  },
  {
    name: "Professional",
    description:
      "Everything you need to grow your portfolio and automate tasks.",
    price: "₦15,000",
    period: "/month",
    highlighted: true,
    features: [
      "Manage up to 15 properties",
      "Automated payment workflows",
      "Full background checks",
      "Digital document workflows",
      "Priority 24/7 support",
    ],
    unavailable: ["Dedicated property manager"],
  },
  {
    name: "Enterprise",
    description:
      "Advanced tools for property management companies and agencies.",
    price: "₦50,000",
    period: "/month",
    highlighted: false,
    features: [
      "Unlimited portfolio records",
      "Automated payment workflows",
      "Advanced analytics and reporting",
      "Team access and roles",
      "Dedicated property manager",
      "Custom integrations",
    ],
    unavailable: [],
  },
];

export default function PricingPage() {
  return (
    <>
      <Head>
        <title>Pricing | Dwelliva</title>
      </Head>
      <div className="min-h-screen bg-[#F3F5F8]">
        <LandingHeader />
        <main>
          <section className="relative overflow-hidden bg-[#0D4DA0] text-white">
            <div className="absolute inset-0 bg-gradient-to-r from-[#0D4DA0] via-[#0D4DA0]/95 to-[#0D4DA0]/90" />
            <div className="relative mx-auto max-w-7xl px-4 py-6 text-sm sm:px-6 lg:px-8">
              <Link href="/" className="opacity-90 hover:opacity-100">
                Home
              </Link>
              <span className="mx-2 opacity-70">›</span>
              <span className="font-medium">Pricing</span>
            </div>
            <div className="relative mx-auto max-w-5xl px-4 pb-20 pt-8 text-center sm:px-6 lg:px-8 lg:pb-24">
              <h1 className="text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
                Pricing that scales with you
              </h1>
              <p className="mx-auto mt-6 max-w-3xl text-base leading-8 text-blue-100 sm:text-lg">
                Whether you&apos;re managing a single property or running a
                large portfolio, we have the perfect plan for your needs.
              </p>
              <div className="mt-10 inline-flex rounded-full bg-white/90 p-1 text-xs font-semibold text-gray-700">
                <button className="rounded-full bg-sky-500 px-6 py-2.5 text-white">
                  MONTHLY
                </button>
                <button className="rounded-full px-6 py-2.5">YEARLY</button>
              </div>
            </div>
          </section>

          <section className="mx-auto -mt-8 max-w-7xl px-4 pb-16 sm:px-6 lg:px-8 lg:pb-20">
            <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-3">
              {plans.map((plan, index) => (
                <motion.article
                  key={plan.name}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -8, scale: plan.highlighted ? 1.015 : 1.01 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ type: "spring", stiffness: 240, damping: 22, delay: index * 0.06 }}
                  className={`relative rounded-3xl border p-8 shadow-lg transition-colors duration-300 ${
                    plan.highlighted
                      ? "border-blue-900 bg-[#0D3E84] text-white hover:border-sky-300 hover:shadow-[0_26px_70px_rgba(13,62,132,0.25)]"
                      : "border-gray-200 bg-white text-gray-900 hover:border-sky-200 hover:shadow-[0_24px_60px_rgba(15,23,42,0.12)]"
                  }`}
                >
                  {plan.highlighted ? (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-sky-500 px-4 py-1 text-xs font-semibold text-white">
                      Most Popular
                    </span>
                  ) : null}
                  <h2 className="text-4xl font-bold">{plan.name}</h2>
                  <p
                    className={`mt-4 text-sm leading-7 ${
                      plan.highlighted ? "text-blue-100" : "text-gray-600"
                    }`}
                  >
                    {plan.description}
                  </p>
                  <div className="mt-8">
                    <p className="text-5xl font-bold leading-tight">
                      {plan.price}
                    </p>
                    {plan.period ? (
                      <p
                        className={`mt-2 text-sm ${
                          plan.highlighted ? "text-blue-100" : "text-gray-600"
                        }`}
                      >
                        {plan.period}
                      </p>
                    ) : null}
                  </div>
                  <ul className="mt-8 space-y-4 text-sm">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <Check
                          className={`mt-0.5 h-4 w-4 ${
                            plan.highlighted ? "text-sky-200" : "text-sky-600"
                          }`}
                        />
                        <span>{feature}</span>
                      </li>
                    ))}
                    {plan.unavailable.map((feature) => (
                      <li
                        key={feature}
                        className={`flex items-start gap-2 ${
                          plan.highlighted
                            ? "text-blue-300/70"
                            : "text-gray-400"
                        }`}
                      >
                        <X className="mt-0.5 h-4 w-4" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    className={`mt-10 w-full rounded-xl px-4 py-3.5 text-sm font-semibold transition hover:-translate-y-0.5 active:translate-y-0 ${
                      plan.highlighted
                        ? "bg-white text-[#0D3E84] hover:bg-slate-100"
                        : "bg-[#111827] text-white hover:bg-black"
                    }`}
                  >
                    Get Started
                  </button>
                </motion.article>
              ))}
            </div>
            <p className="mt-12 text-center text-sm text-gray-600">
              Have more questions?{" "}
              <Link href="/features" className="font-semibold text-sky-600">
                Check our FAQs
              </Link>{" "}
              or{" "}
              <a href={SUPPORT_MAILTO} className="font-semibold text-sky-600">
                contact {SUPPORT_EMAIL}.
              </a>
            </p>
          </section>
          <StatsBar />
        </main>
        <LandingFooter />
      </div>
    </>
  );
}
