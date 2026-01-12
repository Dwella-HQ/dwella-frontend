import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import * as Popover from "@radix-ui/react-popover";
import {
  LayoutDashboard,
  Home,
  CreditCard,
  Wrench,
  Menu,
  Users,
  FileText,
  BarChart3,
  MessageSquare,
  Settings,
  ChevronUp,
} from "lucide-react";

const navigationItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Properties", href: "/dashboard/properties", icon: Home },
  { name: "Rent", href: "/dashboard/rent", icon: CreditCard },
  { name: "Maintenance", href: "/dashboard/maintenance", icon: Wrench },
];

const moreMenuItems = [
  { name: "Managers", href: "/dashboard/managers", icon: Users },
  { name: "Units", href: "/dashboard/units", icon: FileText },
  { name: "Reports", href: "/dashboard/reports", icon: BarChart3 },
  { name: "Messages", href: "/dashboard/messages", icon: MessageSquare },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export const DashboardMobileNav = () => {
  const router = useRouter();
  const currentPath = router.pathname;
  const [isMoreOpen, setIsMoreOpen] = React.useState(false);

  // Check if any "More" menu item is active
  const isMoreActive = moreMenuItems.some((item) => currentPath.startsWith(item.href));

  const isActive = (href: string) => {
    if (href === "/dashboard/properties") {
      return currentPath.startsWith("/dashboard/properties");
    }
    return currentPath === href;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 xl:hidden">
      <div className="flex items-center justify-around px-2 py-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 flex-1 py-2 px-2 rounded-lg transition ${
                active ? "text-brand-main" : "text-gray-500"
              }`}
            >
              <Icon className={`h-5 w-5 ${active ? "text-brand-main" : "text-gray-500"}`} />
              <span className={`text-xs font-medium ${active ? "text-brand-main" : "text-gray-500"}`}>
                {item.name}
              </span>
            </Link>
          );
        })}

        {/* More Button with Popover */}
        <Popover.Root open={isMoreOpen} onOpenChange={setIsMoreOpen}>
          <Popover.Trigger asChild>
            <button
              type="button"
              className={`relative flex flex-col items-center justify-center gap-1 flex-1 py-2 px-2 rounded-lg transition ${
                isMoreActive || isMoreOpen ? "text-brand-main" : "text-gray-500"
              }`}
            >
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex items-center justify-center h-5 w-5 rounded-full bg-white border border-gray-200">
                <ChevronUp className={`h-2.5 w-2.5 ${isMoreActive || isMoreOpen ? "text-brand-main" : "text-gray-400"}`} />
              </div>
              <Menu className={`h-5 w-5 ${isMoreActive || isMoreOpen ? "text-brand-main" : "text-gray-500"}`} />
              <span className={`text-xs font-medium ${isMoreActive || isMoreOpen ? "text-brand-main" : "text-gray-500"}`}>
                More
              </span>
            </button>
          </Popover.Trigger>

          {/* Backdrop with blur */}
          <AnimatePresence>
            {isMoreOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed top-0 left-0 right-0 bottom-[73px] bg-black/20 backdrop-blur-sm z-[49] xl:hidden"
                onClick={() => setIsMoreOpen(false)}
              />
            )}
          </AnimatePresence>

          <Popover.Portal>
            <Popover.Content
              side="top"
              align="center"
              sideOffset={8}
              asChild
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-lg border border-gray-200 shadow-lg p-2 mb-2 min-w-[200px] z-[51] relative"
              >
                <AnimatePresence>
                  {moreMenuItems.map((item, index) => {
                    const isItemActive = currentPath.startsWith(item.href);
                    const Icon = item.icon;

                    return (
                      <motion.div
                        key={item.name}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Link
                          href={item.href}
                          onClick={() => setIsMoreOpen(false)}
                          className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition ${
                            isItemActive
                              ? "bg-brand-main text-white"
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          <Icon className={`h-5 w-5 ${isItemActive ? "text-white" : "text-gray-500"}`} />
                          <span>{item.name}</span>
                        </Link>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </motion.div>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      </div>
    </nav>
  );
};

