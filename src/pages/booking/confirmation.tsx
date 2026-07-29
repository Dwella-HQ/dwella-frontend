import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { LandingHeader } from "@/components/landing";
import { GuestHeader } from "@/components/guest/GuestHeader";
import { useUser } from "@/contexts/UserContext";
import { getMockStayById } from "@/data/mockShortStay";

function firstQueryString(value: string | string[] | undefined): string | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== "string" || !raw.trim()) return null;
  try {
    return decodeURIComponent(raw.trim());
  } catch {
    return raw.trim();
  }
}

/**
 * Payment gateway callback / confirmation page for short-stay bookings.
 *
 * Configure Paystack (or similar) `callback_url` to:
 *   `${origin}/booking/confirmation`
 *
 * Supported query params:
 * - reference / trxref
 * - amount
 * - propertyId / propertyName
 * - nights, guests, checkIn, checkOut
 */
export default function BookingConfirmationPage() {
  const router = useRouter();
  const { user } = useUser();
  const isLoggedInGuest = user?.role === "guest";

  const reference = React.useMemo(
    () =>
      firstQueryString(router.query.reference) ??
      firstQueryString(router.query.trxref),
    [router.query.reference, router.query.trxref],
  );

  const propertyId = firstQueryString(router.query.propertyId);
  const propertyName =
    firstQueryString(router.query.propertyName) ??
    (propertyId ? getMockStayById(propertyId)?.name : null) ??
    "your stay";

  const amountLabel = React.useMemo(() => {
    const raw = firstQueryString(router.query.amount);
    if (!raw) return null;
    const n = Number(raw);
    if (!Number.isFinite(n) || n <= 0) return null;
    return `₦${n.toLocaleString("en-NG")}`;
  }, [router.query.amount]);

  const nights = firstQueryString(router.query.nights);
  const doneHref = isLoggedInGuest
    ? "/guest"
    : propertyId
      ? `/property/${propertyId}`
      : "/properties";

  const backdropImage =
    (propertyId && getMockStayById(propertyId)?.image) ||
    "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1600&q=80";

  return (
    <>
      <Head>
        <title>Awaiting Confirmation | Dwelliva</title>
      </Head>

      <div className="relative min-h-screen bg-gray-900">
        {isLoggedInGuest ? <GuestHeader /> : <LandingHeader />}

        <div className="absolute inset-0 top-16 overflow-hidden">
          <Image
            src={backdropImage}
            alt=""
            fill
            className="object-cover opacity-40 blur-sm"
            priority
          />
          <div className="absolute inset-0 bg-black/50" />
        </div>

        <div className="relative z-10 flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-10">
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.28 }}
            className="relative w-full max-w-lg rounded-2xl bg-white px-6 py-10 text-center shadow-2xl sm:px-10"
            role="dialog"
            aria-modal="true"
            aria-labelledby="booking-confirmation-title"
          >
            <Link
              href={doneHref}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white transition hover:bg-red-600"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </Link>

            <h1
              id="booking-confirmation-title"
              className="text-2xl font-bold text-gray-900"
            >
              Awaiting Confirmation
            </h1>

            <div className="mt-6 rounded-xl bg-gray-50 px-5 py-6 text-sm leading-6 text-gray-700">
              Your payment is successful, you would receive a confirmatory mail
              from the host soon.
              {propertyName ? (
                <p className="mt-3 text-gray-600">
                  Booking for <span className="font-semibold">{propertyName}</span>
                  {nights ? ` · ${nights} night${nights === "1" ? "" : "s"}` : ""}
                  {amountLabel ? ` · ${amountLabel}` : ""}.
                </p>
              ) : null}
              {reference ? (
                <p className="mt-2 text-xs text-gray-500">
                  Reference: {reference}
                </p>
              ) : null}
            </div>

            <Link
              href={doneHref}
              className="mt-8 inline-flex w-full items-center justify-center rounded-xl bg-gray-900 py-3.5 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              Done
            </Link>
          </motion.div>
        </div>
      </div>
    </>
  );
}
