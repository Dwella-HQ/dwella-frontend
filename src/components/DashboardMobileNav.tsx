import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import * as Popover from "@radix-ui/react-popover";
import { Menu, ChevronUp } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { useChat } from "@/contexts/ChatContext";
import { getNavigationItems, getMoreMenuItems } from "@/utils/navigation";

export type DashboardMobileNavProps = {
  restrictForUnverifiedLandlord?: boolean;
};

export const DashboardMobileNav = ({
  restrictForUnverifiedLandlord = false,
}: DashboardMobileNavProps) => {
  const router = useRouter();
  const { user } = useUser();
  const { unreadCount } = useChat();
  const currentPath = router.pathname;
  const [isMoreOpen, setIsMoreOpen] = React.useState(false);

  // Get role-based navigation items for mobile (first 4 items)
  const navigationItems = React.useMemo(
    () => {
      const allItems = getNavigationItems(user?.role || "landlord");
      // Mobile nav shows first 4 items, Messages goes in More menu
      return allItems.slice(0, 4);
    },
    [user?.role]
  );

  const moreMenuItems = React.useMemo(
    () => getMoreMenuItems(user?.role || "landlord"),
    [user?.role]
  );
  const isItemRestricted = React.useCallback(
    (href: string) => {
      if (!restrictForUnverifiedLandlord || user?.role !== "landlord") return false;
      return href !== "/dashboard" && href !== "/dashboard/settings";
    },
    [restrictForUnverifiedLandlord, user?.role],
  );

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
          const restricted = isItemRestricted(item.href);
          const itemUnreadCount =
            item.href === "/dashboard/messages" ? unreadCount : 0;

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={(e) => {
                if (restricted) e.preventDefault();
              }}
              className={`flex flex-col items-center justify-center gap-1 flex-1 py-2 px-2 rounded-lg transition ${
                active ? "text-brand-main" : "text-gray-500"
              } ${restricted ? "opacity-45 cursor-not-allowed pointer-events-none" : ""}`}
            >
              <span className="relative">
                <Icon className={`h-5 w-5 ${active ? "text-brand-main" : "text-gray-500"}`} />
                {itemUnreadCount > 0 ? (
                  <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                    {itemUnreadCount > 9 ? "9+" : itemUnreadCount}
                  </span>
                ) : null}
              </span>
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
                    const restricted = isItemRestricted(item.href);
                    const itemUnreadCount =
                      item.href === "/dashboard/messages" ? unreadCount : 0;

                    return (
                      <motion.div
                        key={item.name}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Link
                          href={item.href}
                          onClick={(e) => {
                            if (restricted) {
                              e.preventDefault();
                              return;
                            }
                            setIsMoreOpen(false);
                          }}
                          className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition ${
                            isItemActive
                              ? "bg-brand-main text-white"
                              : "text-gray-700 hover:bg-gray-100"
                          } ${restricted ? "opacity-45 cursor-not-allowed pointer-events-none" : ""}`}
                        >
                          <Icon className={`h-5 w-5 ${isItemActive ? "text-white" : "text-gray-500"}`} />
                          <span>{item.name}</span>
                          {itemUnreadCount > 0 ? (
                            <span
                              className={`ml-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${
                                isItemActive
                                  ? "bg-white text-brand-main"
                                  : "bg-red-500 text-white"
                              }`}
                            >
                              {itemUnreadCount > 9 ? "9+" : itemUnreadCount}
                            </span>
                          ) : null}
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
