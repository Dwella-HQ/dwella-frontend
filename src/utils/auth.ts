/**
 * Logout utility function
 * Clears authentication data from localStorage
 * Note: This only clears localStorage. To also clear UserContext,
 * call the logout function from useUser() hook in components.
 */
export const logout = () => {
  // Clear all auth-related data from localStorage
  localStorage.removeItem("authToken");
  localStorage.removeItem("user");
};

