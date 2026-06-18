import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronRight } from "lucide-react";
import { LandingHeader, LandingFooter, StatsBar } from "@/components/landing";

const faqs = [
  {
    q: "Lorem ipsum dolor sit amet consectetur. Risus nibh ut maecenas.",
    a: "Lorem ipsum dolor sit amet. Mi fermentum cursus vitae porttitor vulputate.",
  },
  {
    q: "Lorem ipsum dolor sit amet consectetur. Non sit consectetur.",
    a: "Answer placeholder.",
  },
  {
    q: "Lorem ipsum dolor sit amet consectetur. Eget nunc scelerisque.",
    a: "Answer placeholder.",
  },
  {
    q: "Lorem ipsum dolor sit amet consectetur. Ornare massa eget.",
    a: "Answer placeholder.",
  },
  {
    q: "Lorem ipsum dolor sit amet consectetur. Facilisi nullam vehicula.",
    a: "Answer placeholder.",
  },
];

export default function FAQsPage() {
  const [openIndex, setOpenIndex] = React.useState(0);

  return (
    <>
      <Head>
        <title>FAQs | Dwelliva</title>
      </Head>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <LandingHeader />
        <div className="border-b border-gray-200 bg-[var(--brand-main)] px-4 py-3">
          <div className="mx-auto max-w-7xl text-sm text-white/90">
            <Link href="/" className="hover:text-white">
              Home
            </Link>
            <span className="mx-2">›</span>
            <span className="text-white">FAQs</span>
          </div>
        </div>
        <main className="flex-1 bg-[var(--brand-main)] py-12">
          <div className="mx-auto max-w-3xl px-4 text-center text-white">
            <h1 className="text-3xl font-bold md:text-4xl">
              Got Questions? We have got Answers.
            </h1>
            <p className="mt-2 text-lg opacity-90">
              Find everything you need to know about houses, renting and
              listings.
            </p>
          </div>
          <div className="mx-auto mt-8 max-w-3xl px-4">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="overflow-hidden rounded-2xl bg-white shadow-lg"
            >
              {faqs.map((faq, i) => (
                <div key={i} className="border-b border-gray-100 last:border-0">
                  <button
                    type="button"
                    onClick={() => setOpenIndex(openIndex === i ? -1 : i)}
                    className="flex w-full items-center justify-between px-6 py-4 text-left font-medium text-gray-900 transition hover:bg-gray-50"
                  >
                    <span className="pr-4">{faq.q}</span>
                    {openIndex === i ? (
                      <ChevronDown className="h-5 w-5 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="h-5 w-5 flex-shrink-0" />
                    )}
                  </button>
                  <AnimatePresence initial={false}>
                    {openIndex === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22 }}
                        className="overflow-hidden border-t border-gray-100 bg-gray-50/50"
                      >
                        <div className="px-6 pb-4 pt-2 text-sm text-gray-600">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </motion.div>
          </div>
        </main>
        <StatsBar />
        <LandingFooter />
      </div>
    </>
  );
}
