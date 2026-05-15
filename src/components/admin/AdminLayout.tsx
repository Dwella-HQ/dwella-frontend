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
  Megaphone,
  Bell,
  LogOut,
  ShieldAlert,
  Settings,
  Search,
  BadgeCheck,
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
  {
    name: "Announcements",
    href: "/dashboard/admin/announcements",
    icon: Megaphone,
  },
  { name: "Notifications", href: "/dashboard/admin/notifications", icon: Bell },
  { name: "Disputes", href: "/dashboard/admin/disputes", icon: ShieldAlert },
  { name: "Settings", href: "/dashboard/admin/settings", icon: Settings },
];

export const AdminLayout = ({ title, children }: AdminLayoutProps) => {
  const router = useRouter();
  const { user, isLoading, logout } = useUser();
  const { unreadCount } = useNotifications();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const handleLogout = React.useCallback(async () => {
    if (!user || isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logoutRequest(user.id);
    } catch (error) {
      // We still clear client session even when server logout fails.
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

  if (isLoading || !user || user.role !== "super_admin") return null;

  return (
    <div className="min-h-screen bg-[#EEF2F6] text-[#0F172A]">
      <div className="min-h-screen">
        <aside className="fixed left-0 top-0 h-screen w-[196px] overflow-y-auto bg-[#071738] px-4 py-6 text-white">
          <div className="px-2 pb-6 text-[31px] font-bold tracking-wide">
            DWELLA.
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
                  className={`flex items-center gap-2 rounded-md px-3 py-2.5 text-[13px] transition ${cls}`}
                >
                  <Icon className="h-[15px] w-[15px]" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className="min-h-screen pl-[196px]">
          <header className="fixed left-[196px] right-0 top-0 z-30 flex h-[65px] items-center justify-between border-b border-[#E2E8F0] bg-white px-6">
            <div className="flex items-center gap-4">
              <h1 className="text-[15px] font-semibold">{title}</h1>
              <div className="hidden w-[306px] items-center gap-2 rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-1 md:flex">
                <Search className="h-3.5 w-3.5 text-gray-500" />
                <input
                  readOnly
                  value=""
                  placeholder="Search by user, action type, log ID, or keywords."
                  className="w-full bg-transparent text-xs outline-none placeholder:text-gray-400"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                type="button"
                aria-label="Notifications"
                onClick={() =>
                  void router.push("/dashboard/admin/notifications")
                }
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
                <div className="text-right leading-tight">
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
          <main className="mt-[65px] p-4">
            <div className="mx-auto w-full max-w-[1320px]">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
};
