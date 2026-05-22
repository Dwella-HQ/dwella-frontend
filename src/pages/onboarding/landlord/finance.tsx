import * as React from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Landmark, Home, User, FileText } from "lucide-react";

import { AuthLayout } from "@/components/AuthLayout";
import { SignUpProgress } from "@/components/SignUpProgress";
import { useToast } from "@/components/Toast";
import { createLandlord, getLandlordByUser } from "@/api/landlord";
import { ensureLandlordWallet } from "@/api/wallet";
import {
  getWithdrawalBanksByCurrency,
  resolveWithdrawalAccount,
} from "@/api/withdrawal";
import type { WithdrawalBankDTO } from "@/api/withdrawal";
import { useUser } from "@/contexts/UserContext";
import logo from "@/assets/logo.png";

import type { NextPageWithLayout } from "../../_app";

const landlordFlowSteps = [
  { number: 1, label: "Your Details", icon: User },
  { number: 2, label: "Documents", icon: FileText },
  { number: 3, label: "Finance", icon: Landmark },
  { number: 4, label: "First Property", icon: Home },
];

const BVN_LENGTH = 11;
const ACCOUNT_NUMBER_LENGTH = 10;

type LandlordFinanceDetails = {
  bvn: string;
  bankCode: string;
  bankName: string;
  accountCode: string;
  accountName: string;
};

const emptyFinanceDetails: LandlordFinanceDetails = {
  bvn: "",
  bankCode: "",
  bankName: "",
  accountCode: "",
  accountName: "",
};

const FieldCounter = ({ current, max }: { current: number; max: number }) => (
  <p
    className={`mt-1 text-right text-xs ${
      current === max ? "text-green-600" : "text-gray-500"
    }`}
    aria-live="polite"
  >
    {current}/{max}
  </p>
);

const bankOptionCode = (bank: WithdrawalBankDTO) =>
  (bank.bankCode || bank.code || "").trim();

const bankOptionName = (bank: WithdrawalBankDTO, index: number) => {
  const code = bankOptionCode(bank);
  return bank.bankName || bank.name || code || `Bank ${index + 1}`;
};

