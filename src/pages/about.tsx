import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
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
          <section className="bg-[#0D4DA0] text-white">
            <div className="mx-auto max-w-7xl px-4 py-6 text-sm sm:px-6 lg:px-8">
              <Link href="/" className="opacity-90 hover:opacity-100">
                Home
              </Link>
              <span className="mx-2 opacity-70">›</span>
              <span className="font-medium">About Us</span>
            </div>
            <div className="mx-auto max-w-4xl px-4 pb-16 pt-4 text-center sm:px-6 lg:px-8 lg:pb-20">
              <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
                Reimagining Real Estate in Nigeria
              </h1>
              <p className="mx-auto mt-5 max-w-3xl text-base text-blue-100 sm:text-lg">
                We are building a future where finding a home and managing
                properties is a seamless, secure, and delightful experience.
              </p>
            </div>
          </section>

          <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
            <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
              <div>
                <h2 className="text-4xl font-bold text-gray-900">Our Story</h2>
                <div className="mt-6 space-y-6 text-lg leading-9 text-gray-600">
                  <p>
                    Dwelliva was born out of frustration with the traditional
                    rental process in Nigeria. Hidden fees, unverified landlords,
                    and paper-based processes were making it unnecessarily
                    difficult for people to find comfortable homes.
                  </p>
                  <p>
                    We set out to create a platform that brings transparency and
                    trust to the rental market. By digitizing lease agreements,
                    verifying every single property, and providing a unified
                    payment system, we&apos;ve helped thousands of tenants and
                    landlords find peace of mind.
                  </p>
                  <p>
                    Today, we are the leading prop-tech platform connecting
                    verified tenants with premium landlords across 15+ cities in
                    Nigeria.
                  </p>
                </div>
              </div>
              <div className="relative overflow-hidden rounded-3xl bg-white shadow-xl">
                <Image
                  src="https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1000&q=80"
                  alt="Team collaborating"
                  width={1000}
                  height={800}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </section>
          <StatsBar />
        </main>{" "}
        <LandingFooter />
      </div>
    </>
  );
}
