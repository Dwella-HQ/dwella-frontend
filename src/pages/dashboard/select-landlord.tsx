import * as React from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { ArrowRight, Building2 } from "lucide-react";

import { useUser } from "@/contexts/UserContext";
import { useSelectedLandlord } from "@/contexts/SelectedLandlordContext";
import { mockLandlordAccounts, type LandlordAccount } from "@/data/mockLandlordAccounts";
import logo from "@/assets/logo.png";
import Image from "next/image";

import type { NextPageWithLayout } from "../_app";

const SelectLandlordPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { user } = useUser();
  const { setSelectedLandlord } = useSelectedLandlord();

  // Redirect if not a manager
  React.useEffect(() => {
    if (user && user.role !== "manager") {
      router.replace("/dashboard");
    }
  }, [user, router]);

  const handleSelectLandlord = React.useCallback(
    (landlord: LandlordAccount) => {
      setSelectedLandlord(landlord);
      router.push("/dashboard");
    },
    [setSelectedLandlord, router]
  );

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (!user || user.role !== "manager") {
    return null;
  }

  return (
    <>
      <Head>
        <title>DWELLA NG · Select Landlord Account</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Image
                  src={logo}
                  alt="DWELLA NG logo"
                  width={32}
                  height={32}
                  className="object-contain"
                />
                <span className="text-xl font-bold text-gray-900">DWELLA NG</span>
              </div>
              <button
                onClick={() => router.push("/auth/login")}
                className="text-sm text-gray-600 hover:text-gray-900 transition"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Title Section */}
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
              Select Landlord Account
            </h1>
            <p className="text-lg text-gray-600">
              Choose which landlord's properties you want to manage
            </p>
          </div>

          {/* Landlord Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {mockLandlordAccounts.map((landlord, index) => (
              <motion.div
                key={landlord.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleSelectLandlord(landlord)}
              >
                {/* Avatar and Name */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-16 w-16 rounded-full bg-brand-main flex items-center justify-center text-white text-xl font-semibold flex-shrink-0">
                    {getInitials(landlord.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {landlord.name}
                    </h3>
                    <p className="text-sm text-gray-600 truncate">{landlord.email}</p>
                  </div>
                </div>

                {/* Properties Info */}
                <div className="mb-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {landlord.properties.length}{" "}
                        {landlord.properties.length === 1 ? "Property" : "Properties"}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {landlord.totalUnits} Total Units
                    </span>
                  </div>
                  <div className="space-y-1">
                    {landlord.properties.map((property) => (
                      <div key={property.id} className="text-sm text-gray-700">
                        • {property.name}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Continue Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectLandlord(landlord);
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-gray-800"
                >
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

SelectLandlordPage.getLayout = (page) => page;

export default SelectLandlordPage;

