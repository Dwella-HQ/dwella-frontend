import Head from "next/head";
import type { NextPageWithLayout } from "@/pages/_app";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { adminMetrics } from "@/data/mockAdminDashboard";
import { Home, KeyRound, User, UserCog, Users, Wallet } from "lucide-react";

const metricIcons = [
  Users,
  User,
  UserCog,
  User,
  Wallet,
  Home,
  KeyRound,
  KeyRound,
];

const AdminDashboardPage: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>DWELLA NG · Admin Dashboard</title>
      </Head>
      <AdminLayout title="Dashboard">
        <section className="space-y-3">
          <div className="grid grid-cols-4 gap-3">
            {adminMetrics.map((metric, index) => {
              const Icon = metricIcons[index] ?? Users;
              return (
                <div
                  key={metric.label}
                  className="rounded-[10px] border border-[#E2E8F0] bg-white px-3 py-2.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[12px] text-[#64748B]">
                        {metric.label}
                      </p>
                      <p className="mt-1 text-[32px] font-semibold leading-none tracking-[-0.02em]">
                        {metric.value}
                      </p>
                      <p className="mt-1 text-[11px] text-[#16A34A]">
                        {metric.delta}
                      </p>
                    </div>
                    <div className="rounded-md bg-[#ECFDF3] p-2 text-[#111827]">
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[10px] border border-[#E2E8F0] bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-[24px] font-semibold leading-none">
                    Total Properties
                  </p>
                  <p className="mt-1 text-[12px] text-[#64748B]">
                    Total Properties active on the platform over time
                  </p>
                </div>
                <button className="rounded-md border border-[#E2E8F0] px-2.5 py-1 text-[11px] text-[#64748B]">
                  This Year
                </button>
              </div>
              <div className="h-[170px] rounded-md bg-gradient-to-b from-[#F8FAFC] to-[#EEF2FF]" />
            </div>
            <div className="rounded-[10px] border border-[#E2E8F0] bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-[24px] font-semibold leading-none">
                    Total Users
                  </p>
                  <p className="mt-1 text-[12px] text-[#64748B]">
                    All Users on The Platform Over Time
                  </p>
                </div>
                <button className="rounded-md border border-[#E2E8F0] px-2.5 py-1 text-[11px] text-[#64748B]">
                  This Week
                </button>
              </div>
              <div className="h-[170px] rounded-md bg-gradient-to-b from-[#F8FAFC] to-[#DBEAFE]" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[10px] border border-[#E2E8F0] bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-[24px] font-semibold leading-none">
                    Total Transaction Volume
                  </p>
                  <p className="mt-1 text-[12px] text-[#64748B]">
                    Total Transactions carried out on the platform over time
                  </p>
                </div>
                <button className="rounded-md border border-[#E2E8F0] px-2.5 py-1 text-[11px] text-[#64748B]">
                  This Year
                </button>
              </div>
              <div className="h-[170px] rounded-md bg-gradient-to-b from-[#F8FAFC] to-[#DBEAFE]" />
            </div>
            <div className="rounded-[10px] border border-[#E2E8F0] bg-white p-4">
              <p className="text-[24px] font-semibold leading-none">
                Top Property Category
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                {["3 Bedroom", "2 Bedroom", "Self Contain", "Duplex"].map(
                  (item, index) => (
                    <div
                      key={item}
                      className="rounded-md bg-[#F8FAFC] px-3 py-2"
                    >
                      <p className="text-[16px] font-medium">
                        {index + 1} {item}
                      </p>
                      <p className="text-[12px] text-[#64748B]">
                        {463 - index * 10} Units
                      </p>
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>
        </section>
      </AdminLayout>
    </>
  );
};

export default AdminDashboardPage;
