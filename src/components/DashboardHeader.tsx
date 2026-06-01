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
import { motion } from "framer-motion";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useProfile } from "@/contexts/ProfileContext";
import { useUser } from "@/contexts/UserContext";
import { useSelectedLandlord } from "@/contexts/SelectedLandlordContext";
import { useNotifications } from "@/contexts/NotificationsContext";
import type { Notification } from "@/api/notifications";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import { LandlordSwitchModal } from "@/components/LandlordSwitchModal";
import { getLandlordByUser } from "@/api/landlord";
import type { LandlordDTO } from "@/api/landlord";
import { logout } from "@/utils/auth";
import { ChevronDown } from "lucide-react";
import logo from "@/assets/logo_white_horizontal.png";

export type DashboardHeaderProps = {
  restrictForUnverifiedLandlord?: boolean;
};

export const DashboardHeader = ({
  restrictForUnverifiedLandlord = false,
}: DashboardHeaderProps) => {
  const router = useRouter();
  const { profile, refetchProfile } = useProfile();
  const { user, logout: logoutUser } = useUser();
  const { selectedLandlord } = useSelectedLandlord();
  const {
    notifications,
    unreadCount,
    isLoading: isLoadingNotifications,
    refresh: refreshNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotifications();
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const [isLandlordSwitchOpen, setIsLandlordSwitchOpen] = React.useState(false);
  const [landlord, setLandlord] = React.useState<LandlordDTO | null>(null);

  // Fetch landlord when user is landlord (for profile picture in header)
  React.useEffect(() => {
    if (!user?.id || user.role !== "landlord") {
      setLandlord(null);
      return;
    }
    getLandlordByUser(String(user.id)).then((result) => {
      if (result.success) setLandlord(result.data);
      else setLandlord(null);
    });
  }, [user?.id, user?.role]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case "property_manager":
        return "Property Manager";
      case "manager":
        return "Manager";
      case "tenant":
        return "Tenant";
      case "super_admin":
        return "Admin";
      case "landlord":
        return "Landlord";
      default:
        return "User";
    }
  };

  const profileName = profile?.fullName || profile?.name || "";
  const initials = profile ? getInitials(profileName) : user ? getInitials(user.name) : "FL";
  const displayName = profileName || user?.name || "User";
  const roleDisplay = user?.role ? getRoleDisplayName(user.role) : "User";
  const hasNotifications =
    unreadCount > 0 || Boolean(profile && (profile.notification_count || 0) > 0);
  // Prefer landlord profile picture (landlord role), then profile picture from /user/me
  const avatarUrl = landlord?.profilePicture?.url ?? (profile as { profilePicture?: { url: string } } | null)?.profilePicture?.url;

  React.useEffect(() => {
    if (isDropdownOpen) {
      refreshNotifications();
    }
  }, [isDropdownOpen, refreshNotifications]);

  const handleNotificationClick = React.useCallback(
    async (notification: Notification) => {
      if (!notification.isRead) {
        markAsRead([notification.apiId]);
        void refetchProfile();
      }

      void router.push(`/dashboard/notifications?id=${notification.apiId}`);
      setIsDropdownOpen(false);
    },
    [markAsRead, refetchProfile, router]
  );

  const handleMarkAllAsRead = React.useCallback(() => {
    markAllAsRead();
    void refetchProfile();
  }, [markAllAsRead, refetchProfile]);

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
    logoutUser(); // Clear user from context
    router.push("/auth/login");
  }, [router, logoutUser]);

  return (
    <>
      <header className="sticky top-0 z-50 bg-brand-main">
        <div className="mx-auto w-[97%] sm:w-[85%] px-2 py-3 sm:px-4 sm:py-4 lg:px-8">
          <div className="flex flex-row items-center justify-between gap-2 sm:gap-6">
            {/* Logo */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Image
                src={logo}
                alt="Dwelliva logo"
                width={170}
                height={40}
                className="h-8 w-auto object-contain"
              />
            </div>

            {/* Navigation Bar - Hidden on mobile/tablet, shown on desktop (xl and above) */}
            <div className="hidden xl:flex xl:flex-1 xl:justify-center">
              <DashboardNavbar
                restrictForUnverifiedLandlord={restrictForUnverifiedLandlord}
              />
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
                          {notifications.slice(0, 5).map((notification) => {
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
                  <div className="flex h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white/30 bg-white/20">
                    {avatarUrl ? (
                      <Image
                        src={avatarUrl}
                        alt=""
                        width={40}
                        height={40}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-white text-xs sm:text-sm font-semibold">{initials}</span>
                    )}
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-white">
                      {displayName.split(" ")[0]}
                    </p>
                    <p className="text-xs text-white/80">{roleDisplay}</p>
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

    {/* Managing Bar for Managers - Below Header */}
    {user?.role === "property_manager" && selectedLandlord && (
      <div className="sticky top-[73px] z-40 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center justify-center py-2.5">
          <button
            onClick={() => setIsLandlordSwitchOpen(true)}
            className={`flex items-center gap-2 text-sm transition ${
              isLandlordSwitchOpen
                ? "bg-blue-900 px-4 py-2 rounded-lg"
                : "bg-gray-800/50 px-4 py-2 rounded-lg hover:bg-gray-800"
            }`}
          >
            <span className="text-white">
              Managing:{" "}
              <span className="font-semibold">{selectedLandlord.name}</span> (
              {selectedLandlord.properties.length}{" "}
              {selectedLandlord.properties.length === 1 ? "Property" : "Properties"})
            </span>
            {isLandlordSwitchOpen ? (
              <span className="bg-white text-gray-900 px-2 py-1 rounded text-xs font-medium">
                [{selectedLandlord.totalUnits} Total Units]
              </span>
            ) : (
              <span className="text-white">
                [{selectedLandlord.totalUnits} Total Units]
              </span>
            )}
            <ChevronDown
              className={`h-4 w-4 text-white transition-transform ${
                isLandlordSwitchOpen ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>
      </div>
    )}

    {/* Landlord Switch Modal */}
    {user?.role === "property_manager" && (
      <LandlordSwitchModal
        isOpen={isLandlordSwitchOpen}
        onClose={() => setIsLandlordSwitchOpen(false)}
      />
    )}
    </>
  );
};
