import Head from "next/head";
import * as React from "react";
import { useRouter } from "next/router";
import type { NextPageWithLayout } from "../_app";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useToast } from "@/components/Toast";
import { getWithdrawals, type WithdrawalItemDTO } from "@/api/withdrawal";

const extractWithdrawalList = (payload: unknown): WithdrawalItemDTO[] => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload as WithdrawalItemDTO[];

  const p = payload as { data?: unknown; withdrawals?: unknown };

  const maybeList =
    p?.data && Array.isArray(p.data)
      ? p.data
      : Array.isArray(p.withdrawals)
        ? p.withdrawals
        : Array.isArray((p.data as any)?.withdrawals)
          ? (p.data as any).withdrawals
          : Array.isArray((p.data as any)?.transactions)
            ? (p.data as any).transactions
            : [];

  return maybeList as WithdrawalItemDTO[];
};

const WithdrawalsPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { showToast } = useToast();

  const [withdrawals, setWithdrawals] = React.useState<WithdrawalItemDTO[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      const result = await getWithdrawals();
      if (cancelled) return;

      if (result.success) {
        setWithdrawals(extractWithdrawalList(result.data));
      } else {
        showToast(result.error || "Failed to load withdrawals", "error");
        setWithdrawals([]);
      }
      setIsLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [showToast]);

  return (
    <>
      <Head>
        <title>DWELLA NG · Withdrawals</title>
      </Head>

      <section className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              Withdrawals
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Review and manage your withdrawal requests.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/dashboard/withdrawals/new")}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-main px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-main/90"
          >
            New Withdrawal
          </button>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          {isLoading ? (
            <div className="py-10 text-sm text-gray-600">Loading...</div>
          ) : withdrawals.length === 0 ? (
            <div className="py-10 text-sm text-gray-500">
              No withdrawals found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse">
                <thead>
                  <tr className="text-left text-xs uppercase text-gray-500">
                    <th className="py-3 pr-3">ID</th>
                    <th className="py-3 pr-3">Wallet</th>
                    <th className="py-3 pr-3">Amount</th>
                    <th className="py-3 pr-3">Status</th>
                    <th className="py-3 pr-3">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawals.map((w) => (
                    <tr
                      key={String(w.id ?? Math.random())}
                      className="border-t border-gray-100 hover:bg-gray-50 cursor-pointer"
                      onClick={() =>
                        router.push(`/dashboard/withdrawals/${String(w.id)}`)
                      }
                    >
                      <td className="py-3 pr-3 text-sm text-gray-900">
                        {w.id ?? "—"}
                      </td>
                      <td className="py-3 pr-3 text-sm text-gray-700">
                        {w.walletId ?? "—"}
                      </td>
                      <td className="py-3 pr-3 text-sm text-gray-700">
                        {typeof w.amount === "string" ||
                        typeof w.amount === "number"
                          ? w.amount
                          : "—"}
                      </td>
                      <td className="py-3 pr-3 text-sm text-gray-700">
                        {w.status ?? "—"}
                      </td>
                      <td className="py-3 pr-3 text-sm text-gray-700">
                        {w.createdAt ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </>
  );
};

WithdrawalsPage.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;

export default WithdrawalsPage;
