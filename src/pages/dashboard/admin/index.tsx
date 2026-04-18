import Head from "next/head";
import * as React from "react";
import type { NextPageWithLayout } from "@/pages/_app";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { adminMetrics } from "@/data/mockAdminDashboard";
import { getTenantList } from "@/api/tenants";
import { getLandlords } from "@/api/landlord";
import { getPropertyManagers } from "@/api/property-managers";
import { getProperties } from "@/api/properties";
import { getTransactions } from "@/api/transaction";
import { getVerifications } from "@/api/verification";
import {
  Home,
  KeyRound,
  Loader2,
  User,
  UserCog,
  Users,
  Wallet,
} from "lucide-react";

function fmtInt(n: number): string {
  return n.toLocaleString();
}

function parseTxVolumeFromRow(tx: Record<string, unknown>): number {
  const raw =
    tx.amount ??
    tx.totalAmount ??
    tx.value ??
    tx.payableAmount ??
    tx.amountInKobo;
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : 0;
  if (typeof raw === "string") {
    const n = parseFloat(raw.replace(/[^0-9.-]/g, ""));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

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
  const [metrics, setMetrics] = React.useState(adminMetrics);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      const [tenantsR, landlordsR, pmR, propsR, txR, verR] = await Promise.all([
        getTenantList({ limit: 500 }),
        getLandlords(),
        getPropertyManagers(),
        getProperties(),
        getTransactions(),
        getVerifications(),
      ]);

      if (cancelled) return;

      const tenantsCount = tenantsR.success ? tenantsR.data.length : 0;
      const landlordsCount = landlordsR.success ? landlordsR.data.length : 0;
      const pmCount = pmR.success ? pmR.data.length : 0;
      const propsCount = propsR.success ? propsR.data.length : 0;
      const txCount = txR.success ? txR.data.length : 0;
      const txVolume = txR.success
        ? txR.data.reduce(
            (sum, row) =>
              sum + parseTxVolumeFromRow(row as Record<string, unknown>),
            0,
          )
        : 0;
      const pendingVer = verR.success
        ? verR.data.filter((v) => String(v.status).toUpperCase() === "PENDING")
            .length
        : 0;

      const approxUsers = tenantsCount + landlordsCount + pmCount;

      const volLabel =
        txVolume > 0
          ? new Intl.NumberFormat("en-NG", {
              style: "currency",
              currency: "NGN",
              maximumFractionDigits: 0,
            }).format(txVolume)
          : txCount > 0
            ? `${fmtInt(txCount)} tx`
            : "—";

      setMetrics([
        {
          label: "Total Users (approx.)",
          value: fmtInt(approxUsers),
          delta: "Tenants + landlords + managers",
        },
        {
          label: "Tenants",
          value: fmtInt(tenantsCount),
          delta: "GET /tenant",
        },
        {
          label: "Landlords",
          value: fmtInt(landlordsCount),
          delta: "GET /landlord",
        },
        {
          label: "Property Managers",
          value: fmtInt(pmCount),
          delta: "GET /property-manager",
        },
        {
          label: "Total Transactions Volume",
          value: volLabel,
          delta: "GET /transaction",
        },
        {
          label: "Total Properties",
          value: fmtInt(propsCount),
          delta: "GET /property",
        },
        {
          label: "Recorded transactions",
          value: fmtInt(txCount),
          delta: "GET /transaction",
        },
        {
          label: "Pending Verification",
          value: fmtInt(pendingVer),
          delta: "GET /verification",
        },
      ]);
      setLoading(false);
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <Head>
        <title>DWELLA NG · Admin Dashboard</title>
      </Head>
      <AdminLayout title="Dashboard">
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-[#64748B]" />
            ) : null}
            <p className="text-[11px] text-[#64748B]">
              Metric cards load from documented list endpoints (users,
              landlords, properties, transactions, verifications).
            </p>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {metrics.map((metric, index) => {
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
                      <p className="mt-1 text-[11px] text-[#64748B]">
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
                    Pulled from GET /property with other admin metrics
                  </p>
                </div>
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
                    Approximate sum of tenants, landlords, and property managers
                  </p>
                </div>
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
                    Parsed from GET /transaction when amounts are present
                  </p>
                </div>
              </div>
              <div className="h-[170px] rounded-md bg-gradient-to-b from-[#F8FAFC] to-[#DBEAFE]" />
            </div>
            <div className="rounded-[10px] border border-[#E2E8F0] bg-white p-4">
              <p className="text-[24px] font-semibold leading-none">
                Top Property Category
              </p>
              <p className="mt-2 text-[12px] text-[#64748B]">
                Use property analytics when the API exposes category breakdowns.
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
                      <p className="text-[12px] text-[#64748B]">—</p>
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
