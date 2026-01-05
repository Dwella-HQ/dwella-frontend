import Head from "next/head";
import * as React from "react";
import { useRouter } from "next/router";
import {
  ArrowLeft,
  BarChart3,
  Calendar,
  ChevronLeft,
  Copy,
  Mail,
  MapPin,
  Phone,
  Search,
  User,
  Wallet,
} from "lucide-react";

import { DashboardLayout } from "@/components/DashboardLayout";
import { PartnerProfileTab } from "@/components/PartnerProfileTab";
import { PartnerAnalyticsTab } from "@/components/PartnerAnalyticsTab";
import { TransactionTable } from "@/components/TransactionTable";
import { CustomerTransactionTable } from "@/components/CustomerTransactionTable";
import type { Transaction } from "@/components/TransactionTable";
import type { CustomerTransaction } from "@/components/CustomerTransactionTable";
import { partnerTransactions } from "@/api/transactions/transactions.mock";
import { customerTransactions } from "@/api/transactions/transactions.mock";

import type { NextPageWithLayout } from "../../_app";

type PartnerDetailTab = "profile" | "analytics" | "wallet" | "customers";

const PartnersDetailPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { id } = router.query;
  const [activeTab, setActiveTab] = React.useState<PartnerDetailTab>("profile");

  const handleBack = React.useCallback(() => {
    router.push("/dashboard/partners");
  }, [router]);

  const handleSuspendPartner = React.useCallback(() => {
    console.info("Suspend partner:", id);
  }, [id]);

  const handleResetPassword = React.useCallback(() => {
    console.info("Reset password for partner:", id);
  }, [id]);

  return (
    <>
      <Head>
        <title>NESCO Partners · Partner Details</title>
      </Head>

      <section className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleBack}
            className="cursor-pointer rounded-lg p-2 text-brand-ash transition-fx hover:bg-brand-light-bg hover:text-brand-black"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-brand-black">
              Buypowerpartner.com
            </h1>
            <span className="inline-flex items-center rounded-full bg-brand-success-bg px-3 py-1 text-sm font-medium text-brand-success-text">
              Active
            </span>
          </div>
        </div>

        <div className="flex items-center gap-6 border-b border-brand-border-light">
          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            className={`transition-fx relative flex cursor-pointer items-end gap-1 px-4 py-3 ${
              activeTab === "profile"
                ? "text-brand-main"
                : "text-brand-ash hover:text-brand-black"
            }`}
          >
            <User className="h-5 w-5" />
            <span className="text-sm font-medium">Profile</span>
            {activeTab === "profile" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-main" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("analytics")}
            className={`transition-fx relative flex cursor-pointer flex-col items-center gap-1 px-4 py-3 ${
              activeTab === "analytics"
                ? "text-brand-main"
                : "text-brand-ash hover:text-brand-black"
            }`}
          >
            <BarChart3 className="h-5 w-5" />
            <span className="text-sm font-medium">Analytics</span>
            {activeTab === "analytics" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-main" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("wallet")}
            className={`transition-fx relative flex cursor-pointer flex-col items-center gap-1 px-4 py-3 ${
              activeTab === "wallet"
                ? "text-brand-main"
                : "text-brand-ash hover:text-brand-black"
            }`}
          >
            <Wallet className="h-5 w-5" />
            <span className="text-sm font-medium">Wallet Transactions</span>
            {activeTab === "wallet" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-main" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("customers")}
            className={`transition-fx relative flex cursor-pointer flex-col items-center gap-1 px-4 py-3 ${
              activeTab === "customers"
                ? "text-brand-main"
                : "text-brand-ash hover:text-brand-black"
            }`}
          >
            <Search className="h-5 w-5" />
            <span className="text-sm font-medium">Customer Transactions</span>
            {activeTab === "customers" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-main" />
            )}
          </button>
        </div>

        <div className="space-y-6">
          {activeTab === "profile" && (
            <PartnerProfileTab
              onSuspendPartner={handleSuspendPartner}
              onResetPassword={handleResetPassword}
            />
          )}
          {activeTab === "analytics" && <PartnerAnalyticsTab />}
          {activeTab === "wallet" && (
            <div className="rounded-2xl border border-brand-border-light bg-brand-white shadow-sm">
              <TransactionTable
                transactions={partnerTransactions as Transaction[]}
              />
            </div>
          )}
          {activeTab === "customers" && (
            <div className="rounded-2xl border border-brand-border-light bg-brand-white shadow-sm">
              <CustomerTransactionTable
                transactions={customerTransactions as CustomerTransaction[]}
              />
            </div>
          )}
        </div>
      </section>
    </>
  );
};

PartnersDetailPage.getLayout = (page) => (
  <DashboardLayout heading="" byText="">
    {page}
  </DashboardLayout>
);

export default PartnersDetailPage;
