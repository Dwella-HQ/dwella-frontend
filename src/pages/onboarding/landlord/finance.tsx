import * as React from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Image from "next/image";
import { ArrowRight, Check, Upload } from "lucide-react";

import { AuthLayout } from "@/components/AuthLayout";
import { SignUpProgress } from "@/components/SignUpProgress";
import { useToast } from "@/components/Toast";
import {
  createLandlord,
  createLandlordKyb,
  getLandlordByUser,
  initiateLandlordVerification,
  updateLandlordProfileSettings,
} from "@/api/landlord";
import { createUserKyc, updateUserKyc } from "@/api/user";
import type { ClientIdType } from "@/api/user";
import { uploadFile } from "@/api/files";
import { ensureLandlordWallet } from "@/api/wallet";
import { useUser } from "@/contexts/UserContext";
import logo from "@/assets/logo_blue_horizontal.png";

import type { NextPageWithLayout } from "../../_app";
import {
  clearLandlordOnboardingSession,
  emptyLandlordDetails,
  emptyLandlordKyc,
  emptyLandlordKyb,
  LANDLORD_ONBOARDING_KEYS,
  landlordFlowSteps,
  readJsonSession,
  type LandlordOnboardingDetails,
  type LandlordOnboardingKyc,
  type LandlordOnboardingKyb,
} from "@/lib/landlordOnboardingFlow";

const inputClassName =
  "h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent";

type UploadKey =
  | "cacCertificateId"
  | "taxRegulatoryDocumentId"
  | "proofOfBusinessAddressId";

const LandlordOnboardingKybPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { showToast } = useToast();
  const { user } = useUser();
  const userId = user?.id ? String(user.id) : null;
  const userEmail = user?.email ?? "";

  const [kyb, setKyb] = React.useState<LandlordOnboardingKyb>(emptyLandlordKyb);
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
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const persistLandlordId = React.useCallback((landlordId: string) => {
    if (typeof window === "undefined" || !landlordId) return;
    localStorage.setItem("landlordId", landlordId);
    const maxAge = 60 * 60 * 24 * 7;
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `landlordId=${encodeURIComponent(landlordId)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
  }, []);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const details = sessionStorage.getItem(LANDLORD_ONBOARDING_KEYS.details);
    if (!details) {
      void router.replace("/onboarding/landlord/details");
      return;
    }
    const stored = readJsonSession<LandlordOnboardingKyb>(
      LANDLORD_ONBOARDING_KEYS.kyb,
    );
    if (stored) setKyb({ ...emptyLandlordKyb, ...stored });
  }, [router]);

  const persistKyb = React.useCallback((next: LandlordOnboardingKyb) => {
    setKyb(next);
    sessionStorage.setItem(LANDLORD_ONBOARDING_KEYS.kyb, JSON.stringify(next));
  }, []);

  const businessSectionDone = Boolean(
    kyb.isBusiness &&
      kyb.businessName.trim() &&
      kyb.businessAddress.trim() &&
      kyb.cacCertificateId &&
      kyb.taxRegulatoryDocumentId &&
      kyb.proofOfBusinessAddressId,
  );

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
        folder: "landlord",
        label,
        token: user?.token,
        onProgress: (percent) =>
          setUploadProgress((prev) => ({ ...prev, [key]: percent })),
      });

      if (result.success) {
        persistKyb({ ...kyb, [key]: result.data.id });
      } else {
        showToast(result.error || "Failed to upload document", "error");
      }

      setIsUploading((prev) => ({ ...prev, [key]: false }));
      event.target.value = "";
    },
    [kyb, persistKyb, showToast, user?.token],
  );

  const handleContinue = React.useCallback(async () => {
    setSubmitError(null);

    if (kyb.isBusiness === null) {
      setSubmitError("Please select whether you are a business.");
      return;
    }

    if (!userId) {
      setSubmitError("User not found. Please sign in again.");
      return;
    }

    const details =
      readJsonSession<LandlordOnboardingDetails>(
        LANDLORD_ONBOARDING_KEYS.details,
      ) ?? emptyLandlordDetails;
    const kyc =
      readJsonSession<LandlordOnboardingKyc>(LANDLORD_ONBOARDING_KEYS.kyc) ??
      emptyLandlordKyc;
    const profilePictureId = sessionStorage.getItem(
      LANDLORD_ONBOARDING_KEYS.profilePictureId,
    );

    if (
      !details.firstName ||
      !details.lastName ||
      !details.phoneNumber ||
      !details.address ||
      !details.city ||
      !details.state ||
      !details.country
    ) {
      setSubmitError("Please complete all required account details.");
      await router.push("/onboarding/landlord/details");
      return;
    }

    if (!kyc.idType || !kyc.tinNumber.trim()) {
      setSubmitError("Please complete KYC (I.D. type and TIN number).");
      await router.push("/onboarding/landlord/documents");
      return;
    }

    if (!userEmail) {
      setSubmitError("Account email is missing. Please sign in again.");
      return;
    }

    if (kyb.isBusiness) {
      if (!kyb.businessName.trim() || !kyb.businessAddress.trim()) {
        setSubmitError("Please provide your business name and address.");
        return;
      }
      if (!kyb.cacCertificateId) {
        setSubmitError("Please upload your CAC certificate.");
        return;
      }
      if (!profilePictureId) {
        setSubmitError(
          "Please upload a profile photo on the details step — it is used as your business logo.",
        );
        return;
      }
    }

    sessionStorage.setItem(LANDLORD_ONBOARDING_KEYS.kyb, JSON.stringify(kyb));
    setIsSubmitting(true);

    const fullName =
      `${details.firstName.trim()} ${details.lastName.trim()}`.trim();
    const displayName = kyb.isBusiness ? kyb.businessName.trim() : fullName;
    const addressPayload = {
      address: kyb.isBusiness
        ? kyb.businessAddress.trim() || details.address.trim()
        : details.address.trim(),
      city: details.city.trim(),
      state: details.state.trim(),
      postalCode: "",
      country: details.country.trim(),
    };

    // 1) Create landlord shell (OpenAPI: userId only)
    let landlordId = "";
    const createResult = await createLandlord({ userId });
    if (createResult.success && createResult.data?.id) {
      landlordId = String(createResult.data.id);
    } else {
      // Already exists, or create returned an empty body — resolve by user.
      const landlordResult = await getLandlordByUser(userId);
      if (landlordResult.success && landlordResult.data?.id) {
        landlordId = String(landlordResult.data.id);
      } else if (!createResult.success) {
        setSubmitError(
          createResult.error || "Could not create your landlord profile.",
        );
        showToast(createResult.error || "Failed to complete onboarding", "error");
        setIsSubmitting(false);
        return;
      }
    }

    if (!landlordId) {
      setSubmitError("Landlord profile was created but no ID was returned.");
      showToast("Failed to complete onboarding", "error");
      setIsSubmitting(false);
      return;
    }

    persistLandlordId(landlordId);

    // 2) Profile (name / phone / address)
    const profileResult = await updateLandlordProfileSettings(landlordId, {
      businessName: displayName,
      businessEmail: userEmail,
      businessPhoneNumber: details.phoneNumber.trim(),
      address: addressPayload,
    });
    if (!profileResult.success) {
      console.warn("Landlord profile update failed:", profileResult.error);
      showToast(
        profileResult.error ||
          "Landlord created, but profile details could not be saved.",
        "warning",
      );
    }

    // 3) User KYC
    const kycBody = {
      userId,
      idType: kyc.idType as ClientIdType,
      tinNumber: kyc.tinNumber.trim(),
      idNumber: kyc.idNumber.trim() || undefined,
      idDocumentId: kyc.governmentIdDocumentId || undefined,
      proofOfAddressDocumentId: kyc.proofOfAddressDocumentId || undefined,
      tinDocumentId: kyc.tinDocumentId || undefined,
    };
    const kycCreate = await createUserKyc(userId, kycBody);
    if (!kycCreate.success) {
      const status = kycCreate.statusCode;
      if (status === 409 || status === 400) {
        const kycUpdate = await updateUserKyc(userId, {
          idType: kycBody.idType,
          tinNumber: kycBody.tinNumber,
          idNumber: kycBody.idNumber,
          idDocumentId: kycBody.idDocumentId,
          proofOfAddressDocumentId: kycBody.proofOfAddressDocumentId,
          tinDocumentId: kycBody.tinDocumentId,
        });
        if (!kycUpdate.success) {
          setSubmitError(kycUpdate.error || "Could not save KYC details.");
          showToast(kycUpdate.error || "Failed to save KYC", "error");
          setIsSubmitting(false);
          return;
        }
      } else {
        setSubmitError(kycCreate.error || "Could not save KYC details.");
        showToast(kycCreate.error || "Failed to save KYC", "error");
        setIsSubmitting(false);
        return;
      }
    }

    // 4) Business KYB (only when landlord is a business)
    if (kyb.isBusiness && profilePictureId && kyb.cacCertificateId) {
      const kybResult = await createLandlordKyb(landlordId, {
        businessName: kyb.businessName.trim(),
        businessEmail: userEmail,
        businessPhoneNumber: details.phoneNumber.trim(),
        businessLogoId: profilePictureId,
        businessCacCertificateId: kyb.cacCertificateId,
        businessAddress: {
          address: kyb.businessAddress.trim(),
          city: details.city.trim(),
          state: details.state.trim(),
          postalCode: "",
          country: details.country.trim(),
        },
        businessTinCertificateId: kyb.taxRegulatoryDocumentId || undefined,
        businessTinNumber: kyc.tinNumber.trim() || undefined,
        businessProofOfAddressId: kyb.proofOfBusinessAddressId || undefined,
      });
      if (!kybResult.success) {
        setSubmitError(kybResult.error || "Could not save business KYB.");
        showToast(kybResult.error || "Failed to save KYB", "error");
        setIsSubmitting(false);
        return;
      }
    }

    try {
      await ensureLandlordWallet(landlordId, "NGN");
    } catch (err) {
      console.warn("Ensure landlord wallet failed:", err);
    }

    try {
      const verifyResult = await initiateLandlordVerification(landlordId);
      if (!verifyResult.success) {
        console.warn("Initiate landlord verification failed:", verifyResult.error);
      }
    } catch (err) {
      console.warn("Initiate landlord verification failed:", err);
    }

    clearLandlordOnboardingSession();
    await router.push("/onboarding/landlord/complete");
    setIsSubmitting(false);
  }, [
    kyb,
    persistLandlordId,
    router,
    showToast,
    userEmail,
    userId,
  ]);

  return (
    <>
      <Head>
        <title>Dwelliva · KYB · Business Verification</title>
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
            <SignUpProgress currentStep={3} steps={landlordFlowSteps} />
          </div>
          <div className="hidden w-[200px] sm:block" />
        </nav>

        <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="mb-2 text-center text-2xl font-bold text-gray-900">
            Are You a Business?
          </h1>
          <p className="mb-6 text-center text-sm text-gray-600">
            Verify as a business for a better, more Optimised Experience.
          </p>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => persistKyb({ ...kyb, isBusiness: true })}
              className={`flex w-full items-center gap-3 rounded-lg border px-4 py-4 text-left transition ${
                kyb.isBusiness === true
                  ? "border-brand-main bg-blue-50/60"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                  kyb.isBusiness === true
                    ? "border-brand-main"
                    : "border-gray-300"
                }`}
              >
                {kyb.isBusiness === true ? (
                  <span className="h-2.5 w-2.5 rounded-full bg-brand-main" />
                ) : null}
              </span>
              <span className="text-sm font-medium text-gray-900">
                Yes I am a business
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                persistKyb({
                  ...kyb,
                  isBusiness: false,
                  businessName: "",
                  businessAddress: "",
                })
              }
              className={`flex w-full items-center gap-3 rounded-lg border px-4 py-4 text-left transition ${
                kyb.isBusiness === false
                  ? "border-brand-main bg-blue-50/60"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                  kyb.isBusiness === false
                    ? "border-brand-main"
                    : "border-gray-300"
                }`}
              >
                {kyb.isBusiness === false ? (
                  <span className="h-2.5 w-2.5 rounded-full bg-brand-main" />
                ) : null}
              </span>
              <span className="text-sm font-medium text-gray-900">
                No i am not a business
              </span>
            </button>
          </div>

          {kyb.isBusiness === true ? (
            <section className="mt-6 rounded-lg border border-gray-200 p-5">
              <div className="mb-4 flex items-start justify-between gap-3">
                <h2 className="text-base font-semibold text-gray-900">
                  Business Verification
                </h2>
                {businessSectionDone ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                    <Check className="h-3.5 w-3.5" aria-hidden />
                    Done
                  </span>
                ) : null}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Full Business Name
                  </label>
                  <input
                    value={kyb.businessName}
                    onChange={(e) =>
                      persistKyb({ ...kyb, businessName: e.target.value })
                    }
                    placeholder="Okafor Properties Ltd"
                    className={inputClassName}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Business Address
                  </label>
                  <input
                    value={kyb.businessAddress}
                    onChange={(e) =>
                      persistKyb({ ...kyb, businessAddress: e.target.value })
                    }
                    placeholder="15 Adeola Odeku St, Victoria Island"
                    className={inputClassName}
                  />
                </div>

                {(
                  [
                    {
                      key: "cacCertificateId" as const,
                      title: "Business CAC Certificate",
                      label: "cacCertificate",
                      description: null,
                    },
                    {
                      key: "taxRegulatoryDocumentId" as const,
                      title: "Tax & Regulatory Documents",
                      label: "taxRegulatory",
                      description: "Tax certificate or TIN document.",
                    },
                    {
                      key: "proofOfBusinessAddressId" as const,
                      title: "Proof Of Business Address",
                      label: "proofOfBusinessAddress",
                      description: "Utility Bill, or Lease Agreement",
                    },
                  ] as const
                ).map((field) => (
                  <div
                    key={field.key}
                    className="flex flex-col gap-3 rounded-lg border border-gray-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {field.title}
                      </p>
                      {field.description ? (
                        <p className="text-xs text-gray-500">
                          {field.description}
                        </p>
                      ) : null}
                      {fileNames[field.key] ? (
                        <p className="mt-1 text-xs text-gray-600">
                          {fileNames[field.key]}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2">
                      {kyb[field.key] ? (
                        <Check
                          className="h-5 w-5 text-emerald-600"
                          aria-hidden
                        />
                      ) : (
                        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-brand-main/20 bg-blue-50 px-3 py-2 text-sm font-medium text-brand-main hover:bg-blue-100">
                          <Upload className="h-4 w-4" aria-hidden />
                          Choose File
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="hidden"
                            onChange={(e) =>
                              handleUpload(e, field.key, field.label)
                            }
                          />
                        </label>
                      )}
                      {isUploading[field.key] ? (
                        <span className="text-xs text-gray-500">
                          {uploadProgress[field.key] || 0}%
                        </span>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {submitError ? (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {submitError}
            </div>
          ) : null}

          <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-6">
            <button
              type="button"
              onClick={() => router.push("/onboarding/landlord/documents")}
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

LandlordOnboardingKybPage.getLayout = (page) => (
  <AuthLayout showImage={false}>{page}</AuthLayout>
);

export default LandlordOnboardingKybPage;
