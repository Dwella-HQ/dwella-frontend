import * as React from "react";
import { useRouter } from "next/router";
import { useUser } from "@/contexts/UserContext";
import { GuestHeader } from "@/components/guest/GuestHeader";

export type GuestLayoutProps = {
  children: React.ReactNode;
  showSearch?: boolean;
};

export const GuestLayout = ({
  children,
  showSearch = false,
}: GuestLayoutProps) => {
  const router = useRouter();
  const { user, isLoading } = useUser();

  React.useEffect(() => {
    if (isLoading) return;
    if (!user) {
      void router.replace("/auth/login");
      return;
    }
    if (user.role !== "guest") {
      void router.replace("/dashboard");
    }
  }, [isLoading, router, user]);

  if (isLoading || !user || user.role !== "guest") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F9FAFB]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--brand-main)] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F9FAFB]">
      <GuestHeader showSearch={showSearch} />
      <main className="flex-1">{children}</main>
    </div>
  );
};
