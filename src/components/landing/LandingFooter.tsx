import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Mail, Phone } from "lucide-react";
import logo from "@/assets/logo_white_horizontal.png";
import { SUPPORT_EMAIL, SUPPORT_MAILTO } from "@/lib/supportContact";
import { SOCIAL_LINKS } from "@/lib/socialLinks";

const WAITLIST_URL = "https://app.youform.com/forms/dc4vgu65";

export const LandingFooter = () => {
  return (
    <footer className="relative overflow-hidden bg-[#041B3A] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(31,199,255,0.18),transparent_32%),radial-gradient(circle_at_86%_30%,rgba(15,99,222,0.2),transparent_34%)]" />
      <div className="relative mx-auto w-full max-w-7xl px-6 py-14 sm:px-8 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-[1.25fr_0.8fr_0.8fr_1fr]">
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2 text-white">
              <Image
                src={logo}
                alt="Dwelliva"
                width={170}
                height={40}
                className="h-8 w-auto object-contain"
              />
            </Link>
            <p className="text-sm text-white/90">
              Helping property teams run smarter, clearer, and more reliable
              operations.
            </p>
            <a
              href={WAITLIST_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-[#1FC7FF] px-5 py-3 text-sm font-semibold text-[#062F5F] shadow-[0_16px_36px_rgba(31,199,255,0.22)] transition hover:-translate-y-0.5 hover:bg-[#56D6FF] active:translate-y-0"
            >
              Join the Waitlist <ArrowRight className="h-4 w-4" />
            </a>
          </div>
          <div>
            <h3 className="mb-4 text-sm font-bold text-white">Quick links</h3>
            <ul className="space-y-3 text-sm text-white/72">
              <li>
                <Link href="/pricing" className="transition hover:text-white">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/faqs" className="transition hover:text-white">
                  FAQs
                </Link>
              </li>
              <li>
                <Link href="/terms" className="transition hover:text-white">
                  Terms and conditions
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="transition hover:text-white">
                  Privacy policy
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-sm font-bold text-white">Get Started</h3>
            <ul className="space-y-3 text-sm text-white/72">
              <li>
                <Link
                  href="/auth/signup?role=landlord"
                  className="transition hover:text-white"
                >
                  As Landlord
                </Link>
              </li>
              <li>
                <Link
                  href="/auth/signup/manager"
                  className="transition hover:text-white"
                >
                  As Property Manager
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-sm font-bold text-white">Contact us</h3>
            <ul className="space-y-3 text-sm text-white/72">
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 flex-shrink-0 text-[#1FC7FF]" />
                <a
                  href={SUPPORT_MAILTO}
                  className="transition hover:text-white"
                >
                  {SUPPORT_EMAIL}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 flex-shrink-0 text-[#1FC7FF]" />
                <a
                  href="tel:+2347896743888"
                  className="transition hover:text-white"
                >
                  +234 789 674 3888
                </a>
              </li>
              <li className="flex gap-4 pt-2">
                <a
                  href={SOCIAL_LINKS.x}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.08] text-white/85 ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:bg-white/[0.14] hover:text-white"
                  aria-label="X"
                >
                  <svg
                    className="h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                <a
                  href={SOCIAL_LINKS.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.08] text-white/85 ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:bg-white/[0.14] hover:text-white"
                  aria-label="Instagram"
                >
                  <svg
                    className="h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073z" />
                  </svg>
                </a>
                <a
                  href={SOCIAL_LINKS.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.08] text-white/85 ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:bg-white/[0.14] hover:text-white"
                  aria-label="Facebook"
                >
                  <svg
                    className="h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-white/55 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Dwelliva. All rights reserved.</p>
          <p>Property operations made clearer.</p>
        </div>
      </div>
    </footer>
  );
};
