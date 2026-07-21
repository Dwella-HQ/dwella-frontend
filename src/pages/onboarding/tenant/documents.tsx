import * as React from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Image from "next/image";
import { Upload, ArrowRight, Check } from "lucide-react";

import { AuthLayout } from "@/components/AuthLayout";
import { SignUpProgress } from "@/components/SignUpProgress";
import { useToast } from "@/components/Toast";
import { uploadFile } from "@/api/files";
import { patchTenantEntity } from "@/api/tenants";
import { useUser } from "@/contexts/UserContext";
import logo from "@/assets/logo_blue_horizontal.png";

import type { NextPageWithLayout } from "../../_app";
import {
  emptyTenantDetails,
  emptyTenantKyc,
  readJsonSession,
  TENANT_ONBOARDING_KEYS,
  tenantFlowSteps,
  type GovernmentIdType,
  type TenantOnboardingDetails,
  type TenantOnboardingKyc,
} from "@/lib/tenantOnboardingFlow";

const ID_TYPE_OPTIONS: {
  value: Exclude<GovernmentIdType, "">;
  label: string;
}[] = [
  { value: "NATIONAL_ID", label: "National ID" },
  { value: "DRIVER_LICENSE", label: "Driver's License" },
  { value: "PASSPORT", label: "International Passport" },
  { value: "OTHER", label: "Other" },
];

const inputClassName =
  "h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent";

const TenantOnboardingKycPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { showToast } = useToast();
  const { user } = useUser();
  const [kyc, setKyc] = React.useState<TenantOnboardingKyc>(emptyTenantKyc);
  const [fileName, setFileName] = React.useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [isUploading, setIsUploading] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const details = sessionStorage.getItem(TENANT_ONBOARDING_KEYS.details);
    if (!details) {
      void router.replace("/onboarding/tenant/details");
      return;
    }
    const stored = readJsonSession<TenantOnboardingKyc>(
      TENANT_ONBOARDING_KEYS.kyc,
    );
    if (stored) setKyc({ ...emptyTenantKyc, ...stored });
  }, [router]);

  const governmentSectionDone = Boolean(
    kyc.idType && kyc.idNumber.trim() && kyc.governmentIdDocumentId,
  );

  const persistKyc = React.useCallback((next: TenantOnboardingKyc) => {
    setKyc(next);
    sessionStorage.setItem(TENANT_ONBOARDING_KEYS.kyc, JSON.stringify(next));
  }, []);

  const handleUpload = React.useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (file.size > 5 * 1024 * 1024) {
        showToast("ID document must be 5MB or less", "error");
        return;
      }

      setFileName(file.name);
      setIsUploading(true);
      setUploadProgress(0);

      const result = await uploadFile({
        file,
        folder: "tenant",
        label: "governmentId",
        token: user?.token,
        onProgress: setUploadProgress,
      });

      if (result.success) {
        persistKyc({ ...kyc, governmentIdDocumentId: result.data.id });
      } else {
        showToast(result.error || "Failed to upload document", "error");
      }

      setIsUploading(false);
      event.target.value = "";
    },
    [kyc, persistKyc, showToast, user?.token],
  );

  const handleContinue = React.useCallback(async () => {
    setIsSubmitting(true);
    sessionStorage.setItem(TENANT_ONBOARDING_KEYS.kyc, JSON.stringify(kyc));

    const details =
      readJsonSession<TenantOnboardingDetails>(TENANT_ONBOARDING_KEYS.details) ??
      emptyTenantDetails;
    const tenantId =
      (typeof window !== "undefined" && localStorage.getItem("tenantId")) ||
      sessionStorage.getItem(TENANT_ONBOARDING_KEYS.inviteTenantId) ||
      "";

    if (tenantId) {
      const patchBody: Record<string, unknown> = {
        idType: kyc.idType || undefined,
        idNumber: kyc.idNumber.trim() || undefined,
        idDocumentId: kyc.governmentIdDocumentId || undefined,
        employerName: details.occupation.trim() || undefined,
        isEmployed: Boolean(details.occupation.trim()),
        nextOfKinDetails: {
          fullName: details.emergencyContactName.trim(),
          relationship: details.emergencyContactRelationship || "Other",
          contactNumber: details.emergencyContactPhone.trim(),
        },
      };

      const result = await patchTenantEntity(tenantId, patchBody);
      if (!result.success) {
        showToast(
          result.error ||
            "Could not save verification details yet. You can continue.",
          "warning",
        );
      }
    }

    await router.push("/onboarding/tenant/complete");
    setIsSubmitting(false);
  }, [kyc, router, showToast]);

  return (
    <>
      <Head>
        <title>Dwelliva · KYC · Upload Documents</title>
      </Head>

      <div className="mx-auto w-full max-w-4xl">
        <nav className="relative mb-6 flex flex-col items-center justify-between gap-4 sm:mb-8 sm:flex-row sm:gap-0">
          <div className="flex w-full items-center justify-center gap-2 sm:w-auto sm:justify-start">
            <Image
              src={logo}
              alt="Dwelliva logo"
              width={170}
              height={40}
              className="h-8 w-auto object-contain"
            />
          </div>
          <div className="w-full sm:absolute sm:left-1/2 sm:w-auto sm:-translate-x-1/2">
            <SignUpProgress currentStep={2} steps={tenantFlowSteps} />
          </div>
          <div className="hidden w-[200px] sm:block" />
        </nav>

        <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="mb-2 text-center text-3xl font-bold text-gray-900">
            Upload Documents
          </h1>
          <p className="mb-6 text-center text-sm text-gray-600">
            Provide the necessary documents to verify Ownership
          </p>

          <section className="rounded-lg border border-gray-200 p-5">
            <div className="mb-4 flex items-start justify-between gap-3">
              <h2 className="text-base font-semibold text-gray-900">
                Government ID Verification
              </h2>
              {governmentSectionDone ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                  <Check className="h-3.5 w-3.5" aria-hidden />
                  Done
                </span>
              ) : null}
            </div>

            <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  ID Type
                </label>
                <select
                  value={kyc.idType}
                  onChange={(e) =>
                    persistKyc({
                      ...kyc,
                      idType: e.target.value as GovernmentIdType,
                    })
                  }
                  className={inputClassName}
                >
                  <option value="">Select ID type</option>
                  {ID_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  ID Number
                </label>
                <input
                  value={kyc.idNumber}
                  onChange={(e) =>
                    persistKyc({ ...kyc, idNumber: e.target.value })
                  }
                  placeholder="Placeholder"
                  className={inputClassName}
                />
              </div>
            </div>

            <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-10 text-center transition hover:border-brand-main hover:bg-blue-50/40">
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={handleUpload}
              />
              <Upload className="mb-3 h-8 w-8 text-gray-400" aria-hidden />
              <p className="text-sm font-medium text-gray-700">
                {fileName ||
                  (kyc.governmentIdDocumentId
                    ? "Document uploaded"
                    : "Click to upload ID documents")}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                PNG, JPG, PDF up to 5MB
              </p>
              {isUploading ? (
                <p className="mt-2 text-xs text-gray-500">
                  Uploading… {uploadProgress}%
                </p>
              ) : null}
              {!isUploading && kyc.governmentIdDocumentId ? (
                <p className="mt-2 text-xs text-green-600">Uploaded</p>
              ) : null}
            </label>
          </section>

          <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <p className="text-xs text-gray-700">
              <strong>Note:</strong> All documents are optional. If uploaded,
              documents should be clear, legible, and in PDF, JPG, or PNG
              format. Maximum file size 10MB per document.
            </p>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-6">
            <button
              type="button"
              onClick={() => router.push("/onboarding/tenant/details")}
              className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleContinue}
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
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

TenantOnboardingKycPage.getLayout = (page) => (
  <AuthLayout showImage={false}>{page}</AuthLayout>
);

export default TenantOnboardingKycPage;
