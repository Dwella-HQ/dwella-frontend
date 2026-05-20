import { REFRESH_TOKEN_STORAGE_KEY } from "@/lib/authRefresh";

/**
 * Logout utility function
 * Clears authentication data from localStorage
 * Note: This only clears localStorage. To also clear UserContext,
 * call the logout function from useUser() hook in components.
 */
export const logout = () => {
  // Clear all auth-related data from localStorage
  localStorage.removeItem("authToken");
  localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
  localStorage.removeItem("user");
  localStorage.removeItem("selectedLandlord");
  localStorage.removeItem("selectedLandlordId");

  // Clear selected landlord cookies (legacy/supporting flows)
  document.cookie =
    "selectedLandlord=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
  document.cookie =
    "selectedLandlordId=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
  document.cookie =
    "accessToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
};
