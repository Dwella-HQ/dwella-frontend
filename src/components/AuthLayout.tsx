import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/router";
import loginImage from "@/assets/auth/login_image.png";
import { useUser } from "@/contexts/UserContext";

export type AuthLayoutProps = {
  children: React.ReactNode;
  showImage?: boolean;
};

export const AuthLayout = ({ children, showImage = true }: AuthLayoutProps) => {
  const router = useRouter();
  const { user, logout } = useUser();

  const handleLogout = React.useCallback(async () => {
    logout();
    await router.push("/");
  }, [logout, router]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {showImage && (
        <div className="hidden lg:flex lg:w-1/2 relative">
          <Image
            src={loginImage}
            alt="Login background"
            fill
            className="object-cover"
            priority
          />
        </div>
      )}
      <div
        className={`flex-1 flex flex-col ${showImage ? "lg:w-1/2" : "w-full"}`}
      >
        <div className="px-4 pt-4 sm:px-6 lg:px-8">
          {user ? (
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-brand-main"
            >
              <ArrowLeft className="h-4 w-4" />
              Logout
            </button>
          ) : (
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-brand-main"
            >
              <ArrowLeft className="h-4 w-4" />
              Back Home
            </Link>
          )}
        </div>
        <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
          <div className="w-full">{children}</div>
        </div>
      </div>
    </div>
  );
};
