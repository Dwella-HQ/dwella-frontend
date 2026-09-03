import * as React from "react";
import Link from "next/link";
import { ArrowLeft, LogOut, Pencil } from "lucide-react";
import { SecurityLayout, useSecuritySession } from "@/components/security/SecurityLayout";
import { useToast } from "@/components/Toast";
import { getMainAppPath, getSecurityInitials } from "@/lib/securitySession";
import type { NextPageWithLayout } from "../_app";

const SecurityProfilePage: NextPageWithLayout = () => {
  const { session, logout } = useSecuritySession();
  const { showToast } = useToast();
  const initials = getSecurityInitials(session.displayName);
  const [mainAppPath, setMainAppPath] = React.useState("/auth/login");

  React.useEffect(() => {
    setMainAppPath(getMainAppPath());
  }, []);

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-lg flex-col items-center lg:min-h-0">
      <div className="flex w-full flex-1 flex-col items-center rounded-2xl bg-white pt-6 lg:border lg:border-gray-200 lg:px-10 lg:py-12 lg:shadow-sm">
        <div className="relative">
          <div className="flex h-28 w-28 items-center justify-center rounded-full bg-brand-main text-3xl font-semibold text-white sm:h-32 sm:w-32 sm:text-4xl">
            {initials}
          </div>
          <button
            type="button"
            onClick={() =>
              showToast(
              "Profile editing is not available on this account yet.",
              "info",
            )
            }
            className="absolute -right-1 top-1 flex h-8 w-8 items-center justify-center rounded-lg bg-brand-main text-white shadow-sm transition hover:bg-brand-main/80"
            aria-label="Edit profile"
          >
            <Pencil className="h-4 w-4" />
          </button>
        </div>

        <h1 className="mt-5 text-2xl font-bold text-gray-900">
          {session.displayName}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {session.phoneNumber || session.email || "Security officer"}
        </p>
        {session.email && session.phoneNumber ? (
          <p className="mt-1 text-sm text-gray-500">{session.email}</p>
        ) : null}
        <p className="mt-2 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
          Security officer
        </p>
        {session.properties.length > 0 ? (
          <p className="mt-3 text-center text-sm text-gray-600">
            {session.properties.map((property) => property.name).join(" · ")}
          </p>
        ) : null}

        <Link
          href={mainAppPath}
          className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-brand-main hover:underline lg:hidden"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dwelliva
        </Link>

        <button
          type="button"
          onClick={logout}
          className="mt-auto flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-red-50 text-sm font-semibold text-red-600 transition hover:bg-red-100 lg:mt-12 lg:max-w-xs"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </div>
  );
};

SecurityProfilePage.getLayout = (page) => (
  <SecurityLayout>{page}</SecurityLayout>
);

export default SecurityProfilePage;
