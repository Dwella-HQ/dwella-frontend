import { writeFileSync } from "node:fs";

const content = `import * as React from "react";
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
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

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
    setIsSidebarOpen(false);
  }, [router.asPath]);

  React.useEffect(() => {
    if (!isSidebarOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isSidebarOpen]);

  if (isLoading || !user || user.role !== "super_admin") return null;

  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="min-h-screen bg-[#EEF2F6] text-[#0F172A]">
      {isSidebarOpen ? (
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
          isSidebarOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="mb-6 flex items-center justify-between px-2">
          <motionlessAdminShell
`;

writeFileSync("src/components/admin/AdminLayout.tsx", content);
