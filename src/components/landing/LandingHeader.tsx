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
    <header className="sticky top-0 z-50 w-full border-b border-white/20 bg-[#1F93D0] font-sans shadow-sm">
      <div className="mx-auto flex h-[69px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 text-white">
          <Image
            src={logo}
            alt="Dwelliva"
            width={170}
            height={40}
            className="h-8 w-auto object-contain"
          />
        </Link>
        <nav className="hidden items-center gap-1 rounded-lg bg-[#2A9AD6] p-1 text-sm text-white/95 md:flex">
          {nav.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`rounded-md px-3 py-1.5 transition duration-200 hover:-translate-y-0.5 ${
                isActiveRoute(item.href)
                  ? "bg-white/15 font-semibold text-white"
                  : "text-white/90 hover:bg-white/10 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <nav className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <button
                type="button"
                onClick={() => void handleDashboardClick()}
                disabled={isRoutingDashboard}
                className="rounded-lg border border-white/60 bg-transparent px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/10 active:translate-y-0 disabled:cursor-wait disabled:translate-y-0 disabled:opacity-70"
              >
                {isRoutingDashboard ? "Opening..." : "Dashboard"}
              </button>
              <button
                type="button"
                onClick={() => void handleLogout()}
                className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#0D4B73] transition hover:-translate-y-0.5 hover:bg-gray-100 active:translate-y-0"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="rounded-lg border border-white/60 bg-transparent px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/10 active:translate-y-0"
              >
                Log In
              </Link>
              <Link
                href="/auth/signup"
                className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#0D4B73] transition hover:-translate-y-0.5 hover:bg-gray-100 active:translate-y-0"
              >
                Sign Up
              </Link>
            </>
          )}
        </nav>
        <button
          type="button"
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center justify-center rounded-lg border border-white/40 p-2 text-white md:hidden"
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
