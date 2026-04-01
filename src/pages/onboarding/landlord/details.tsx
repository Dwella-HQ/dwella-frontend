import * as React from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

import { AuthLayout } from "@/components/AuthLayout";
import { SignUpProgress } from "@/components/SignUpProgress";
import { useToast } from "@/components/Toast";
import { uploadFile } from "@/api/files";
import { useUser } from "@/contexts/UserContext";
import { Country, State, City } from "country-state-city";
import { PhoneInputWithCountry } from "@/components/PhoneInputWithCountry";
import logo from "@/assets/logo.png";

import type { NextPageWithLayout } from "../../_app";

type LandlordDetails = {
  businessName: string;
  address: string;
  phoneNumber: string;
  country: string;
  state: string;
  city: string;
  postalCode: string;
};

const emptyDetails: LandlordDetails = {
  businessName: "",
  address: "",
  phoneNumber: "",
  country: "Nigeria",
  state: "",
  city: "",
  postalCode: "",
};

const LandlordOnboardingDetailsPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { showToast } = useToast();
  const { user } = useUser();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [details, setDetails] = React.useState<LandlordDetails>(emptyDetails);
  const [profileUploadProgress, setProfileUploadProgress] = React.useState(0);
  const [isProfileUploading, setIsProfileUploading] = React.useState(false);
  const [profilePictureId, setProfilePictureId] = React.useState<string | null>(
    null,
  );
  const [profilePreview, setProfilePreview] = React.useState<string | null>(
    null,
  );

  const initials = React.useMemo(() => {
    if (!user?.name) {
      return "JD";
    }
    const parts = user.name.trim().split(/\s+/);
    const first = parts[0]?.[0] || "";
    const last = parts.length > 1 ? parts[parts.length - 1]?.[0] || "" : "";
    return `${first}${last}`.toUpperCase() || "JD";
  }, [user?.name]);

  const allCountries = React.useMemo(() => Country.getAllCountries(), []);
  const selectedCountry = React.useMemo(
    () =>
      allCountries.find((country) => country.name === details.country) ??
      allCountries.find((country) => country.name === "Nigeria") ??
      null,
    [allCountries, details.country],
  );

  const statesForCountry = React.useMemo(() => {
    if (!selectedCountry?.isoCode) return [];
    return State.getStatesOfCountry(selectedCountry.isoCode);
  }, [selectedCountry?.isoCode]);

  const selectedState = React.useMemo(
    () =>
      statesForCountry.find((state) => state.name === details.state) ?? null,
    [details.state, statesForCountry],
  );

  const citiesForState = React.useMemo(() => {
    if (!selectedCountry?.isoCode || !selectedState?.isoCode) return [];
    return City.getCitiesOfState(
      selectedCountry.isoCode,
      selectedState.isoCode,
    );
  }, [selectedCountry?.isoCode, selectedState?.isoCode]);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const hasStarted = sessionStorage.getItem("landlordOnboardingStarted");
      if (!hasStarted) {
        sessionStorage.removeItem("landlordOnboardingDetails");
        sessionStorage.removeItem("landlordOnboardingDocumentIds");
        sessionStorage.removeItem("landlordOnboardingProfilePictureId");
        sessionStorage.setItem("landlordOnboardingStarted", "true");
      }

      const stored = sessionStorage.getItem("landlordOnboardingDetails");
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as LandlordDetails;
          setDetails({ ...emptyDetails, ...parsed });
        } catch {
          setDetails(emptyDetails);
        }
      }

      const storedProfileId = sessionStorage.getItem(
        "landlordOnboardingProfilePictureId",
      );
      if (storedProfileId) {
        setProfilePictureId(storedProfileId);
      }
    }
  }, []);

  const handleChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = event.target;
      setDetails((prev) => ({ ...prev, [name]: value }));
    },
    [],
  );

  const handlePhoneChange = React.useCallback((value: string | undefined) => {
    setDetails((prev) => ({ ...prev, phoneNumber: value ?? "" }));
  }, []);

  const handleCountryChange = React.useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const nextCountryName = event.target.value;
      setDetails((prev) => ({
        ...prev,
        country: nextCountryName,
        state: "",
        city: "",
      }));
    },
    [],
  );

  const handleStateChange = React.useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const nextStateName = event.target.value;
      setDetails((prev) => ({
        ...prev,
        state: nextStateName,
        city: "",
      }));
    },
    [],
  );

  const handleCityChange = React.useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const nextCityName = event.target.value;
      setDetails((prev) => ({
        ...prev,
        city: nextCityName,
      }));
    },
    [],
  );

  const handleContinue = React.useCallback(async () => {
    setIsSubmitting(true);
    if (typeof window !== "undefined") {
      sessionStorage.setItem(
        "landlordOnboardingDetails",
        JSON.stringify(details),
      );
    }
    await router.push("/onboarding/landlord/documents");
    setIsSubmitting(false);
  }, [details, router]);

  const handleProfileUpload = React.useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) {
        return;
      }

      setIsProfileUploading(true);
      setProfileUploadProgress(0);
      setProfilePreview(URL.createObjectURL(file));

      const result = await uploadFile({
        file,
        folder: "landlord",
        label: "profile_picture",
        token: user?.token,
        onProgress: setProfileUploadProgress,
      });

      if (result.success) {
        setProfilePictureId(result.data.id);
        if (typeof window !== "undefined") {
          sessionStorage.setItem(
            "landlordOnboardingProfilePictureId",
            result.data.id,
          );
        }
      } else {
        showToast(result.error || "Failed to upload profile photo", "error");
      }

      setIsProfileUploading(false);
    },
    [showToast, user?.token],
  );

  return (
    <>
      <Head>
        <title>DWELLA NG · Account Details</title>
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
            <SignUpProgress currentStep={1} />
          </div>

          <div className="hidden sm:block w-[200px]"></div>
        </nav>

        <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="mb-1 text-2xl font-bold text-gray-900 text-center">
            Account Details
          </h1>
          <p className="mb-6 text-sm text-gray-600 text-center">
            Provide personal information to help us know you better
          </p>

          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-main text-white font-semibold overflow-hidden">
              {profilePreview ? (
                <Image
                  src={profilePreview}
                  alt="Profile preview"
                  width={48}
                  height={48}
                  className="h-full w-full object-cover"
                />
              ) : (
                initials
              )}
            </div>
            <div className="space-y-1">
              <label className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-blue-50 px-4 py-1.5 text-xs font-medium text-brand-main cursor-pointer">
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  className="hidden"
                  onChange={handleProfileUpload}
                />
                {profilePictureId ? "Change Photo" : "Upload Photo"}
              </label>
              <p className="text-xs text-gray-500">JPG, PNG up to 2MB</p>
              {isProfileUploading && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>Uploading...</span>
                  <div className="h-1.5 w-24 rounded-full bg-gray-200">
                    <div
                      className="h-1.5 rounded-full bg-brand-main"
                      style={{ width: `${profileUploadProgress}%` }}
                    />
                  </div>
                  <span>{profileUploadProgress}%</span>
                </div>
              )}
              {!isProfileUploading && profilePictureId && (
                <p className="text-xs text-green-600">Uploaded</p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Business Name
              </label>
              <input
                name="businessName"
                value={details.businessName}
                onChange={handleChange}
                placeholder="Placeholder"
                className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Address
                </label>
                <input
                  name="address"
                  value={details.address}
                  onChange={handleChange}
                  placeholder="Placeholder"
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <PhoneInputWithCountry
                  id="phoneNumber"
                  value={details.phoneNumber}
                  onChange={handlePhoneChange}
                  placeholder="801 234 5678"
                  className="w-full focus-within:ring-2 focus-within:ring-brand-main focus-within:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Postal Code
                </label>
                <input
                  name="postalCode"
                  value={details.postalCode}
                  onChange={handleChange}
                  placeholder="e.g. 930212"
                  inputMode="numeric"
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Country
                </label>
                <select
                  name="country"
                  value={details.country}
                  onChange={handleCountryChange}
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
                >
                  <option value="">Select Country</option>
                  {allCountries.map((country) => (
                    <option key={country.isoCode} value={country.name}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  State
                </label>
                <select
                  name="state"
                  value={details.state}
                  onChange={handleStateChange}
                  disabled={!details.country}
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
                >
                  <option value="">
                    {details.country ? "Select State" : "Select Country First"}
                  </option>
                  {statesForCountry.map((state) => (
                    <option key={state.isoCode} value={state.name}>
                      {state.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  City
                </label>
                <select
                  name="city"
                  value={details.city}
                  onChange={handleCityChange}
                  disabled={!details.country || !details.state}
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
                >
                  <option value="">
                    {details.state ? "Select City" : "Select State First"}
                  </option>
                  {citiesForState.map((city) => (
                    <option key={city.name} value={city.name}>
                      {city.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-6">
            <button
              type="button"
              onClick={() => router.back()}
              className="text-sm font-medium text-gray-400"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleContinue}
              disabled={isSubmitting}
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

LandlordOnboardingDetailsPage.getLayout = (page) => (
  <AuthLayout showImage={false}>{page}</AuthLayout>
);

export default LandlordOnboardingDetailsPage;
