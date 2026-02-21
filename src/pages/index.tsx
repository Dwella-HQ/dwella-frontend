import * as React from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Image from "next/image";
import logo from "@/assets/logo.png";
import loginImage from "@/assets/auth/login_image.png";

const IndexPage = () => {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = React.useState<"landlord" | "tenant" | "manager" | null>(null);

  const handleContinue = () => {
    if (selectedRole) {
      // Redirect property managers to their dedicated signup page
      if (selectedRole === "manager") {
        router.push("/auth/signup/manager");
      } else {
        router.push(`/auth/signup?role=${selectedRole}`);
      }
    }
  };

  return (
    <>
      <Head>
        <title>DWELLA NG · Get Started</title>
      </Head>

      <div className="flex min-h-screen bg-gray-50">
        {/* Left side - Image */}
        <div className="hidden lg:flex lg:w-1/2 relative">
          <Image
            src={loginImage}
            alt="Building background"
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Right side - Form */}
        <div className="flex-1 flex flex-col lg:w-1/2">
          <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
            <div className="w-full max-w-md">
              {/* Logo */}
              <div className="flex items-center justify-center gap-2 mb-8">
                <Image
                  src={logo}
                  alt="DWELLA NG logo"
                  width={48}
                  height={48}
                  className="object-contain"
                />
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-brand-main">DWELLA</span>
                  <span className="text-2xl font-bold text-blue-400">NG</span>
                </div>
              </div>

              {/* Heading */}
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8 text-center">
                Get Started As
              </h1>

              {/* Role Selection - Radio Buttons */}
              <div className="space-y-3 mb-8">
                {/* Landlord Option */}
                <label
                  className={`flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition ${
                    selectedRole === "landlord"
                      ? "border-brand-main bg-brand-main/5"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value="landlord"
                    checked={selectedRole === "landlord"}
                    onChange={(e) => setSelectedRole(e.target.value as "landlord")}
                    className="mt-1 h-5 w-5 text-brand-main focus:ring-brand-main border-gray-300"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 mb-1">Landlord / Realtor</div>
                    <div className="text-sm text-gray-500">
                      Manage properties, rent, and tenants.
                    </div>
                  </div>
                </label>

                {/* Tenant Option */}
                <label
                  className={`flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition ${
                    selectedRole === "tenant"
                      ? "border-brand-main bg-brand-main/5"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value="tenant"
                    checked={selectedRole === "tenant"}
                    onChange={(e) => setSelectedRole(e.target.value as "tenant")}
                    className="mt-1 h-5 w-5 text-brand-main focus:ring-brand-main border-gray-300"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 mb-1">Tenant</div>
                    <div className="text-sm text-gray-500">
                      Find and manage your rental home.
                    </div>
                  </div>
                </label>

                {/* Property Manager Option */}
                <label
                  className={`flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition ${
                    selectedRole === "manager"
                      ? "border-brand-main bg-brand-main/5"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value="manager"
                    checked={selectedRole === "manager"}
                    onChange={(e) => setSelectedRole(e.target.value as "manager")}
                    className="mt-1 h-5 w-5 text-brand-main focus:ring-brand-main border-gray-300"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 mb-1">Property Manager</div>
                    <div className="text-sm text-gray-500">
                      Manage properties on behalf of landlords.
                    </div>
                  </div>
                </label>
              </div>

              {/* Continue Button */}
              <button
                type="button"
                onClick={handleContinue}
                disabled={!selectedRole}
                className="w-full rounded-lg bg-gray-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Continue
              </button>

              {/* Login Link */}
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Already have an account?{" "}
                  <a
                    href="/auth/login"
                    className="font-medium text-brand-main hover:text-brand-main/80 underline"
                  >
                    Sign in
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default IndexPage;
