/**
 * Logout utility function
 * Clears authentication data from localStorage and redirects to login
 */
export const logout = (redirectPath = "/auth/login") => {
  // Clear all auth-related data from localStorage
  localStorage.removeItem("authToken");
  localStorage.removeItem("user");
  
  // Redirect to login page
  if (typeof window !== "undefined") {
    window.location.href = redirectPath;
  }
};

