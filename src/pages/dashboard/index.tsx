import Head from "next/head";
import { useRouter } from "next/router";
import * as React from "react";

import { DashboardLayout } from "@/components/DashboardLayout";
import { DashboardSummaryCards } from "@/components/DashboardSummaryCards";
import { DashboardActionButtons } from "@/components/DashboardActionButtons";
import { RecentPayments } from "@/components/RecentPayments";
import { MaintenanceRequests } from "@/components/MaintenanceRequests";
import { MyProperties } from "@/components/MyProperties";
import { AddTenantModal } from "@/components/AddTenantModal";
import { SendAnnouncementModal } from "@/components/SendAnnouncementModal";
import {
  mockDashboardStats,
  mockRecentPayments,
  mockMaintenanceRequests,
  mockProperties,
} from "@/data/mockLandlordData";

import type { NextPageWithLayout } from "../_app";

const DashboardPage: NextPageWithLayout = () => {
  const router = useRouter();
  const [isAddTenantOpen, setIsAddTenantOpen] = React.useState(false);
  const [isSendAnnouncementOpen, setIsSendAnnouncementOpen] = React.useState(false);

  const handleAddProperty = React.useCallback(() => {
    router.push("/dashboard/properties/new");
  }, [router]);

  const handleAssignTenant = React.useCallback(() => {
    setIsAddTenantOpen(true);
  }, []);

  const handleSendAnnouncement = React.useCallback(() => {
    setIsSendAnnouncementOpen(true);
  }, []);

  return (
    <>
      <Head>
        <title>DWELLA NG · Dashboard</title>
      </Head>

      <section className="space-y-6">
        {/* Welcome Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-1 text-base font-normal text-gray-600">
              Welcome back! Here's what's happening with your properties.
            </p>
          </div>
          <DashboardActionButtons
            onAddProperty={handleAddProperty}
            onAssignTenant={handleAssignTenant}
            onSendAnnouncement={handleSendAnnouncement}
          />
        </div>

        {/* Summary Cards */}
        <DashboardSummaryCards stats={mockDashboardStats} />

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Payments */}
          <RecentPayments
            payments={mockRecentPayments.slice(0, 3)}
            onViewAll={() => router.push("/dashboard/rent")}
          />

          {/* Maintenance Requests */}
          <MaintenanceRequests
            requests={mockMaintenanceRequests.slice(0, 3)}
            onViewAll={() => router.push("/dashboard/maintenance")}
          />
        </div>

        {/* My Properties */}
        <MyProperties
          properties={mockProperties.slice(0, 3)}
          onViewAll={() => router.push("/dashboard/properties")}
        />
      </section>

      {/* Modals */}
      <AddTenantModal
        isOpen={isAddTenantOpen}
        onClose={() => setIsAddTenantOpen(false)}
      />
      <SendAnnouncementModal
        isOpen={isSendAnnouncementOpen}
        onClose={() => setIsSendAnnouncementOpen(false)}
      />
    </>
  );
};

DashboardPage.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;

export default DashboardPage;
