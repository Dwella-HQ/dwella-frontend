import * as React from "react";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";

import { DashboardHeader } from "@/components/DashboardHeader";
import { DashboardMobileNav } from "@/components/DashboardMobileNav";
import { ProfileProvider } from "@/contexts/ProfileContext";
import { useInactivityLogout } from "@/hooks/useInactivityLogout";

export type DashboardLayoutProps = {
  children: React.ReactNode;
};

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = React.useState(true);

  // Auto-logout after 1 hour of inactivity
  useInactivityLogout(60);

  // Check authentication on mount
  React.useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") {
      setIsCheckingAuth(false);
      return;
    }

    const token = localStorage.getItem("authToken");

    if (!token) {
      // Redirect to login if no token
      router.replace("/auth/login");
      return;
    }

    setIsCheckingAuth(false);
  }, [router]);

  // Show nothing while checking authentication
  if (isCheckingAuth) {
    return null;
  }

  return (
    <ProfileProvider>
      <div className="min-h-screen bg-brand-light-bg text-brand-black">
        <div className="flex min-h-screen flex-col">
          <DashboardHeader />

          <main className="flex-1 px-2 sm:px-4 py-8 lg:px-8 pb-20 xl:pb-8">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={router.asPath}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="mx-auto flex w-[97%] sm:w-[90%] lg:w-[85%] flex-col gap-6 lg:gap-8"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </main>

          {/* Mobile Bottom Navigation */}
          <DashboardMobileNav />
        </div>
      </div>
    </ProfileProvider>
  );
};
