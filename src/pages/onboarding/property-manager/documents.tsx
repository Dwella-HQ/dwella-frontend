import * as React from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Image from "next/image";
import { Upload, ArrowRight, Check } from "lucide-react";

import { AuthLayout } from "@/components/AuthLayout";
import { SignUpProgress } from "@/components/SignUpProgress";
import { useToast } from "@/components/Toast";
import { uploadFile } from "@/api/files";
import { useUser } from "@/contexts/UserContext";
import logo from "@/assets/logo_blue_horizontal.png";

import type { NextPageWithLayout } from "../../_app";
import {
  emptyPropertyManagerKyc,
  PM_ONBOARDING_KEYS,
  propertyManagerFlowSteps,
  readJsonSession,
  type GovernmentIdType,
  type PropertyManagerOnboardingKyc,
} from "@/lib/propertyManagerOnboardingFlow";

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
  "h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-brand-main";

type UploadKey =
  | "governmentIdDocumentId"
  | "tinDocumentId"
  | "proofOfAddressDocumentId";

const PropertyManagerOnboardingKycPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { showToast } = useToast();
  const { user } = useUser();
  const [kyc, setKyc] = React.useState<PropertyManagerOnboardingKyc>(
    emptyPropertyManagerKyc,
  );
  const [fileNames, setFileNames] = React.useState<
    Partial<Record<UploadKey, string>>
  >({});
  const [uploadProgress, setUploadProgress] = React.useState<
    Partial<Record<UploadKey, number>>
  >({});
  const [isUploading, setIsUploading] = React.useState<
    Partial<Record<UploadKey, boolean>>
  >({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const details = sessionStorage.getItem(PM_ONBOARDING_KEYS.details);
    if (!details) {
      void router.replace("/onboarding/property-manager/details");
      return;
    }
    const stored = readJsonSession<PropertyManagerOnboardingKyc>(
      PM_ONBOARDING_KEYS.kyc,
    );
    if (stored) setKyc({ ...emptyPropertyManagerKyc, ...stored });
  }, [router]);

  const governmentSectionDone = Boolean(
    kyc.idType && kyc.idNumber.trim() && kyc.governmentIdDocumentId,
  );
  const otherSectionDone = Boolean(
    kyc.tinDocumentId && kyc.proofOfAddressDocumentId,
  );

  const persistKyc = React.useCallback((next: PropertyManagerOnboardingKyc) => {
    setKyc(next);
    sessionStorage.setItem(PM_ONBOARDING_KEYS.kyc, JSON.stringify(next));
  }, []);

  const handleUpload = React.useCallback(
    async (
      event: React.ChangeEvent<HTMLInputElement>,
      key: UploadKey,
      label: string,
    ) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (file.size > 10 * 1024 * 1024) {
        showToast("File must be 10MB or less", "error");
        return;
      }

      setFileNames((prev) => ({ ...prev, [key]: file.name }));
      setIsUploading((prev) => ({ ...prev, [key]: true }));
      setUploadProgress((prev) => ({ ...prev, [key]: 0 }));

      const result = await uploadFile({
        file,
        folder: "property-manager",
        label,
        token: user?.token,
        onProgress: (percent) =>
          setUploadProgress((prev) => ({ ...prev, [key]: percent })),
      });

      if (result.success) {
        persistKyc({ ...kyc, [key]: result.data.id });
      } else {
        showToast(result.error || "Failed to upload document", "error");
      }

      setIsUploading((prev) => ({ ...prev, [key]: false }));
      event.target.value = "";
    },
    [kyc, persistKyc, showToast, user?.token],
  );

  const handleContinue = React.useCallback(async () => {
    setIsSubmitting(true);
    sessionStorage.setItem(PM_ONBOARDING_KEYS.kyc, JSON.stringify(kyc));
    // KYC docs are optional — no dedicated property-manager document endpoint yet.
    await router.push("/onboarding/property-manager/complete");
    setIsSubmitting(false);
  }, [kyc, router]);

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
            <SignUpProgress currentStep={2} steps={propertyManagerFlowSteps} />
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

          <div className="space-y-6">
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
                    placeholder="e.g. A12345678"
                    className={inputClassName}
                  />
                </div>
              </div>

              <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-10 text-center transition hover:border-brand-main hover:bg-blue-50/40">
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(e) =>
                    handleUpload(e, "governmentIdDocumentId", "governmentId")
                  }
                />
                <Upload className="mb-3 h-8 w-8 text-gray-400" aria-hidden />
                <p className="text-sm font-medium text-gray-700">
                  {fileNames.governmentIdDocumentId ||
                    (kyc.governmentIdDocumentId
                      ? "Document uploaded"
                      : "Click to upload ID documents")}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  (PNG, JPG, PDF up to 10MB)
                </p>
                {isUploading.governmentIdDocumentId ? (
                  <p className="mt-2 text-xs text-gray-500">
                    Uploading… {uploadProgress.governmentIdDocumentId || 0}%
                  </p>
                ) : null}
                {!isUploading.governmentIdDocumentId &&
                kyc.governmentIdDocumentId ? (
                  <p className="mt-2 text-xs text-green-600">Uploaded</p>
                ) : null}
              </label>
            </section>

            <section className="rounded-lg border border-gray-200 p-5">
              <div className="mb-4 flex items-start justify-between gap-3">
                <h2 className="text-base font-semibold text-gray-900">
                  Other ID Verification
                </h2>
                {otherSectionDone ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                    <Check className="h-3.5 w-3.5" aria-hidden />
                    Done
                  </span>
                ) : null}
              </div>

              <div className="space-y-3">
                <div className="flex flex-col gap-3 rounded-lg border border-gray-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Tax Identification Number (TIN)
                    </p>
                    <p className="text-xs text-gray-500">
                      Tax certificate or TIN document
                    </p>
                    {fileNames.tinDocumentId ? (
                      <p className="mt-1 text-xs text-gray-600">
                        {fileNames.tinDocumentId}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    {kyc.tinDocumentId ? (
                      <Check className="h-5 w-5 text-emerald-600" aria-hidden />
                    ) : (
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-brand-main/20 bg-blue-50 px-3 py-2 text-sm font-medium text-brand-main hover:bg-blue-100">
                        <Upload className="h-4 w-4" aria-hidden />
                        Choose File
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="hidden"
                          onChange={(e) =>
                            handleUpload(e, "tinDocumentId", "tin")
                          }
                        />
                      </label>
                    )}
                    {isUploading.tinDocumentId ? (
                      <span className="text-xs text-gray-500">
                        {uploadProgress.tinDocumentId || 0}%
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-col gap-3 rounded-lg border border-gray-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Proof Of Address
                    </p>
                    <p className="text-xs text-gray-500">
                      Utility bill, water bill or waste bill (issued within last
                      3 months)
                    </p>
                    {fileNames.proofOfAddressDocumentId ? (
                      <p className="mt-1 text-xs text-gray-600">
                        {fileNames.proofOfAddressDocumentId}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    {kyc.proofOfAddressDocumentId ? (
                      <Check className="h-5 w-5 text-emerald-600" aria-hidden />
                    ) : (
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-brand-main/20 bg-blue-50 px-3 py-2 text-sm font-medium text-brand-main hover:bg-blue-100">
                        <Upload className="h-4 w-4" aria-hidden />
                        Choose File
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="hidden"
                          onChange={(e) =>
                            handleUpload(
                              e,
                              "proofOfAddressDocumentId",
                              "proofOfAddress",
                            )
                          }
                        />
                      </label>
                    )}
                    {isUploading.proofOfAddressDocumentId ? (
                      <span className="text-xs text-gray-500">
                        {uploadProgress.proofOfAddressDocumentId || 0}%
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <p className="text-xs text-gray-700">
              <strong>Note:</strong> All documents are optional. If uploaded,
              documents should be clear, legible, and in PDF, JPG, or PNG
              format. Maximum file size: 10MB per document.
            </p>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-6">
            <button
              type="button"
              onClick={() =>
                router.push("/onboarding/property-manager/details")
              }
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

PropertyManagerOnboardingKycPage.getLayout = (page) => (
  <AuthLayout showImage={false}>{page}</AuthLayout>
);

export default PropertyManagerOnboardingKycPage;
