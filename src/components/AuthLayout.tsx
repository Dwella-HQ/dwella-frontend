import * as React from "react";
import Image from "next/image";
import loginImage from "@/assets/auth/login_image.png";

export type AuthLayoutProps = {
  children: React.ReactNode;
  showImage?: boolean;
};

export const AuthLayout = ({ children, showImage = true }: AuthLayoutProps) => {
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
        <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
          <div className="w-full">{children}</div>
        </div>
      </div>
    </div>
  );
};
