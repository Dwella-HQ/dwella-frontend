import Head from "next/head";
import dynamic from "next/dynamic";
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
import type { PropertyDTO } from "@/api/properties/properties.schema";
import type { TransactionDTO } from "@/api/transaction";
import {
  Home,
  KeyRound,
  Loader2,
  User,
  UserCog,
  Users,
  Wallet,
} from "lucide-react";

const AdminDashboardCharts = dynamic(
  () => import("@/components/admin/AdminDashboardCharts"),
  {
    ssr: false,
    loading: () => (
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {[0, 1, 2, 3].map((k) => (
          <div
            key={k}
            className="flex h-[300px] items-center justify-center rounded-[10px] border border-[#E2E8F0] bg-white"
          >
            <Loader2 className="h-8 w-8 animate-spin text-[#94A3B8]" />
          </div>
        ))}
      </div>
    ),
  },
);

function extractCreatedAt(rec: object): string | undefined {
  const r = rec as Record<string, unknown>;
  const v = r.createdAt ?? r.created_at;
  return typeof v === "string" ? v : undefined;
}

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

  const [chartsPayload, setChartsPayload] = React.useState<{
    propertyDatesIso: string[];
    userDatesIso: string[];
    transactions: TransactionDTO[];
    propertyCategoryRows: Pick<
      PropertyDTO,
      "propertyType" | "numberOfUnits"
    >[];
  } | null>(null);

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

      const tenantsRows = tenantsR.success ? tenantsR.data : [];
      const landlordsRows = landlordsR.success ? landlordsR.data : [];
      const pmRows = pmR.success ? pmR.data : [];
      const propsRows = propsR.success ? propsR.data : [];
      const txRows = txR.success ? txR.data : [];

      const propertyDatesIso: string[] = [];
      for (const p of propsRows) {
        if (typeof p.createdAt === "string") propertyDatesIso.push(p.createdAt);
      }

      const userDatesIso: string[] = [];
      for (const t of tenantsRows) {
        const d = extractCreatedAt(t as object);
        if (d) userDatesIso.push(d);
      }
      for (const l of landlordsRows) {
        if (typeof l.createdAt === "string") userDatesIso.push(l.createdAt);
      }
      for (const m of pmRows) {
        const d = extractCreatedAt(m as object);
        if (d) userDatesIso.push(d);
      }

      setChartsPayload({
        propertyDatesIso,
        userDatesIso,
        transactions: txRows,
        propertyCategoryRows: propsRows.map((p) => ({
          propertyType: p.propertyType,
          numberOfUnits: p.numberOfUnits,
        })),
      });

      const tenantsCount = tenantsRows.length;
      const landlordsCount = landlordsRows.length;
      const pmCount = pmRows.length;
      const propsCount = propsRows.length;
      const txCount = txRows.length;
      const txVolume = txR.success
        ? txRows.reduce(
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
          delta: "Tenant records",
        },
        {
          label: "Landlords",
          value: fmtInt(landlordsCount),
          delta: "Landlord records",
        },
        {
          label: "Property Managers",
          value: fmtInt(pmCount),
          delta: "Manager records",
        },
        {
          label: "Total Transactions Volume",
          value: volLabel,
          delta: "Payment records",
        },
        {
          label: "Total Properties",
          value: fmtInt(propsCount),
          delta: "Property records",
        },
        {
          label: "Recorded transactions",
          value: fmtInt(txCount),
          delta: "Payment records",
        },
        {
          label: "Pending Verification",
          value: fmtInt(pendingVer),
          delta: "Verification records",
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
        <section className="w-full min-w-0 space-y-3">
          <div className="flex items-center gap-2">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-[#64748B]" />
            ) : null}
            <p className="text-[11px] text-[#64748B]">
              Overview of users, properties, payments, and verifications.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
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
                      <p className="mt-1 text-xl font-semibold leading-none tracking-[-0.02em] sm:text-2xl lg:text-[32px]">
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

          <div className="mt-2">
            {chartsPayload ? (
              <AdminDashboardCharts
                propertyDatesIso={chartsPayload.propertyDatesIso}
                userDatesIso={chartsPayload.userDatesIso}
                transactions={chartsPayload.transactions}
                propertyCategoryRows={chartsPayload.propertyCategoryRows}
              />
            ) : (
              <div className="flex min-h-[220px] items-center justify-center rounded-[10px] border border-dashed border-[#E2E8F0] bg-white py-12 text-sm text-[#94A3B8]">
                Loading charts…
              </div>
            )}
          </div>
        </section>
      </AdminLayout>
    </>
  );
};

export default AdminDashboardPage;
