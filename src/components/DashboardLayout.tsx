import * as React from "react";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";

import { DashboardHeader } from "@/components/DashboardHeader";
import { DashboardMobileNav } from "@/components/DashboardMobileNav";
import { ProfileProvider } from "@/contexts/ProfileContext";
import { useUser } from "@/contexts/UserContext";
import {
  getLandlordByUser,
  getLandlordVerificationStatus,
  isApprovedLandlordVerificationComplete,
  type LandlordVerificationStatus,
} from "@/api/landlord";
import { useInactivityLogout } from "@/hooks/useInactivityLogout";
import { savePostLoginRedirect } from "@/utils/postLoginRedirect";

export type DashboardLayoutProps = {
  children: React.ReactNode;
};

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const router = useRouter();
  const { user, isLoading: isUserLoading } = useUser();
  const [isCheckingAuth, setIsCheckingAuth] = React.useState(true);
  const [isLandlordVerified, setIsLandlordVerified] = React.useState<
    boolean | null
  >(null);
  const [landlordVerificationStatus, setLandlordVerificationStatus] =
    React.useState<LandlordVerificationStatus | null>(null);

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
      savePostLoginRedirect();
      router.replace("/auth/login");
      return;
    }

    if (isUserLoading) {
      return;
    }

    if (!user) {
      savePostLoginRedirect();
      router.replace("/auth/login");
      return;
    }

    setIsCheckingAuth(false);
  }, [isUserLoading, router, user]);

  React.useEffect(() => {
    if (!user?.id || user.role !== "landlord") {
      setIsLandlordVerified(null);
      setLandlordVerificationStatus(null);
      return;
    }
    let cancelled = false;
    getLandlordByUser(String(user.id)).then((result) => {
      if (cancelled) return;
      if (result.success) {
        if (typeof window !== "undefined" && result.data.id) {
          localStorage.setItem("landlordId", result.data.id);
        }
        setIsLandlordVerified(
          isApprovedLandlordVerificationComplete(result.data),
        );
        setLandlordVerificationStatus(
          getLandlordVerificationStatus(result.data),
        );
      } else if (result.statusCode === 404) {
        void router.replace("/onboarding/landlord/details");
      } else {
        setIsLandlordVerified(true);
        setLandlordVerificationStatus(null);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [router, user?.id, user?.role]);

  const shouldRestrictLandlordNav =
    user?.role === "landlord" && isLandlordVerified === false;
  const isAllowedUnverifiedLandlordPath =
    router.pathname === "/dashboard" ||
    router.pathname === "/dashboard/settings";
  const showUnverifiedFailSafeBanner =
    shouldRestrictLandlordNav && !isAllowedUnverifiedLandlordPath;

  // Show nothing while checking authentication
  if (
    isCheckingAuth ||
    isUserLoading ||
    (user?.role === "landlord" && isLandlordVerified === null)
  ) {
    return null;
  }

  return (
    <ProfileProvider>
      <div className="min-h-screen [color-scheme:light] bg-brand-light-bg text-brand-black">
        <div className="flex min-h-screen flex-col">
          <DashboardHeader
            restrictForUnverifiedLandlord={shouldRestrictLandlordNav}
          />

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
                {showUnverifiedFailSafeBanner ? (
                  <div
                    className={`rounded-lg border px-4 py-3 text-sm ${
                      landlordVerificationStatus === "REJECTED"
                        ? "border-red-200 bg-red-50 text-red-800"
                        : "border-amber-200 bg-amber-50 text-amber-900"
                    }`}
                  >
                    {landlordVerificationStatus === "REJECTED"
                      ? "Your landlord verification was rejected. You can only access Dashboard and Settings until you reupload your documents from Settings for admin review."
                      : "Your landlord account is not approved yet. You can only access Dashboard and Settings until verification is approved."}
                  </div>
                ) : null}
                {children}
              </motion.div>
            </AnimatePresence>
          </main>

          {/* Mobile Bottom Navigation */}
          <DashboardMobileNav
            restrictForUnverifiedLandlord={shouldRestrictLandlordNav}
          />
        </div>
      </div>
    </ProfileProvider>
  );
};
