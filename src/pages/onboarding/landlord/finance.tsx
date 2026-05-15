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
import { useUser } from "@/contexts/UserContext";
import logo from "@/assets/logo.png";

import type { NextPageWithLayout } from "../../_app";

const landlordFlowSteps = [
  { number: 1, label: "Your Details", icon: User },
  { number: 2, label: "Documents", icon: FileText },
  { number: 3, label: "Finance", icon: Landmark },
  { number: 4, label: "First Property", icon: Home },
];

type LandlordFinanceDetails = {
  bvn: string;
  bankName: string;
  accountCode: string;
  accountName: string;
};

const emptyFinanceDetails: LandlordFinanceDetails = {
  bvn: "",
  bankName: "",
  accountCode: "",
  accountName: "",
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

  const persistLandlordId = React.useCallback((landlordId: string) => {
    if (typeof window === "undefined" || !landlordId) return;
    localStorage.setItem("landlordId", landlordId);
    const maxAge = 60 * 60 * 24 * 7;
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `landlordId=${encodeURIComponent(landlordId)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
  }, []);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = sessionStorage.getItem("landlordOnboardingFinance");
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as Partial<LandlordFinanceDetails>;
      setFinanceDetails({
        bvn: parsed.bvn ?? "",
        bankName: parsed.bankName ?? "",
        accountCode:
          parsed.accountCode ??
          (parsed as Partial<{ accountNumber: string }>).accountNumber ??
          "",
        accountName: parsed.accountName ?? "",
      });
    } catch {
      setFinanceDetails(emptyFinanceDetails);
    }
  }, []);

  const handleChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = event.target;
      setFinanceDetails((prev) => ({ ...prev, [name]: value }));
    },
    [],
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

    const hasRequiredFields =
      financeDetails.bvn.trim().length > 0 &&
      financeDetails.bankName.trim().length > 0 &&
      financeDetails.accountCode.trim().length > 0 &&
      financeDetails.accountName.trim().length > 0;
    if (!hasRequiredFields) {
      setSubmitError("Please complete all financial details.");
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
      JSON.stringify(financeDetails),
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
        accountName: financeDetails.accountName.trim(),
        accountCode: financeDetails.accountCode.trim(),
        bankName: financeDetails.bankName.trim(),
        bvn: financeDetails.bvn.trim(),
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
          <h1 className="mb-1 text-2xl font-bold text-gray-900 text-center">
            Financial Information
          </h1>
          <p className="mb-6 text-sm text-gray-600 text-center">
            Provide bank details for receiving payments.
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                BVN
              </label>
              <input
                name="bvn"
                value={financeDetails.bvn}
                onChange={handleChange}
                placeholder="Enter BVN"
                className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Bank Name
              </label>
              <input
                name="bankName"
                value={financeDetails.bankName}
                onChange={handleChange}
                placeholder="Enter bank name"
                className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Account Code
              </label>
              <input
                name="accountCode"
                value={financeDetails.accountCode}
                onChange={handleChange}
                placeholder="Enter account code"
                className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Account Name
              </label>
              <input
                name="accountName"
                value={financeDetails.accountName}
                onChange={handleChange}
                placeholder="Enter account name"
                className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
              />
            </div>
          </div>

          <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
            <span className="font-semibold">Note:</span> Double check details to
            ensure they are correct.
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
