import Link from "next/link";
import * as React from "react";
import Image from "next/image";
import {
  BellIcon,
  LayoutDashboard,
  LogOutIcon,
  Home,
  DollarSign,
  Wrench,
  MessageSquare,
  MoreHorizontal,
  Settings,
} from "lucide-react";
import { useRouter } from "next/router";
import { useProfile } from "@/contexts/ProfileContext";
import { logout } from "@/utils/auth";
import logo from "@/assets/logo.png";

const navigationLinks = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Properties", href: "/dashboard/properties", icon: Home },
  { name: "Rent", href: "/dashboard/rent", icon: DollarSign },
  { name: "Maintenance", href: "/dashboard/maintenance", icon: Wrench },
  { name: "Messages", href: "/dashboard/messages", icon: MessageSquare },
  { name: "More", href: "/dashboard/more", icon: MoreHorizontal },
];

export type DashboardSidebarProps = {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
};

export const DashboardSidebar = ({
  isOpen,
  onToggle,
  onClose,
}: DashboardSidebarProps) => {
  const router = useRouter();
  const currentPath = router.pathname;
  const { profile } = useProfile();

  // For now, show all navigation links (landlord navigation)
  const filteredLinks = React.useMemo(() => {
    return navigationLinks;
  }, []);

  return (
    <>
      <aside
        className={[
          "fixed inset-y-0 left-0 z-30 flex w-60 flex-col border-r border-brand-border-light bg-brand-white/95 p-6 shadow-lg backdrop-blur-lg transition-transform duration-300",
          "lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="w-full mb-8 flex items-center justify-between">
          <div className="w-full flex flex-col items-center justify-center gap-2">
            <Image
              src={logo}
              alt="DWELLA NG logo"
              width={50}
              height={50}
              className="object-contain"
            />
            <span className="text-sm font-bold text-brand-main uppercase tracking-wide">
              DWELLA NG
            </span>
          </div>

          <button
            type="button"
            onClick={onToggle}
            className="rounded-md p-2 text-brand-ash hover:text-brand-black lg:hidden"
          >
            <span className="sr-only">Close navigation</span>✕
          </button>
        </div>

        <nav className="flex flex-col gap-3 items-center justify-center">
          {filteredLinks.map((link) => {
            const isActive = currentPath === link.href;

            return (
              <Link
                key={link.name}
                href={link.href}
                className={
                  isActive
                    ? "transition-fx w-full flex items-center justify-between rounded-lg px-4 py-3 bg-brand-main text-brand-white shadow-sm shadow-brand-main/30"
                    : "transition-fx w-full group flex items-center justify-between rounded-lg px-4 py-3 text-brand-ash hover:bg-brand-main-bg hover:text-brand-main"
                }
                onClick={onClose}
              >
                <span className="flex items-center gap-4">
                  <link.icon className="h-6 w-6" />
                  <span
                    className={
                      isActive
                        ? "transition-fx text-base font-medium"
                        : "transition-fx text-base font-medium group-hover:translate-x-2"
                    }
                  >
                    {link.name}
                  </span>
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto rounded-xl p-4 text-sm text-brand-main mb-6">
        </div>

        {/* <div className="mt-auto rounded-xl bg-brand-main-bg p-4 text-sm text-brand-main mb-6">
          <p className="font-semibold">Need insights?</p>
          <p className="mt-1 text-brand-ash">
            Generate detailed partner performance summaries with a single click.
          </p>
          <button
            type="button"
            className="mt-4 inline-flex w-full items-center justify-center rounded-lg bg-brand-main px-3 py-2 text-sm font-semibold text-brand-white transition hover:bg-brand-main/90"
          >
            View reports
          </button>
        </div> */}

        <button
          type="button"
          className="transition-fx group w-full flex items-center justify-center rounded-lg px-4 py-3 text-brand-ash hover:bg-brand-failed-bg hover:text-brand-failed-text"
          onClick={() => {
            logout();
          }}
        >
          <span className="flex items-center gap-4">
            <LogOutIcon className="h-6 w-6" />
            <span className="transition-fx text-base font-medium group-hover:translate-x-2">
              Logout
            </span>
          </span>
        </button>
      </aside>

      {isOpen ? (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={onClose}
          className="fixed inset-0 z-20 bg-brand-black/40 backdrop-blur-sm transition lg:hidden"
        />
      ) : null}
    </>
  );
};
