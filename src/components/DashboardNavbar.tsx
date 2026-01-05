import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  LayoutDashboard,
  Home,
  DollarSign,
  Wrench,
  MessageSquare,
  Menu,
  ChevronDown,
  Users,
  FileText,
  BarChart3,
  Settings,
} from "lucide-react";

const navigationItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Properties", href: "/dashboard/properties", icon: Home },
  { name: "Rent", href: "/dashboard/rent", icon: DollarSign },
  { name: "Maintenance", href: "/dashboard/maintenance", icon: Wrench },
  { name: "Messages", href: "/dashboard/messages", icon: MessageSquare },
];

const moreMenuItems = [
  { name: "Managers", href: "/dashboard/managers", icon: Users },
  { name: "Units", href: "/dashboard/units", icon: FileText },
  { name: "Reports", href: "/dashboard/reports", icon: BarChart3 },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export type DashboardNavbarProps = {
  className?: string;
};

export const DashboardNavbar = ({ className = "" }: DashboardNavbarProps) => {
  const router = useRouter();
  const currentPath = router.pathname;
  const [isMoreOpen, setIsMoreOpen] = React.useState(false);

  // Check if any "More" menu item is active
  const isMoreActive = moreMenuItems.some((item) => currentPath.startsWith(item.href));

  return (
    <nav className={`hidden sm:flex items-center gap-1 rounded-lg bg-white p-1 overflow-x-auto ${className}`}>
      {navigationItems.map((item) => {
        // Check if active - handle sub-routes for Properties
        let isActive = false;
        if (item.href === "/dashboard/properties") {
          isActive = currentPath.startsWith("/dashboard/properties");
        } else {
          isActive = currentPath === item.href;
        }
        const Icon = item.icon;

        return (
          <motion.div
            key={item.name}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link
              href={item.href}
              className={`relative flex items-center gap-1.5 sm:gap-2 rounded-md px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium transition whitespace-nowrap flex-shrink-0 ${
                isActive
                  ? "text-white bg-brand-main"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute inset-0 bg-brand-main rounded-md"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <Icon className={`relative z-10 h-4 w-4 flex-shrink-0 ${isActive ? "text-white" : "text-gray-500"}`} />
              <span className="relative z-10 hidden sm:inline">{item.name}</span>
            </Link>
          </motion.div>
        );
      })}

      {/* More Dropdown */}
      <DropdownMenu.Root open={isMoreOpen} onOpenChange={setIsMoreOpen}>
        <DropdownMenu.Trigger asChild>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`relative flex items-center gap-1.5 sm:gap-2 rounded-md px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium transition whitespace-nowrap flex-shrink-0 ${
              isMoreActive || isMoreOpen
                ? "bg-brand-main text-white"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            <Menu className={`h-4 w-4 flex-shrink-0 ${isMoreActive || isMoreOpen ? "text-white" : "text-gray-500"}`} />
            <span className="hidden sm:inline">More</span>
            <ChevronDown className={`h-3 w-3 flex-shrink-0 transition-transform ${isMoreOpen ? "rotate-180" : ""} ${isMoreActive || isMoreOpen ? "text-white" : "text-gray-500"}`} />
          </motion.button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            sideOffset={8}
            align="start"
            asChild
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.2 }}
              className="min-w-[160px] rounded-lg border border-gray-200 bg-white p-1 shadow-lg focus:outline-none z-50"
            >
              <AnimatePresence>
                {moreMenuItems.map((item, index) => {
                  const isItemActive = currentPath.startsWith(item.href);
                  const Icon = item.icon;

                  return (
                    <DropdownMenu.Item
                      key={item.name}
                      asChild
                    >
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Link
                          href={item.href}
                          onClick={() => setIsMoreOpen(false)}
                          className={`flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm outline-none transition ${
                            isItemActive
                              ? "bg-brand-main text-white"
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          <Icon className={`h-4 w-4 ${isItemActive ? "text-white" : "text-gray-500"}`} />
                          <span>{item.name}</span>
                        </Link>
                      </motion.div>
                    </DropdownMenu.Item>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </nav>
  );
};

