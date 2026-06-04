import {
  LayoutDashboard,
  Home,
  CreditCard,
  Wrench,
  Users,
  FileText,
  BarChart3,
  MessageSquare,
  Settings,
  Megaphone,
  ArrowDownToLine,
} from "lucide-react";
import type { UserRole } from "@/contexts/UserContext";
import type { LucideIcon } from "lucide-react";

export type NavigationItem = {
  name: string;
  href: string;
  icon: LucideIcon;
};

export type MoreMenuItem = {
  name: string;
  href: string;
  icon: LucideIcon;
};

// Get navigation items for desktop navbar based on user role
export const getNavigationItems = (role: UserRole): NavigationItem[] => {
  const baseItems: NavigationItem[] = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  ];

  switch (role) {
    case "landlord":
      return [
        ...baseItems,
        { name: "Properties", href: "/dashboard/properties", icon: Home },
        { name: "Rent", href: "/dashboard/rent", icon: CreditCard },
        { name: "Maintenance", href: "/dashboard/maintenance", icon: Wrench },
        { name: "Messages", href: "/dashboard/messages", icon: MessageSquare },
      ];
    case "super_admin":
      return [
        { name: "Dashboard", href: "/dashboard/admin", icon: LayoutDashboard },
        { name: "Properties", href: "/dashboard/admin/properties", icon: Home },
      ];
    case "property_manager":
      // Property manager navigation will be updated based on Figma designs
      return [
        ...baseItems,
        { name: "Properties", href: "/dashboard/properties", icon: Home },
        { name: "Maintenance", href: "/dashboard/maintenance", icon: Wrench },
        { name: "Messages", href: "/dashboard/messages", icon: MessageSquare },
      ];
    case "tenant":
      // Tenant navigation will be updated later
      return [
        ...baseItems,
        { name: "Rent", href: "/dashboard/rent", icon: CreditCard },
        { name: "Maintenance", href: "/dashboard/maintenance", icon: Wrench },
        { name: "Messages", href: "/dashboard/messages", icon: MessageSquare },
      ];
    default:
      return baseItems;
  }
};

// Get mobile navigation items (first 4 items, excluding Messages which goes in More menu)
export const getMobileNavigationItems = (role: UserRole): NavigationItem[] => {
  const allItems = getNavigationItems(role);
  // For mobile, take first 4 items (Dashboard + 3 others), Messages goes in More menu
  return allItems.slice(0, 4);
};

// Get "More" menu items based on user role
export const getMoreMenuItems = (role: UserRole): MoreMenuItem[] => {
  const baseMoreItems: MoreMenuItem[] = [];

  switch (role) {
    case "landlord":
      return [
        { name: "Managers", href: "/dashboard/managers", icon: Users },
        { name: "Units", href: "/dashboard/units", icon: FileText },
        { name: "Reports", href: "/dashboard/reports", icon: BarChart3 },
        {
          name: "Announcements",
          href: "/dashboard/announcements",
          icon: Megaphone,
        },
        { name: "Finance", href: "/dashboard/finance", icon: ArrowDownToLine },
        { name: "Settings", href: "/dashboard/settings", icon: Settings },
      ];
    case "super_admin":
      return [
        { name: "Reports", href: "/dashboard/admin", icon: BarChart3 },
        { name: "Settings", href: "/dashboard/admin", icon: Settings },
      ];
    case "property_manager":
      // Property manager "More" menu will be updated based on Figma designs
      return [
        { name: "Reports", href: "/dashboard/reports", icon: BarChart3 },
        {
          name: "Announcements",
          href: "/dashboard/announcements",
          icon: Megaphone,
        },
        { name: "Settings", href: "/dashboard/settings", icon: Settings },
      ];
    case "tenant":
      // Tenant "More" menu will be updated later
      return [
        {
          name: "Announcements",
          href: "/dashboard/announcements",
          icon: Megaphone,
        },
        { name: "Settings", href: "/dashboard/settings", icon: Settings },
      ];
    default:
      return baseMoreItems;
  }
};
