import * as React from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Image from "next/image";
import { Upload } from "lucide-react";

import { AuthLayout } from "@/components/AuthLayout";
import { SignUpProgress } from "@/components/SignUpProgress";
import { useToast } from "@/components/Toast";
import { uploadFile } from "@/api/files";
import { createLandlord, getLandlordByUser } from "@/api/landlord";
import { ensureLandlordWallet } from "@/api/wallet";
import { useUser } from "@/contexts/UserContext";
import logo from "@/assets/logo.png";

import type { NextPageWithLayout } from "../../_app";

type DocumentType = "governmentId" | "tin";

type DocumentFile = {
  file: File | null;
  preview: string | null;
};

const LandlordOnboardingDocumentsPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { showToast } = useToast();
  const { user } = useUser();
  const [documents, setDocuments] = React.useState<
    Record<DocumentType, DocumentFile>
  >({
    governmentId: { file: null, preview: null },
    tin: { file: null, preview: null },
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState<
    Partial<Record<DocumentType, number>>
  >({});
  const [isUploading, setIsUploading] = React.useState<
    Partial<Record<DocumentType, boolean>>
  >({});
  const [documentIds, setDocumentIds] = React.useState<
    Partial<Record<DocumentType, string>>
  >({});
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const persistLandlordId = React.useCallback((landlordId: string) => {
    if (typeof window === "undefined" || !landlordId) return;
    localStorage.setItem("landlordId", landlordId);
    const maxAge = 60 * 60 * 24 * 7;
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `landlordId=${encodeURIComponent(landlordId)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
  }, []);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const storedIds = sessionStorage.getItem("landlordOnboardingDocumentIds");
      if (storedIds) {
        try {
          const parsed = JSON.parse(storedIds) as Partial<
            Record<DocumentType, string>
          >;
          setDocumentIds(parsed);
        } catch {
          setDocumentIds({});
        }
      }
    }
  }, []);

  const handleFileChange = React.useCallback(
    async (type: DocumentType, e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) {
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setDocuments((prev) => ({
          ...prev,
          [type]: { file, preview: reader.result as string },
        }));
      };
      reader.readAsDataURL(file);

      setIsUploading((prev) => ({ ...prev, [type]: true }));
      setUploadProgress((prev) => ({ ...prev, [type]: 0 }));

      const result = await uploadFile({
        file,
        folder: "landlord",
        label: type,
        token: user?.token,
        onProgress: (percent) =>
          setUploadProgress((prev) => ({ ...prev, [type]: percent })),
      });

      if (result.success) {
        setDocumentIds((prev) => {
          const updated = { ...prev, [type]: result.data.id };
          if (typeof window !== "undefined") {
            sessionStorage.setItem(
              "landlordOnboardingDocumentIds",
              JSON.stringify(updated)
            );
          }
          return updated;
        });
      } else {
        showToast(result.error || "Failed to upload document", "error");
      }

      setIsUploading((prev) => ({ ...prev, [type]: false }));
    },
    [showToast, user?.token]
  );

  const handleContinue = React.useCallback(async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    if (!user?.id) {
      setSubmitError("User not found. Please sign in again.");
      setIsSubmitting(false);
      return;
    }

    if (typeof window === "undefined") {
      setSubmitError("Unable to complete onboarding. Please try again.");
      setIsSubmitting(false);
      return;
    }

    const detailsRaw = sessionStorage.getItem("landlordOnboardingDetails");
    const documentIdsRaw = sessionStorage.getItem("landlordOnboardingDocumentIds");
    const profilePictureId = sessionStorage.getItem(
      "landlordOnboardingProfilePictureId"
    );

    if (!detailsRaw) {
      setSubmitError("Please complete your account details first.");
      await router.push("/onboarding/landlord/details");
      setIsSubmitting(false);
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
      !details.city ||
      !details.state ||
      !details.postalCode ||
      !details.country
    ) {
      setSubmitError("Please complete all required account details.");
      await router.push("/onboarding/landlord/details");
      setIsSubmitting(false);
      return;
    }

    const docIds = documentIdsRaw
      ? (JSON.parse(documentIdsRaw) as Partial<Record<string, string>>)
      : {};

    const payload = {
      userId: String(user.id),
      landLordName: details.businessName,
      profilePictureId: profilePictureId || undefined,
      govermentIdDocumentId: docIds.governmentId,
      taxIdentificationNumberDocumentId: docIds.tin,
      address: {
        address: details.address,
        city: details.city,
        state: details.state,
        postalCode: details.postalCode,
        country: details.country,
      },
    };

    console.log("Create landlord payload:", payload);

    const result = await createLandlord(payload);

    console.log("Create landlord response:", result);

    if (!result.success) {
      setSubmitError(result.error || "Failed to complete onboarding.");
      showToast(result.error || "Failed to complete onboarding", "error");
      setIsSubmitting(false);
      return;
    }

    let landlordId = result.data?.id ? String(result.data.id) : "";
    if (!landlordId && user?.id) {
      const landlordResult = await getLandlordByUser(String(user.id));
      if (landlordResult.success && landlordResult.data?.id) {
        landlordId = String(landlordResult.data.id);
      }
    }

    if (typeof window !== "undefined") {
      if (landlordId) {
        persistLandlordId(landlordId);
      }
      sessionStorage.removeItem("landlordOnboardingDetails");
      sessionStorage.removeItem("landlordOnboardingDocumentIds");
      sessionStorage.removeItem("landlordOnboardingProfilePictureId");
    }

    // Ensure the landlord wallet exists immediately after registration.
    // This prevents needing to create the wallet at login time.
    if (typeof window !== "undefined" && landlordId) {
      try {
        await ensureLandlordWallet(landlordId, "NGN");
      } catch (err) {
        console.warn("Ensure landlord wallet failed:", err);
      }
    }

    await router.push("/onboarding/landlord/complete");
    setIsSubmitting(false);
  }, [persistLandlordId, router, showToast, user?.id]);

  const documentSections = [
    {
      type: "governmentId" as DocumentType,
      title: "Government Issued ID",
      description: "Driver's License, National ID, or International Passport",
      required: false,
    },
    {
      type: "tin" as DocumentType,
      title: "Tax Identification Number (TIN)",
      description: "Tax certificate or TIN document",
      required: false,
    },
  ];

  return (
    <>
      <Head>
        <title>DWELLA NG · Upload Documents</title>
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
            <SignUpProgress currentStep={2} />
          </div>

          <div className="hidden sm:block w-[200px]"></div>
        </nav>

        <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            Upload Documents
          </h1>
          <p className="mb-6 text-sm text-gray-600">
            Provide the necessary documents to verify Ownership
          </p>

          <div className="space-y-4">
            {documentSections.map((section) => {
              const doc = documents[section.type];
              const hasFile = doc.file !== null;

              return (
                <div
                  key={section.type}
                  className="rounded-lg border border-gray-200 bg-white p-4"
                >
                  <div className="mb-2">
                    <h3 className="text-sm font-semibold text-gray-900">
                      {section.title}
                    </h3>
                    <p className="mt-1 text-xs text-gray-500">
                      {section.description}
                    </p>
                  </div>
                  <label
                    htmlFor={section.type}
                    className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition cursor-pointer ${
                      hasFile
                        ? "border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200"
                        : section.required
                          ? "border-brand-main bg-blue-50 text-brand-main hover:bg-blue-100"
                          : "border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <Upload className="h-4 w-4" />
                    {hasFile
                      ? doc.file?.name
                      : `Choose File${section.required ? "" : " (Optional)"}`}
                  </label>
                  {isUploading[section.type] && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                      <span>Uploading...</span>
                      <div className="h-1.5 w-28 rounded-full bg-gray-200">
                        <div
                          className="h-1.5 rounded-full bg-brand-main"
                          style={{ width: `${uploadProgress[section.type] || 0}%` }}
                        />
                      </div>
                      <span>{uploadProgress[section.type] || 0}%</span>
                    </div>
                  )}
                  {!isUploading[section.type] && documentIds[section.type] && (
                    <p className="mt-2 text-xs text-green-600">Uploaded</p>
                  )}
                  <input
                    id={section.type}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange(section.type, e)}
                    className="hidden"
                  />
                </div>
              );
            })}
          </div>

          <div className="mt-6 rounded-lg bg-blue-50 border border-blue-200 p-4">
            <p className="text-xs text-gray-700">
              <strong>Note:</strong> All documents are optional. If uploaded,
              documents should be clear, legible, and in PDF, JPG, or PNG
              format. Maximum file size: 10MB per document.
            </p>
          </div>

          {submitError && (
            <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {submitError}
            </div>
          )}

          <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-6">
            <button
              type="button"
              onClick={() => router.push("/onboarding/landlord/details")}
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleContinue}
              disabled={isSubmitting}
              className="rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Processing..." : "Continue >"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

LandlordOnboardingDocumentsPage.getLayout = (page) => (
  <AuthLayout showImage={false}>{page}</AuthLayout>
);

export default LandlordOnboardingDocumentsPage;

