import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  LayoutDashboard,
  Home,
  Users,
  Crown,
  CircleDollarSign,
  ClipboardList,
  MessageSquare,
  Bell,
  LogOut,
  ShieldAlert,
  Settings,
  Search,
  BadgeCheck,
  Menu,
  X,
} from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { useNotifications } from "@/contexts/NotificationsContext";
import { logout as logoutRequest } from "@/api/auth";

type AdminLayoutProps = {
  title: string;
  children: React.ReactNode;
};

const adminNav = [
  { name: "Dashboard", href: "/dashboard/admin", icon: LayoutDashboard },
  { name: "Properties", href: "/dashboard/admin/properties", icon: Home },
  { name: "Tenants", href: "/dashboard/admin/tenants", icon: Users },
  { name: "L & P", href: "/dashboard/admin/lp", icon: Crown },
  {
    name: "Verifications",
    href: "/dashboard/admin/verifications",
    icon: BadgeCheck,
  },
  {
    name: "Audit Logs",
    href: "/dashboard/admin/audit-logs",
    icon: ClipboardList,
  },
  {
    name: "Transactions",
    href: "/dashboard/admin/transactions",
    icon: CircleDollarSign,
  },
  { name: "Messages", href: "/dashboard/admin/messages", icon: MessageSquare },
  { name: "Notifications", href: "/dashboard/admin/notifications", icon: Bell },
  { name: "Disputes", href: "/dashboard/admin/disputes", icon: ShieldAlert },
  { name: "Settings", href: "/dashboard/admin/settings", icon: Settings },
];

export const AdminLayout = ({ title, children }: AdminLayoutProps) => {
  const router = useRouter();
  const { user, isLoading, logout } = useUser();
  const { unreadCount } = useNotifications();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const closeSidebar = React.useCallback(() => {
    setSidebarOpen(false);
  }, []);

  const handleLogout = React.useCallback(async () => {
    if (!user || isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logoutRequest(user.id);
    } catch (error) {
      console.error("Admin logout request failed:", error);
    } finally {
      logout();
      await router.push("/auth/login");
      setIsLoggingOut(false);
    }
  }, [isLoggingOut, logout, router, user]);

  React.useEffect(() => {
    if (isLoading) return;
    if (!user?.token) {
      router.replace("/auth/login");
      return;
    }
    if (user.role !== "super_admin") {
      router.replace("/dashboard");
    }
  }, [isLoading, router, user]);

  React.useEffect(() => {
    const handleRouteChange = () => setSidebarOpen(false);
    router.events.on("routeChangeStart", handleRouteChange);
    return () => router.events.off("routeChangeStart", handleRouteChange);
  }, [router.events]);

  React.useEffect(() => {
    if (!sidebarOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [sidebarOpen]);

  if (isLoading || !user || user.role !== "super_admin") return null;

  return (
    <div className="min-h-screen [color-scheme:light] bg-[#EEF2F6] text-[#0F172A]">
      {sidebarOpen ? (
        <button
          type="button"
          aria-label="Close navigation menu"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={closeSidebar}
        />
      ) : null}

      <aside
        className={[
          "fixed left-0 top-0 z-50 flex h-screen w-[min(280px,85vw)] flex-col overflow-y-auto bg-[#071738] px-4 py-6 text-white transition-transform duration-300 ease-in-out",
          "lg:z-40 lg:w-[196px] lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="mb-6 flex items-center justify-between px-2 lg:mb-0 lg:block lg:pb-6">
          <div className="text-[26px] font-bold tracking-wide lg:text-[31px]">
            Dwelliva.
          </div>
          <button
            type="button"
            onClick={closeSidebar}
            className="rounded-md p-1.5 text-[#CDD5E1] hover:bg-[#14264B] lg:hidden"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="space-y-1.5">
          {adminNav.map((item) => {
            const isActive =
              item.href === "/dashboard/admin"
                ? router.asPath === item.href
                : router.asPath === item.href ||
                  router.asPath.startsWith(`${item.href}/`);
            const Icon = item.icon;
            const cls = isActive
              ? "bg-[#1E66FF] text-white"
              : "text-[#CDD5E1] hover:bg-[#14264B]";
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={closeSidebar}
                className={`flex items-center gap-2 rounded-md px-3 py-2.5 text-[13px] transition ${cls}`}
              >
                <Icon className="h-[15px] w-[15px] shrink-0" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="min-h-screen lg:pl-[196px]">
        <header className="fixed left-0 right-0 top-0 z-30 flex h-14 items-center justify-between gap-2 border-b border-[#E2E8F0] bg-white px-3 sm:h-[65px] sm:px-4 lg:left-[196px] lg:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-4">
            <button
              type="button"
              aria-label="Open navigation menu"
              onClick={() => setSidebarOpen(true)}
              className="shrink-0 rounded-md p-1.5 text-[#0F172A] transition hover:bg-[#F1F5F9] lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="truncate text-sm font-semibold sm:text-[15px]">
              {title}
            </h1>
            <div className="hidden min-w-0 flex-1 items-center gap-2 rounded-md border border-[#E2E8F0] bg-white px-3 py-1 md:flex lg:max-w-[306px]">
              <Search className="h-3.5 w-3.5 shrink-0 text-gray-500" />
              <input
                readOnly
                value=""
                placeholder="Search by user, action type, log ID, or keywords."
                className="w-full min-w-0 bg-white text-xs text-[#0F172A] outline-none placeholder:text-gray-400"
              />
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-4">
            <button
              type="button"
              aria-label="Notifications"
              onClick={() => void router.push("/dashboard/admin/notifications")}
              className="relative rounded-md p-1.5 text-[#0F172A] transition hover:bg-[#F1F5F9]"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 ? (
                <span className="absolute right-0.5 top-0.5 min-w-3 rounded-full bg-[#EF4444] px-1 text-[8px] font-semibold leading-3 text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              ) : null}
            </button>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E2E8F0] text-[11px] font-semibold text-[#0F172A]">
                AU
              </div>
              <div className="hidden text-right leading-tight sm:block">
                <p className="text-[12px] font-semibold">Admin User</p>
                <p className="text-[10px] text-[#64748B]">System Admin</p>
              </div>
            </div>
            <button
              type="button"
              aria-label="Logout"
              disabled={isLoggingOut}
              onClick={() => void handleLogout()}
              className="rounded-md p-1.5 text-[#EF4444] transition hover:bg-[#FEF2F2] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>
        <main className="mt-14 w-full min-w-0 p-3 sm:mt-[65px] sm:p-4 lg:p-6">
          <div className="mx-auto w-full min-w-0 max-w-[1320px]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
