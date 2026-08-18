import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { useRouter } from "next/router";
import logo from "@/assets/logo_white_horizontal.png";
import { useUser } from "@/contexts/UserContext";
import { getLandlordByUser } from "@/api/landlord";

export const LandingHeader = () => {
  const [open, setOpen] = React.useState(false);
  const [isRoutingDashboard, setIsRoutingDashboard] = React.useState(false);
  const router = useRouter();
  const { user, logout } = useUser();
  const pathname = router.pathname;
  const nav = [
    { label: "Home", href: "/" },
    { label: "Properties", href: "/properties" },
    { label: "About Us", href: "/about" },
    { label: "Features", href: "/features" },
    { label: "Pricing", href: "/pricing" },
    { label: "FAQs", href: "/faqs" },
  ];

  const isActiveRoute = (href: string): boolean => {
    if (href === "/") return pathname === "/";
    if (href === "/properties") {
      return pathname === "/properties" || pathname.startsWith("/property/");
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const handleLogout = React.useCallback(async () => {
    logout();
    setOpen(false);
    await router.push("/");
  }, [logout, router]);

  const handleDashboardClick = React.useCallback(async () => {
    if (!user) return;
    setOpen(false);

    if (user.role === "guest") {
      await router.push("/guest");
      return;
    }

    if (user.role !== "landlord") {
      await router.push("/dashboard");
      return;
    }

    setIsRoutingDashboard(true);
    try {
      const result = await getLandlordByUser(String(user.id));
      if (result.success) {
        if (typeof window !== "undefined" && result.data.id) {
          localStorage.setItem("landlordId", result.data.id);
        }
        await router.push("/dashboard");
        return;
      }

      if (result.statusCode === 404) {
        await router.push("/onboarding/landlord/details");
        return;
      }

      await router.push("/dashboard");
    } finally {
      setIsRoutingDashboard(false);
    }
  }, [router, user]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.15] bg-[#168BC8]/[0.92] font-sans shadow-[0_10px_30px_rgba(2,8,23,0.08)] backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.08),transparent_34%,rgba(255,255,255,0.06))]" />
      <div className="mx-auto grid h-[69px] max-w-7xl grid-cols-[1fr_auto] items-center px-4 sm:px-6 md:grid-cols-[1fr_auto_1fr] lg:px-8">
        <Link
          href="/"
          className="relative flex items-center gap-2 justify-self-start text-white transition hover:-translate-y-0.5"
        >
          <Image
            src={logo}
            alt="Dwelliva"
            width={170}
            height={40}
            className="h-8 w-auto object-contain"
          />
        </Link>
        <nav className="relative hidden items-center gap-1 justify-self-center rounded-2xl border border-white/10 bg-white/[0.08] p-1 text-sm text-white/95 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_14px_28px_rgba(2,8,23,0.08)] backdrop-blur md:flex">
          {nav.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`rounded-xl px-4 py-2 transition duration-200 hover:-translate-y-0.5 ${
                isActiveRoute(item.href)
                  ? "bg-white/[0.18] font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]"
                  : "text-white/[0.88] hover:bg-white/10 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <nav className="relative hidden items-center gap-3 justify-self-end md:flex">
          {user ? (
            <>
              <button
                type="button"
                onClick={() => void handleDashboardClick()}
                disabled={isRoutingDashboard}
                className="rounded-xl border border-white/[0.55] bg-white/[0.06] px-5 py-2.5 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] transition hover:-translate-y-0.5 hover:bg-white/[0.14] active:translate-y-0 disabled:cursor-wait disabled:translate-y-0 disabled:opacity-70"
              >
                {isRoutingDashboard ? "Opening..." : "Dashboard"}
              </button>
              <button
                type="button"
                onClick={() => void handleLogout()}
                className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-[#0D4B73] shadow-[0_14px_28px_rgba(2,8,23,0.1)] transition hover:-translate-y-0.5 hover:bg-[#F8FBFF] active:translate-y-0"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="rounded-xl border border-white/[0.55] bg-white/[0.06] px-5 py-2.5 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] transition hover:-translate-y-0.5 hover:bg-white/[0.14] active:translate-y-0"
              >
                Log In
              </Link>
              <Link
                href="/auth/signup"
                className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-[#0D4B73] shadow-[0_14px_28px_rgba(2,8,23,0.1)] transition hover:-translate-y-0.5 hover:bg-[#F8FBFF] active:translate-y-0"
              >
                Sign Up
              </Link>
            </>
          )}
        </nav>
        <button
          type="button"
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center justify-center justify-self-end rounded-lg border border-white/40 p-2 text-white md:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <div className="border-t border-white/20 bg-[#1F93D0] md:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-3 sm:px-6">
            {nav.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`rounded-md px-2 py-2 text-sm font-medium hover:bg-white/10 ${isActiveRoute(item.href) ? "bg-white/15 text-white" : "text-white/95"}`}
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-1 grid grid-cols-2 gap-2">
              {user ? (
                <>
                  <button
                    type="button"
                    onClick={() => void handleDashboardClick()}
                    disabled={isRoutingDashboard}
                    className="rounded-md border border-white/60 px-3 py-2 text-center text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-70"
                  >
                    {isRoutingDashboard ? "Opening..." : "Dashboard"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleLogout()}
                    className="rounded-md bg-white px-3 py-2 text-center text-sm font-semibold text-[#0D4B73]"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    onClick={() => setOpen(false)}
                    className="rounded-md border border-white/60 px-3 py-2 text-center text-sm font-semibold text-white"
                  >
                    Log In
                  </Link>
                  <Link
                    href="/auth/signup"
                    onClick={() => setOpen(false)}
                    className="rounded-md bg-white px-3 py-2 text-center text-sm font-semibold text-[#0D4B73]"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};
