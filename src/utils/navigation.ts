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
    case "manager":
      // Manager navigation will be updated based on Figma designs
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
        { name: "Messages", href: "/dashboard/messages", icon: MessageSquare },
        { name: "Settings", href: "/dashboard/settings", icon: Settings },
      ];
    case "manager":
      // Manager "More" menu will be updated based on Figma designs
      return [
        { name: "Reports", href: "/dashboard/reports", icon: BarChart3 },
        { name: "Messages", href: "/dashboard/messages", icon: MessageSquare },
        { name: "Settings", href: "/dashboard/settings", icon: Settings },
      ];
    case "tenant":
      // Tenant "More" menu will be updated later
      return [
        { name: "Messages", href: "/dashboard/messages", icon: MessageSquare },
        { name: "Settings", href: "/dashboard/settings", icon: Settings },
      ];
    default:
      return baseMoreItems;
  }
};

