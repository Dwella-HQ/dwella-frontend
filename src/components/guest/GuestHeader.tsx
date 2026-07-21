import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import {
  Bell,
  ChevronDown,
  Home,
  LogOut,
  Menu,
  MessageSquare,
  Search,
  Settings,
  X,
} from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import logo from "@/assets/logo_white_horizontal.png";

const navItems = [
  { label: "Dashboard", href: "/guest", icon: Home },
  { label: "Messages", href: "/guest/messages", icon: MessageSquare },
  { label: "Settings", href: "/guest/settings", icon: Settings },
] as const;

type GuestHeaderProps = {
  showSearch?: boolean;
};

export const GuestHeader = ({ showSearch = false }: GuestHeaderProps) => {
  const router = useRouter();
  const { user, logout } = useUser();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);

  const isActive = React.useCallback(
    (href: string) => {
      if (href === "/guest") {
        return router.pathname === "/guest";
      }
      return (
        router.pathname === href || router.pathname.startsWith(`${href}/`)
      );
    },
    [router.pathname],
  );

  const displayName = user?.name?.trim() || "Guest";
  const shortName = React.useMemo(() => {
    const parts = displayName.split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "Guest";
    if (parts.length === 1) return parts[0];
    return `${parts[0]} ${parts[1][0]}.`;
  }, [displayName]);

  const initials = React.useMemo(() => {
    return displayName
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "G";
  }, [displayName]);

  const handleLogout = React.useCallback(async () => {
    logout();
    setMenuOpen(false);
    setMobileOpen(false);
    await router.push("/");
  }, [logout, router]);

  return (
    <header className="sticky top-0 z-50 w-full bg-[var(--brand-main)] font-sans text-white shadow-[0_10px_30px_rgba(2,8,23,0.12)]">
      <div className="mx-auto grid h-[69px] max-w-7xl grid-cols-[1fr_auto] items-center gap-3 px-4 sm:px-6 md:grid-cols-[1fr_auto_1fr] lg:px-8">
        <Link
          href="/guest"
          className="flex items-center justify-self-start transition hover:opacity-90"
        >
          <Image
            src={logo}
            alt="Dwelliva"
            width={170}
            height={40}
            className="h-8 w-auto object-contain"
            priority
          />
        </Link>

        <nav className="hidden items-center justify-self-center rounded-full bg-white/95 p-1 shadow-[0_8px_24px_rgba(2,8,23,0.12)] md:flex">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-[var(--brand-main)] text-white shadow-sm"
                    : "text-gray-900 hover:bg-gray-100"
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center justify-self-end gap-3 md:flex">
          <button
            type="button"
            aria-label="Notifications"
            className="relative rounded-full p-2 text-white/90 transition hover:bg-white/10 hover:text-white"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-[var(--brand-main)]" />
          </button>

          {showSearch ? (
            <button
              type="button"
              aria-label="Search"
              onClick={() => {
                const el = document.getElementById("guest-search");
                el?.scrollIntoView({ behavior: "smooth", block: "center" });
              }}
              className="rounded-full p-2 text-white/90 transition hover:bg-white/10 hover:text-white"
            >
              <Search className="h-5 w-5" />
            </button>
          ) : null}

          <div className="mx-1 hidden h-8 w-px bg-white/30 sm:block" />

          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition hover:bg-white/10"
              aria-expanded={menuOpen}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-400 text-sm font-semibold text-white">
                {initials}
              </span>
              <span className="hidden text-left leading-tight lg:block">
                <span className="block text-sm font-semibold">{shortName}</span>
                <span className="block text-xs text-white/75">User</span>
              </span>
              <ChevronDown className="h-4 w-4 text-white/80" />
            </button>

            {menuOpen ? (
              <div className="absolute right-0 mt-2 w-44 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 text-gray-900 shadow-xl">
                <Link
                  href="/guest/settings"
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-2.5 text-sm hover:bg-gray-50"
                >
                  Settings
                </Link>
                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <button
          type="button"
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((open) => !open)}
          className="inline-flex items-center justify-center justify-self-end rounded-lg border border-white/40 p-2 text-white md:hidden"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen ? (
        <div className="border-t border-white/20 bg-[var(--brand-main)] md:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3 sm:px-6">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`inline-flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium ${
                    active ? "bg-white/20 text-white" : "text-white/90"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="mt-1 inline-flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-white/90"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </nav>
        </div>
      ) : null}
    </header>
  );
};
