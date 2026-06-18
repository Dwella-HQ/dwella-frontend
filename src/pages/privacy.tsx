import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";
import { LandingHeader, LandingFooter, StatsBar } from "@/components/landing";

export default function PrivacyPage() {
  return (
    <>
      <Head>
        <title>Privacy policy | Dwelliva</title>
      </Head>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <LandingHeader />
        <div className="border-b border-gray-200 bg-[var(--brand-main)] px-4 py-3">
          <div className="mx-auto max-w-7xl text-sm text-white/90">
            <Link href="/" className="hover:text-white">
              Home
            </Link>
            <span className="mx-2">›</span>
            <span className="text-white">Privacy policy</span>
          </div>
        </div>
        <main className="flex-1 py-12">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <h1 className="text-center text-3xl font-bold text-[var(--brand-main)]">
              Privacy policy
            </h1>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="mt-8 rounded-xl border border-gray-200 bg-white p-6 text-gray-700 shadow-sm"
            >
              <p className="leading-relaxed">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
                eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
                enim ad minim veniam, quis nostrud exercitation ullamco laboris
                nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor
                in reprehenderit in voluptate velit esse cillum dolore eu fugiat
                nulla pariatur.
              </p>
              <p className="mt-4 leading-relaxed">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
                eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
                enim ad minim veniam, quis nostrud exercitation ullamco laboris
                nisi ut aliquip ex ea commodo consequat. Excepteur sint occaecat
                cupidatat non proident, sunt in culpa qui officia deserunt
                mollit anim id est laborum.
              </p>
            </motion.div>
          </div>
        </main>
        <StatsBar />
        <LandingFooter />
      </div>
    </>
  );
}
