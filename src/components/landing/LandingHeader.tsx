import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import logo from "@/assets/logo.png";

export const LandingHeader = () => {
  return (
    <header className="sticky top-0 z-50 w-full bg-[var(--brand-main)] shadow-sm">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 text-white">
          <Image
            src={logo}
            alt="DWELLA NG"
            width={32}
            height={32}
            className="object-contain brightness-0 invert"
          />
          <span className="text-lg font-bold tracking-tight">DWELLA NG</span>
        </Link>
        <nav className="flex items-center gap-3">
          <Link
            href="/auth/login"
            className="rounded-lg border border-white/30 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
          >
            Log In
          </Link>
          <Link
            href="/auth/signup"
            className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-[var(--brand-main)] transition hover:bg-gray-100"
          >
            Sign Up
          </Link>
        </nav>
      </div>
    </header>
  );
};
