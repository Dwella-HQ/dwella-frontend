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
  ShieldAlert,
  Settings,
  Search,
} from "lucide-react";
import { useUser } from "@/contexts/UserContext";

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
  const { user, isLoading } = useUser();

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
      <div className="grid min-h-screen grid-cols-[196px_1fr]">
        <aside className="bg-[#071738] px-4 py-6 text-white">
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

        <div className="flex flex-col">
          <header className="flex h-[65px] items-center justify-between border-b border-[#E2E8F0] bg-white px-6">
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
            <div className="text-right">
              <p className="text-[12px] font-semibold">Admin User</p>
              <p className="text-[10px] text-[#64748B]">System Admin</p>
            </div>
          </header>
          <main className="p-4">
            <div className="mx-auto w-full max-w-[min(92vw,1320px)]">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};
