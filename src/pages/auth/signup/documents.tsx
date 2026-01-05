import * as React from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Image from "next/image";
import { Upload } from "lucide-react";
import Link from "next/link";

import { AuthLayout } from "@/components/AuthLayout";
import { SignUpProgress } from "@/components/SignUpProgress";
import logo from "@/assets/logo.png";

import type { NextPageWithLayout } from "../../_app";

type DocumentType = "governmentId" | "landSurvey" | "proofOfOwnership" | "tin";

type DocumentFile = {
  file: File | null;
  preview: string | null;
};

const SignUpDocumentsPage: NextPageWithLayout = () => {
  const router = useRouter();
  const [documents, setDocuments] = React.useState<
    Record<DocumentType, DocumentFile>
  >({
    governmentId: { file: null, preview: null },
    landSurvey: { file: null, preview: null },
    proofOfOwnership: { file: null, preview: null },
    tin: { file: null, preview: null },
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleFileChange = React.useCallback(
    (type: DocumentType, e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setDocuments((prev) => ({
            ...prev,
            [type]: { file, preview: reader.result as string },
          }));
        };
        reader.readAsDataURL(file);
      }
    },
    []
  );

  const handleContinue = React.useCallback(async () => {
    setIsSubmitting(true);
    // Mock API call
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Store documents in sessionStorage
    sessionStorage.setItem("signupDocuments", JSON.stringify(documents));

    // Navigate to step 3
    router.push("/auth/signup/complete");
    setIsSubmitting(false);
  }, [documents, router]);

  const documentSections = [
    {
      type: "governmentId" as DocumentType,
      title: "Government Issued ID",
      description: "Driver's License, National ID, or International Passport",
      required: true,
    },
    {
      type: "landSurvey" as DocumentType,
      title: "Land Survey Document",
      description: "Property map, title deed, or official record",
      required: true,
    },
    {
      type: "proofOfOwnership" as DocumentType,
      title: "Proof of Ownership",
      description: "Document, receipt of purchase, or transfer agreement",
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
        {/* Navigation Bar with Logo and Progress Steps */}
        <nav className="mb-6 sm:mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-0 relative">
          {/* Logo - Far Left */}
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

          {/* Progress Indicator - Centered like Nav Links */}
          <div className="w-full sm:w-auto sm:absolute sm:left-1/2 sm:-translate-x-1/2">
            <SignUpProgress currentStep={2} />
          </div>

          {/* Spacer for right side balance - Hidden on mobile */}
          <div className="hidden sm:block w-[200px]"></div>
        </nav>

        {/* Upload Documents Card */}
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

          {/* Note Section */}
          <div className="mt-6 rounded-lg bg-blue-50 border border-blue-200 p-4">
            <p className="text-xs text-gray-700">
              <strong>Note:</strong> All documents are optional. If uploaded,
              documents should be clear, legible, and in PDF, JPG, or PNG
              format. Maximum file size: 10MB per document.
            </p>
          </div>

          {/* Navigation Buttons */}
          <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-6">
            <button
              type="button"
              onClick={() => router.back()}
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

SignUpDocumentsPage.getLayout = (page) => (
  <AuthLayout showImage={false}>{page}</AuthLayout>
);

export default SignUpDocumentsPage;