const LandlordOnboardingFinancePage: NextPageWithLayout = () => {
  const router = useRouter();
  const { showToast } = useToast();
  const { user } = useUser();
  const userId = user?.id ? String(user.id) : null;
  const userEmail = user?.email ?? "";
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = React.useState(false);
  const [financeDetails, setFinanceDetails] =
    React.useState<LandlordFinanceDetails>(emptyFinanceDetails);
  const [banks, setBanks] = React.useState<WithdrawalBankDTO[]>([]);
  const [banksLoading, setBanksLoading] = React.useState(false);
  const [resolveLoading, setResolveLoading] = React.useState(false);
  const [isAccountResolved, setIsAccountResolved] = React.useState(false);

  const autoResolveTimerRef = React.useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const lastResolvedSignatureRef = React.useRef("");
  const autoResolveFailedSignatureRef = React.useRef("");
  const resolveRequestIdRef = React.useRef(0);

  const persistLandlordId = React.useCallback((landlordId: string) => {
    if (typeof window === "undefined" || !landlordId) return;
    localStorage.setItem("landlordId", landlordId);
    const maxAge = 60 * 60 * 24 * 7;
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `landlordId=${encodeURIComponent(landlordId)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    const loadBanks = async () => {
      setBanksLoading(true);
      const result = await getWithdrawalBanksByCurrency("NGN");
      if (cancelled) return;
      if (result.success) {
        setBanks(result.data);
      } else {
        setBanks([]);
        showToast(result.error || "Failed to load banks", "error");
      }
      setBanksLoading(false);
    };
    void loadBanks();
    return () => {
      cancelled = true;
    };
  }, [showToast]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = sessionStorage.getItem("landlordOnboardingFinance");
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as Partial<
        LandlordFinanceDetails & { accountNumber?: string }
      >;
      const bvn = (parsed.bvn ?? "").replace(/\D/g, "").slice(0, BVN_LENGTH);
      const accountCode = (parsed.accountCode ?? parsed.accountNumber ?? "")
        .replace(/\D/g, "")
        .slice(0, ACCOUNT_NUMBER_LENGTH);
      const accountName = (parsed.accountName ?? "").trim();
      setFinanceDetails({
        bvn,
        bankCode: parsed.bankCode ?? "",
        bankName: parsed.bankName ?? "",
        accountCode,
        accountName,
      });
      if (parsed.bankCode && accountCode.length === ACCOUNT_NUMBER_LENGTH) {
        lastResolvedSignatureRef.current = `${parsed.bankCode}:${accountCode}`;
        setIsAccountResolved(Boolean(accountName));
      }
    } catch {
      setFinanceDetails(emptyFinanceDetails);
    }
  }, []);

  React.useEffect(() => {
    if (!financeDetails.bankCode || banks.length === 0) return;
    const match = banks.find(
      (bank) => bankOptionCode(bank) === financeDetails.bankCode,
    );
    if (!match) return;
    const name = bankOptionName(match, banks.indexOf(match));
    if (name && name !== financeDetails.bankName) {
      setFinanceDetails((prev) => ({ ...prev, bankName: name }));
    }
  }, [banks, financeDetails.bankCode, financeDetails.bankName]);

  const applyResolvedAccountName = React.useCallback(
    (rawName: string | undefined) => {
      const trimmed = (rawName ?? "").trim();
      if (!trimmed) return false;
      setFinanceDetails((prev) => ({ ...prev, accountName: trimmed }));
      setIsAccountResolved(true);
      return true;
    },
    [],
  );

  const resolveAccount = React.useCallback(
    async (options?: { silent?: boolean }) => {
      const silent = options?.silent ?? false;
      const bankCode = financeDetails.bankCode.trim();
      const digits = financeDetails.accountCode.replace(/\D/g, "");

      if (!bankCode || digits.length !== ACCOUNT_NUMBER_LENGTH) {
        if (!silent) {
          showToast(
            !bankCode
              ? "Select a bank"
              : "Enter a valid 10-digit account number",
            "error",
          );
        }
        return false;
      }

      const signature = `${bankCode}:${digits}`;
      const reqId = ++resolveRequestIdRef.current;
      setResolveLoading(true);
      const result = await resolveWithdrawalAccount({
        bankCode,
        accountNumber: digits,
      });

      if (reqId !== resolveRequestIdRef.current) {
        setResolveLoading(false);
        return false;
      }
      setResolveLoading(false);

      if (result.success) {
        lastResolvedSignatureRef.current = signature;
        autoResolveFailedSignatureRef.current = "";
        const filled = applyResolvedAccountName(result.data.accountName);
        if (!silent) {
          if (filled) {
            showToast("Account verified", "success");
          } else {
            showToast(
              "Resolved, but the bank did not return an account holder name.",
              "warning",
            );
          }
        }
        return filled;
      }

      lastResolvedSignatureRef.current = "";
      setIsAccountResolved(false);
      if (silent) {
        autoResolveFailedSignatureRef.current = signature;
      }
      if (!silent) {
        showToast(result.error || "Failed to resolve account", "error");
      }
      return false;
    },
    [
      applyResolvedAccountName,
      financeDetails.accountCode,
      financeDetails.bankCode,
      showToast,
    ],
  );

  const handleResolveAccount = React.useCallback(async () => {
    autoResolveFailedSignatureRef.current = "";
    await resolveAccount({ silent: false });
  }, [resolveAccount]);

  React.useEffect(() => {
    const digits = financeDetails.accountCode.replace(/\D/g, "");
    const bankCode = financeDetails.bankCode.trim();

    if (digits.length !== ACCOUNT_NUMBER_LENGTH || !bankCode) {
      lastResolvedSignatureRef.current = "";
      autoResolveFailedSignatureRef.current = "";
      setIsAccountResolved(false);
      return;
    }

    const signature = `${bankCode}:${digits}`;
    if (signature === lastResolvedSignatureRef.current) {
      return;
    }
    if (signature === autoResolveFailedSignatureRef.current) {
      return;
    }

    if (autoResolveTimerRef.current) {
      clearTimeout(autoResolveTimerRef.current);
    }

    autoResolveTimerRef.current = setTimeout(() => {
      autoResolveTimerRef.current = null;
      void resolveAccount({ silent: true });
    }, 450);

    return () => {
      if (autoResolveTimerRef.current) {
        clearTimeout(autoResolveTimerRef.current);
        autoResolveTimerRef.current = null;
      }
    };
  }, [financeDetails.accountCode, financeDetails.bankCode, resolveAccount]);

  const handleChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = event.target;
      let next = value;

      if (name === "bvn") {
        next = value.replace(/\D/g, "").slice(0, BVN_LENGTH);
      } else if (name === "accountCode") {
        next = value.replace(/\D/g, "").slice(0, ACCOUNT_NUMBER_LENGTH);
        setIsAccountResolved(false);
        lastResolvedSignatureRef.current = "";
        setFinanceDetails((prev) => ({
          ...prev,
          accountCode: next,
          accountName: "",
        }));
        if (submitError) setSubmitError(null);
        return;
      }

      setFinanceDetails((prev) => ({ ...prev, [name]: next }));
      if (submitError) setSubmitError(null);
    },
    [submitError],
  );

  const handleBankChange = React.useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const code = event.target.value;
      const bank = banks.find((item) => bankOptionCode(item) === code);
      const bankName = bank ? bankOptionName(bank, banks.indexOf(bank)) : "";
      setFinanceDetails((prev) => ({
        ...prev,
        bankCode: code,
        bankName,
        accountName: "",
      }));
      setIsAccountResolved(false);
      lastResolvedSignatureRef.current = "";
      autoResolveFailedSignatureRef.current = "";
      if (submitError) setSubmitError(null);
    },
    [banks, submitError],
  );

  const handleContinue = React.useCallback(async () => {
    setSubmitError(null);
    if (!userId) {
      setSubmitError("User not found. Please sign in again.");
      return;
    }
    if (typeof window === "undefined") {
      setSubmitError("Unable to complete onboarding. Please try again.");
      return;
    }

    const bvn = financeDetails.bvn.trim();
    const accountName = financeDetails.accountName.trim();
    const accountCode = financeDetails.accountCode.replace(/\D/g, "");
    const bankCode = financeDetails.bankCode.trim();
    const bankName = financeDetails.bankName.trim();

    if (bvn.length !== BVN_LENGTH) {
      setSubmitError(`BVN must be exactly ${BVN_LENGTH} digits.`);
      return;
    }

    if (!bankCode || !bankName) {
      setSubmitError("Please select your bank.");
      return;
    }

    if (accountCode.length !== ACCOUNT_NUMBER_LENGTH) {
      setSubmitError(
        `Account number must be exactly ${ACCOUNT_NUMBER_LENGTH} digits.`,
      );
      return;
    }

    const resolveSignature = `${bankCode}:${accountCode}`;
    if (
      !isAccountResolved ||
      !accountName ||
      lastResolvedSignatureRef.current !== resolveSignature
    ) {
      setSubmitError(
        "Please resolve your account number to verify the account holder name.",
      );
      return;
    }

    if (!acceptedTerms) {
      setSubmitError(
        "Please confirm that you have read and accepted the terms and conditions.",
      );
      return;
    }

    sessionStorage.setItem(
      "landlordOnboardingFinance",
      JSON.stringify({
        ...financeDetails,
        bvn,
        accountCode,
        accountName,
        bankCode,
        bankName,
      }),
    );

    const detailsRaw = sessionStorage.getItem("landlordOnboardingDetails");
    const documentIdsRaw = sessionStorage.getItem(
      "landlordOnboardingDocumentIds",
    );
    const profilePictureId = sessionStorage.getItem(
      "landlordOnboardingProfilePictureId",
    );

    if (!detailsRaw) {
      setSubmitError("Please complete your account details first.");
      await router.push("/onboarding/landlord/details");
      return;
    }

    const details = JSON.parse(detailsRaw) as {
      businessName: string;
      address: string;
      phoneNumber: string;
      country: string;
      state: string;
      city: string;
      postalCode: string;
    };

    if (
      !details.businessName ||
      !details.address ||
      !details.phoneNumber ||
      !details.city ||
      !details.state ||
      !details.postalCode ||
      !details.country
    ) {
      setSubmitError("Please complete all required account details.");
      await router.push("/onboarding/landlord/details");
      return;
    }

    setIsSubmitting(true);
    const docIds = documentIdsRaw
      ? (JSON.parse(documentIdsRaw) as Partial<Record<string, string>>)
      : {};
    const requiredDocumentFields = [
      docIds.governmentId,
      docIds.landSurvey,
      docIds.proofOfOwnership,
      docIds.tin,
    ];
    if (requiredDocumentFields.some((id) => !id)) {
      setSubmitError("Please upload all required verification documents.");
      await router.push("/onboarding/landlord/documents");
      setIsSubmitting(false);
      return;
    }

    const requiredDocIds = {
      governmentId: docIds.governmentId as string,
      landSurvey: docIds.landSurvey as string,
      proofOfOwnership: docIds.proofOfOwnership as string,
      tin: docIds.tin as string,
    };

    const payload = {
      userId,
      businessName: details.businessName,
      businessEmail: userEmail,
      businessPhoneNumber: details.phoneNumber.trim(),
      profilePictureId: profilePictureId || undefined,
      govermentIdDocumentId: requiredDocIds.governmentId,
      landSurveyDocumentId: requiredDocIds.landSurvey,
      proofOfOwnershipDocumentId: requiredDocIds.proofOfOwnership,
      taxIdentificationNumberDocumentId: requiredDocIds.tin,
      address: {
        address: details.address,
        city: details.city,
        state: details.state,
        postalCode: details.postalCode,
        country: details.country,
      },
      bankAccount: {
        accountName,
        accountNumber: accountCode,
        bankName,
        bankCode,
        bvn,
      },
    };

    const result = await createLandlord(payload);
    if (!result.success) {
      setSubmitError(result.error || "Failed to complete onboarding.");
      showToast(result.error || "Failed to complete onboarding", "error");
      setIsSubmitting(false);
      return;
    }

    let landlordId = result.data?.id ? String(result.data.id) : "";
    if (!landlordId && userId) {
      const landlordResult = await getLandlordByUser(userId);
      if (landlordResult.success && landlordResult.data?.id) {
        landlordId = String(landlordResult.data.id);
      }
    }

    if (landlordId) {
      persistLandlordId(landlordId);
      try {
        await ensureLandlordWallet(landlordId, "NGN");
      } catch (err) {
        console.warn("Ensure landlord wallet failed:", err);
      }
    }

    sessionStorage.removeItem("landlordOnboardingDetails");
    sessionStorage.removeItem("landlordOnboardingDocumentIds");
    sessionStorage.removeItem("landlordOnboardingProfilePictureId");
    sessionStorage.removeItem("landlordOnboardingFinance");

    await router.push("/onboarding/landlord/complete");
    setIsSubmitting(false);
  }, [
    acceptedTerms,
    financeDetails,
    isAccountResolved,
    persistLandlordId,
    router,
    showToast,
    userEmail,
    userId,
  ]);

  return (
    <>
      <Head>
        <title>DWELLA NG · Financial Information</title>
      </Head>

      <div className="w-full max-w-4xl mx-auto">
        <nav className="mb-6 sm:mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-0 relative">
          <div className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-start">
            <Image
              src={logo}
              alt="DWELLA NG logo"
              width={32}
              height={32}
              className="object-contain"
            />
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-brand-main">DWELLA</span>
              <span className="text-lg font-bold text-blue-400">NG</span>
            </div>
          </div>

          <div className="w-full sm:w-auto sm:absolute sm:left-1/2 sm:-translate-x-1/2">
            <SignUpProgress currentStep={3} steps={landlordFlowSteps} />
          </div>

          <div className="hidden sm:block w-[200px]"></div>
        </nav>

        <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            Financial Information
          </h1>
          <p className="mb-6 text-sm text-gray-600">
            Provide bank details for receiving payments.
          </p>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                BVN
              </label>
              <input
                name="bvn"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                maxLength={BVN_LENGTH}
                value={financeDetails.bvn}
                onChange={handleChange}
                placeholder="Enter 11-digit BVN"
                className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
              />
              <FieldCounter
                current={financeDetails.bvn.length}
                max={BVN_LENGTH}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Bank
                </label>
                <select
                  value={financeDetails.bankCode}
                  disabled={banksLoading}
                  onChange={handleBankChange}
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent disabled:bg-gray-100"
                >
                  <option value="">Select bank</option>
                  {banks.map((bank, index) => {
                    const code = bankOptionCode(bank);
                    const name = bankOptionName(bank, index);
                    return (
                      <option key={`${code}-${index}`} value={code}>
                        {name}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Account Number
                </label>
                <input
                  name="accountCode"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={ACCOUNT_NUMBER_LENGTH}
                  value={financeDetails.accountCode}
                  onChange={handleChange}
                  placeholder="Enter account number"
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
                />
                <FieldCounter
                  current={financeDetails.accountCode.replace(/\D/g, "").length}
                  max={ACCOUNT_NUMBER_LENGTH}
                />
              </div>
            </div>

            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={handleResolveAccount}
                disabled={resolveLoading || banksLoading}
                className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {resolveLoading ? "Resolving..." : "Resolve Account"}
              </button>
            </div>

            {isAccountResolved && financeDetails.accountName ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/90 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
                  Account holder
                </p>
                <p className="mt-1 text-lg font-semibold text-emerald-950">
                  {financeDetails.accountName}
                </p>
                <p className="mt-2 text-xs text-emerald-800">
                  Account{" "}
                  <span className="font-mono">
                    {financeDetails.accountCode}
                  </span>
                  {financeDetails.bankName ? (
                    <> · {financeDetails.bankName}</>
                  ) : null}
                </p>
              </div>
            ) : resolveLoading ? (
              <p className="text-sm text-gray-500">Verifying account…</p>
            ) : (
              <p className="text-sm text-gray-500">
                Account holder name will appear here after you resolve your
                account number.
              </p>
            )}
          </div>

          <div className="mt-6 rounded-lg bg-blue-50 border border-blue-200 p-4">
            <p className="text-xs text-gray-700">
              <strong>Note:</strong> Double check details to ensure they are
              correct.
            </p>
          </div>

          <label className="mt-4 flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => {
                setAcceptedTerms(e.target.checked);
                if (e.target.checked) setSubmitError(null);
              }}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-main focus:ring-brand-main"
            />
            <span>
              I confirm that I have read and accepted the{" "}
              <Link
                href="/terms"
                target="_blank"
                className="font-semibold text-brand-main underline-offset-4 hover:underline"
              >
                terms and conditions
              </Link>
              .
            </span>
          </label>

          {submitError ? (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {submitError}
            </div>
          ) : null}

          <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-6">
            <button
              type="button"
              onClick={() => router.push("/onboarding/landlord/documents")}
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleContinue}
              disabled={isSubmitting || !acceptedTerms}
              className="rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 flex items-center gap-2"
            >
              {isSubmitting ? (
                "Processing..."
              ) : (
                <>
                  Continue
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

LandlordOnboardingFinancePage.getLayout = (page) => (
  <AuthLayout showImage={false}>{page}</AuthLayout>
);

export default LandlordOnboardingFinancePage;
