import { useUser } from "@/contexts/UserContext";
import type { UserRole } from "@/contexts/UserContext";

/**
 * Hook for role-based access control
 * Provides utilities to check user roles and permissions
 */
export const useRoleAccess = () => {
  const { user } = useUser();

  const hasRole = (role: UserRole | UserRole[]): boolean => {
    if (!user) return false;
    if (Array.isArray(role)) {
      return role.includes(user.role);
    }
    return user.role === role;
  };

  const isLandlord = (): boolean => hasRole("landlord");
  const isManager = (): boolean => hasRole("manager");
  const isTenant = (): boolean => hasRole("tenant");

  const canAccess = (allowedRoles: UserRole | UserRole[]): boolean => {
    return hasRole(allowedRoles);
  };

  return {
    user,
    hasRole,
    isLandlord,
    isManager,
    isTenant,
    canAccess,
  };
};

