import {
  BellIcon,
  Loader2,
  LogOut,
  DollarSign,
  Wrench,
  MessageCircle,
  AlertCircle,
  X,
} from "lucide-react";
import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useProfile } from "@/contexts/ProfileContext";
import {
  getNotifications,
  markNotificationsRead,
  mapNotification,
} from "@/api/notifications";
import type { Notification } from "@/api/notifications";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import { logout } from "@/utils/auth";
import logo from "@/assets/logo.png";

export type DashboardHeaderProps = {};

export const DashboardHeader = ({}: DashboardHeaderProps) => {
  const router = useRouter();
  const { profile, refetchProfile } = useProfile();
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] =
    React.useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const initials = profile ? getInitials(profile.name) : "FL";
  const displayName = profile?.name || "Favoudoh LandLord";
  const displayEmail = profile?.email || "landlord@dwella.ng";
  const hasNotifications = profile && profile.notification_count > 0;

  // Fetch recent notifications when dropdown opens
  const fetchNotifications = React.useCallback(async () => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
    if (!token) return;

    setIsLoadingNotifications(true);
    const result = await getNotifications(token, 1);
    if (result.success) {
      const mapped = result.data.data.notifications
        .map(mapNotification)
        .slice(0, 5); // Show latest 5
      setNotifications(mapped);
    }
    setIsLoadingNotifications(false);
  }, []);

  // Fetch notifications when dropdown opens
  React.useEffect(() => {
    if (isDropdownOpen) {
      fetchNotifications();
    }
  }, [isDropdownOpen, fetchNotifications]);

  const handleNotificationClick = React.useCallback(
    async (notification: Notification) => {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("authToken")
          : null;

      // Mark as read if unread
      if (!notification.isRead && token) {
        await markNotificationsRead(token, [notification.apiId]);
        refetchProfile(); // Update notification count in header
      }

      // Navigate to notifications page with the notification ID
      router.push(`/dashboard/notifications?id=${notification.apiId}`);
      setIsDropdownOpen(false);
    },
    [router, refetchProfile]
  );

  const handleMarkAllAsRead = React.useCallback(async () => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
    if (!token) return;

    const unreadIds = notifications
      .filter((n) => !n.isRead)
      .map((n) => n.apiId);

    if (unreadIds.length > 0) {
      await markNotificationsRead(token, unreadIds);
      refetchProfile();
      fetchNotifications(); // Refresh the list
    }
  }, [notifications, refetchProfile, fetchNotifications]);

  const getNotificationIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "payment":
      case "payment_received":
        return {
          Icon: DollarSign,
          bgColor: "bg-green-100",
          iconColor: "text-green-600",
        };
      case "maintenance":
      case "maintenance_request":
        return {
          Icon: Wrench,
          bgColor: "bg-orange-100",
          iconColor: "text-orange-600",
        };
      case "message":
      case "new_message":
        return {
          Icon: MessageCircle,
          bgColor: "bg-blue-100",
          iconColor: "text-blue-600",
        };
      case "alert":
      case "overdue":
      case "overdue_rent":
        return {
          Icon: AlertCircle,
          bgColor: "bg-red-100",
          iconColor: "text-red-600",
        };
      default:
        return {
          Icon: BellIcon,
          bgColor: "bg-gray-100",
          iconColor: "text-gray-600",
        };
    }
  };

  const handleLogout = React.useCallback(() => {
    logout();
    router.push("/auth/login");
  }, [router]);

  return (
    <header className="sticky top-0 z-50 bg-brand-main">
      <div className="mx-auto w-[97%] sm:w-[85%] px-2 py-3 sm:px-4 sm:py-4 lg:px-8">
        <div className="flex flex-row items-center justify-between gap-2 sm:gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Image
              src={logo}
              alt="DWELLA NG logo"
              width={32}
              height={32}
              className="object-contain brightness-0 invert"
            />
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-white">DWELLA</span>
              <span className="text-lg font-bold text-white">NG</span>
            </div>
          </div>

          {/* Navigation Bar - Hidden on mobile, shown on desktop */}
          <div className="hidden sm:flex sm:flex-1 sm:justify-center">
            <DashboardNavbar />
          </div>

          {/* Right Side: Notifications and User Profile */}
          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            {/* Notifications */}
            <DropdownMenu.Root
              open={isDropdownOpen}
              onOpenChange={setIsDropdownOpen}
            >
              <DropdownMenu.Trigger asChild>
                <button
                  type="button"
                  className="relative rounded-full p-2 text-white hover:bg-white/10 transition"
                  aria-label="Notifications"
                >
                  <BellIcon className="h-5 w-5" />
                  {hasNotifications && (
                    <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
                  )}
                </button>
              </DropdownMenu.Trigger>

              <DropdownMenu.Portal>
                <DropdownMenu.Content sideOffset={8} align="end" asChild>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="w-96 rounded-lg border border-gray-200 bg-white shadow-lg focus:outline-none z-50"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                      <h3 className="text-base font-semibold text-gray-900">
                        Notifications
                      </h3>
                      <button
                        type="button"
                        onClick={() => setIsDropdownOpen(false)}
                        className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Notifications List */}
                    <div className="max-h-[400px] overflow-y-auto">
                      {isLoadingNotifications ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-5 w-5 animate-spin text-brand-main" />
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="px-4 py-8 text-center text-sm text-gray-500">
                          No notifications
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-100">
                          {notifications.map((notification) => {
                            const { Icon, bgColor, iconColor } =
                              getNotificationIcon(notification.type);
                            return (
                              <DropdownMenu.Item
                                key={notification.id}
                                onSelect={() =>
                                  handleNotificationClick(notification)
                                }
                                className="flex cursor-pointer items-start gap-3 px-4 py-3 text-sm outline-none hover:bg-gray-50 focus:bg-gray-50 transition relative"
                              >
                                {/* Icon */}
                                <div
                                  className={`flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-full ${bgColor}`}
                                >
                                  <Icon className={`h-5 w-5 ${iconColor}`} />
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-gray-900 mb-0.5">
                                    {notification.title}
                                  </p>
                                  <p className="text-sm text-gray-600 break-words">
                                    {notification.description}
                                  </p>
                                  <p className="text-xs text-gray-400 mt-1">
                                    {notification.time}
                                  </p>
                                </div>

                                {/* Unread indicator */}
                                {!notification.isRead && (
                                  <div className="flex-shrink-0">
                                    <span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
                                  </div>
                                )}
                              </DropdownMenu.Item>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Mark All as Read Button */}
                    {notifications.length > 0 && (
                      <div className="px-4 py-3 border-t border-gray-200">
                        <button
                          type="button"
                          onClick={handleMarkAllAsRead}
                          className="w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
                        >
                          Mark All as Read
                        </button>
                      </div>
                    )}
                  </motion.div>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>

            {/* Vertical Divider - Hidden on mobile */}
            <div className="hidden sm:block h-6 w-px bg-white/30"></div>

            {/* User Profile */}
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-2 sm:gap-3 rounded-lg px-1.5 sm:px-2 py-1.5 hover:bg-white/10 transition"
                >
                  <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-white/20 border-2 border-white/30 text-white text-xs sm:text-sm font-semibold">
                    {initials}
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-white">
                      {displayName.split(" ")[0]}
                    </p>
                    <p className="text-xs text-white/80">LandLord</p>
                  </div>
                  <LogOut className="hidden lg:block h-4 w-4 text-white" />
                </motion.button>
              </DropdownMenu.Trigger>

              <DropdownMenu.Portal>
                <DropdownMenu.Content sideOffset={8} align="end" asChild>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="w-56 rounded-lg border border-gray-200 bg-white p-1 shadow-lg focus:outline-none z-50"
                  >
                    <DropdownMenu.Item
                      onSelect={handleLogout}
                      className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-red-600 outline-none hover:bg-red-50 focus:bg-red-50 transition"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Logout</span>
                    </DropdownMenu.Item>
                  </motion.div>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>
        </div>
      </div>
    </header>
  );
};
