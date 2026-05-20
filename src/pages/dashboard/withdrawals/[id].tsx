import Head from "next/head";
import * as React from "react";
import { useRouter } from "next/router";
import * as Dialog from "@radix-ui/react-dialog";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import type { NextPageWithLayout } from "../../_app";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useToast } from "@/components/Toast";
import {
  getWithdrawalById,
  updateWithdrawal,
  deleteWithdrawal,
  type WithdrawalItemDTO,
} from "@/api/withdrawal";

const WithdrawalsIdPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { showToast } = useToast();
  const { id } = router.query;

  const [withdrawal, setWithdrawal] = React.useState<WithdrawalItemDTO | null>(
    null,
  );
  const [loading, setLoading] = React.useState(false);

  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [editAmount, setEditAmount] = React.useState<string>("");
  const [editNarration, setEditNarration] = React.useState<string>("");

  React.useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!id || typeof id !== "string") return;
      setLoading(true);
      const result = await getWithdrawalById(id);
      if (cancelled) return;
      if (result.success) {
        const payload = result.data as
          | WithdrawalItemDTO
          | { data?: WithdrawalItemDTO };
        const data = (payload as any).data ?? payload;
        setWithdrawal(data as WithdrawalItemDTO);
      } else {
        showToast(result.error || "Failed to load withdrawal", "error");
      }
      setLoading(false);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [id, showToast]);

  React.useEffect(() => {
    if (!withdrawal) return;
    setEditAmount(
      withdrawal.amount !== undefined ? String(withdrawal.amount) : "",
    );
    setEditNarration(withdrawal.narration ?? "");
  }, [withdrawal]);

  const handleDelete = React.useCallback(async () => {
    if (!id || typeof id !== "string") return;
    const ok = window.confirm("Delete this withdrawal request?");
    if (!ok) return;
    const result = await deleteWithdrawal(id);
    if (result.success) {
      showToast("Withdrawal deleted", "success");
      router.push("/dashboard/withdrawals");
    } else {
      showToast(result.error || "Failed to delete withdrawal", "error");
    }
  }, [id, router, showToast]);

  const handleSave = React.useCallback(async () => {
    if (!id || typeof id !== "string") return;
    setLoading(true);
    const payload = {
      amount: editAmount ? Number(editAmount) : undefined,
      narration: editNarration || undefined,
    };
    const result = await updateWithdrawal(id, payload);
    if (result.success) {
      showToast("Withdrawal updated", "success");
      setIsEditOpen(false);
      // Reload
      const reload = await getWithdrawalById(id);
      if (reload.success) {
        const payload2 = reload.data as any;
        setWithdrawal((payload2.data ?? payload2) as WithdrawalItemDTO);
      }
    } else {
      showToast(result.error || "Failed to update withdrawal", "error");
    }
    setLoading(false);
  }, [editAmount, editNarration, id, showToast]);

  return (
    <>
      <Head>
        <title>DWELLA NG · Withdrawal Details</title>
      </Head>

      <section className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              Withdrawal Details
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Manage this request and view its account information.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-60"
              disabled={loading}
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => setIsEditOpen(true)}
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition disabled:opacity-60"
              disabled={loading}
            >
              Edit
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 transition disabled:opacity-60"
              disabled={loading}
            >
              Delete
            </button>
          </div>
        </div>

        {loading && !withdrawal ? (
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            Loading...
          </div>
        ) : withdrawal ? (
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  ID
                </p>
                <p className="mt-1 text-sm font-medium text-gray-900">
                  {withdrawal.id ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Wallet
                </p>
                <p className="mt-1 text-sm font-medium text-gray-900">
                  {withdrawal.walletId ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Amount
                </p>
                <p className="mt-1 text-sm font-medium text-gray-900">
                  {withdrawal.amount ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Status
                </p>
                <p className="mt-1 text-sm font-medium text-gray-900">
                  {withdrawal.status ?? "—"}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Narration
              </p>
              <p className="mt-1 text-sm text-gray-700">
                {withdrawal.narration ?? "—"}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Recipient details
              </p>
              <div className="mt-3 rounded-md border border-gray-200 bg-gray-50 p-4 space-y-2">
                <p className="text-sm text-gray-700">
                  Name:{" "}
                  {(withdrawal.recipientDetails as { accountName?: string })
                    ?.accountName ??
                    (withdrawal.recipientDetails as { fullName?: string })
                      ?.fullName ??
                    "—"}
                </p>
                <p className="text-sm text-gray-700">
                  Bank:{" "}
                  {withdrawal.recipientDetails?.bankName ??
                    withdrawal.recipientDetails?.bankCode ??
                    "—"}
                </p>
                <p className="text-sm text-gray-700">
                  Account Number:{" "}
                  {withdrawal.recipientDetails?.accountNumber ?? "—"}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            No withdrawal found.
          </div>
        )}
      </section>

      <Dialog.Root open={isEditOpen} onOpenChange={setIsEditOpen}>
        <Dialog.Portal>
          <Dialog.Overlay asChild>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-black/50"
            />
          </Dialog.Overlay>
          <Dialog.Content className="fixed left-1/2 top-1/2 z-[100] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg border border-gray-200 bg-white p-6 shadow-xl">
            <Dialog.Title className="text-lg font-bold text-gray-900">
              Edit Withdrawal
            </Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-gray-600">
              Update amount or narration. The payout bank account is managed in
              Settings, not here.
            </Dialog.Description>

            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Amount
                </label>
                <input
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  inputMode="decimal"
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Narration
                </label>
                <input
                  value={editNarration}
                  onChange={(e) => setEditNarration(e.target.value)}
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Dialog.Close asChild>
                  <button
                    type="button"
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                </Dialog.Close>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={loading}
                  className="rounded-lg bg-brand-main px-4 py-2 text-sm font-medium text-white hover:bg-brand-main/90 transition disabled:opacity-60"
                >
                  Save
                </button>
              </div>
            </div>

            <Dialog.Close asChild>
              <button
                type="button"
                className="absolute right-3 top-3 rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-red-600 transition"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
};

WithdrawalsIdPage.getLayout = (page) => (
  <DashboardLayout>{page}</DashboardLayout>
);

export default WithdrawalsIdPage;
