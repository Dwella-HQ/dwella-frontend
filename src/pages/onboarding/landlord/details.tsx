import * as React from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Country, State, City } from "country-state-city";

import { AuthLayout } from "@/components/AuthLayout";
import { SignUpProgress } from "@/components/SignUpProgress";
import { PhoneInputWithCountry } from "@/components/PhoneInputWithCountry";
import { useToast } from "@/components/Toast";
import { uploadFile } from "@/api/files";
import { updateUser } from "@/api/user";
import { useUser } from "@/contexts/UserContext";
import logo from "@/assets/logo_blue_horizontal.png";

import type { NextPageWithLayout } from "../../_app";
import {
  BVN_LENGTH,
  emptyLandlordDetails,
  LANDLORD_ONBOARDING_KEYS,
  landlordFlowSteps,
  readJsonSession,
  type LandlordOnboardingDetails,
} from "@/lib/landlordOnboardingFlow";

const inputClassName =
  "h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent";

const LandlordOnboardingDetailsPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { showToast } = useToast();
  const { user } = useUser();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [details, setDetails] =
    React.useState<LandlordOnboardingDetails>(emptyLandlordDetails);
  const [profileUploadProgress, setProfileUploadProgress] = React.useState(0);
  const [isProfileUploading, setIsProfileUploading] = React.useState(false);
  const [profilePictureId, setProfilePictureId] = React.useState<string | null>(
    null,
  );
  const [profilePreview, setProfilePreview] = React.useState<string | null>(
    null,
  );
  const [formError, setFormError] = React.useState<string | null>(null);

  const initials = React.useMemo(() => {
    const first = details.firstName.trim()[0] || "";
    const last = details.lastName.trim()[0] || "";
    if (first || last) return `${first}${last}`.toUpperCase();
    const fromUser = (user?.name ?? "").trim().split(/\s+/);
    const uFirst = fromUser[0]?.[0] || "";
    const uLast =
      fromUser.length > 1 ? fromUser[fromUser.length - 1]?.[0] || "" : "";
    return `${uFirst}${uLast}`.toUpperCase() || "JD";
  }, [details.firstName, details.lastName, user?.name]);

  const allCountries = React.useMemo(() => Country.getAllCountries(), []);
  const selectedCountry = React.useMemo(
    () =>
      allCountries.find((country) => country.name === details.country) ??
      allCountries.find((country) => country.name === "Nigeria") ??
      null,
    [allCountries, details.country],
  );
  const selectedCountryIsoCode = selectedCountry?.isoCode ?? "";
  const statesForCountry = React.useMemo(() => {
    if (!selectedCountryIsoCode) return [];
    return State.getStatesOfCountry(selectedCountryIsoCode);
  }, [selectedCountryIsoCode]);
  const selectedState = React.useMemo(
    () =>
      statesForCountry.find((state) => state.name === details.state) ?? null,
    [details.state, statesForCountry],
  );
  const selectedStateIsoCode = selectedState?.isoCode ?? "";
  const citiesForState = React.useMemo(() => {
    if (!selectedCountryIsoCode || !selectedStateIsoCode) return [];
    return City.getCitiesOfState(selectedCountryIsoCode, selectedStateIsoCode);
  }, [selectedCountryIsoCode, selectedStateIsoCode]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const hasStarted = sessionStorage.getItem(LANDLORD_ONBOARDING_KEYS.started);
    if (!hasStarted) {
      sessionStorage.removeItem(LANDLORD_ONBOARDING_KEYS.details);
      sessionStorage.removeItem(LANDLORD_ONBOARDING_KEYS.kyc);
      sessionStorage.removeItem(LANDLORD_ONBOARDING_KEYS.kyb);
      sessionStorage.removeItem(LANDLORD_ONBOARDING_KEYS.profilePictureId);
      sessionStorage.removeItem(LANDLORD_ONBOARDING_KEYS.documentIds);
      sessionStorage.removeItem(LANDLORD_ONBOARDING_KEYS.finance);
      sessionStorage.setItem(LANDLORD_ONBOARDING_KEYS.started, "true");
    }

    const stored = readJsonSession<Partial<LandlordOnboardingDetails>>(
      LANDLORD_ONBOARDING_KEYS.details,
    );
    if (stored) {
      setDetails({ ...emptyLandlordDetails, ...stored });
    } else if (user?.name) {
      const parts = user.name.trim().split(/\s+/);
      setDetails((prev) => ({
        ...prev,
        firstName: parts[0] ?? "",
        lastName: parts.slice(1).join(" "),
      }));
    }

    const storedProfileId = sessionStorage.getItem(
      LANDLORD_ONBOARDING_KEYS.profilePictureId,
    );
    if (storedProfileId) setProfilePictureId(storedProfileId);
  }, [user?.name]);

  const handleChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = event.target;
      if (name === "bvn") {
        setDetails((prev) => ({
          ...prev,
          bvn: value.replace(/\D/g, "").slice(0, BVN_LENGTH),
        }));
        return;
      }
      setDetails((prev) => ({ ...prev, [name]: value }));
    },
    [],
  );

  const handlePhoneChange = React.useCallback((value: string | undefined) => {
    setDetails((prev) => ({ ...prev, phoneNumber: value ?? "" }));
  }, []);

  const handleCountryChange = React.useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      setDetails((prev) => ({
        ...prev,
        country: event.target.value,
        state: "",
        city: "",
      }));
    },
    [],
  );

  const handleStateChange = React.useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      setDetails((prev) => ({
        ...prev,
        state: event.target.value,
        city: "",
      }));
    },
    [],
  );

  const handleCityChange = React.useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      setDetails((prev) => ({ ...prev, city: event.target.value }));
    },
    [],
  );

  const handleContinue = React.useCallback(async () => {
    const bvn = details.bvn.trim();
    const hasRequiredFields =
      details.firstName.trim().length > 0 &&
      details.lastName.trim().length > 0 &&
      details.dateOfBirth.trim().length > 0 &&
      bvn.length === BVN_LENGTH &&
      details.phoneNumber.trim().length > 0 &&
      details.address.trim().length > 0 &&
      details.country.trim().length > 0 &&
      details.state.trim().length > 0 &&
      details.city.trim().length > 0;

    if (!hasRequiredFields) {
      setFormError(
        bvn.length > 0 && bvn.length !== BVN_LENGTH
          ? `BVN must be exactly ${BVN_LENGTH} digits.`
          : "Please complete all required fields.",
      );
      return;
    }

    setFormError(null);
    setIsSubmitting(true);

    sessionStorage.setItem(
      LANDLORD_ONBOARDING_KEYS.details,
      JSON.stringify({ ...details, bvn }),
    );

    if (user?.id) {
      const fullName = `${details.firstName.trim()} ${details.lastName.trim()}`.trim();
      const updateResult = await updateUser(String(user.id), {
        fullName,
        phoneNumber: details.phoneNumber.trim(),
        // Backend does not yet accept DOB / BVN on UpdateUserDto — stored locally until then.
        dateOfBirth: details.dateOfBirth,
        bvn,
      });
      if (!updateResult.success) {
        showToast(
          updateResult.error ||
            "Could not update your profile. Continuing with local details.",
          "warning",
        );
      }
    }

    await router.push("/onboarding/landlord/documents");
    setIsSubmitting(false);
  }, [details, router, showToast, user?.id]);

  const handleProfileUpload = React.useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (file.size > 2 * 1024 * 1024) {
        showToast("Profile photo must be 2MB or less", "error");
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
        sessionStorage.setItem(
          LANDLORD_ONBOARDING_KEYS.profilePictureId,
          result.data.id,
        );
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
        <title>Dwelliva · User Details</title>
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
            <SignUpProgress currentStep={1} steps={landlordFlowSteps} />
          </div>
          <div className="hidden w-[200px] sm:block" />
        </nav>

        <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="mb-1 text-center text-2xl font-bold text-gray-900">
            User Details
          </h1>
          <p className="mb-6 text-center text-sm text-gray-600">
            Provide personal informations to help us know you better.
          </p>

          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-brand-main text-lg font-semibold text-white">
              {profilePreview ? (
                <Image
                  src={profilePreview}
                  alt="Profile preview"
                  width={56}
                  height={56}
                  className="h-full w-full object-cover"
                />
              ) : (
                initials
              )}
            </div>
            <div className="space-y-1">
              <label className="cursor-pointer text-sm font-medium text-brand-main hover:underline">
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  className="hidden"
                  onChange={handleProfileUpload}
                />
                Change Photo
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

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                First Name
              </label>
              <input
                name="firstName"
                value={details.firstName}
                onChange={handleChange}
                placeholder="Ada"
                className={inputClassName}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Last Name
              </label>
              <input
                name="lastName"
                value={details.lastName}
                onChange={handleChange}
                placeholder="Okafor"
                className={inputClassName}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Date Of Birth
              </label>
              <div className="relative min-w-0 w-full overflow-hidden">
                <input
                  name="dateOfBirth"
                  type="date"
                  value={details.dateOfBirth}
                  onChange={handleChange}
                  className={`${inputClassName} min-w-0 max-w-full`}
                />
              </div>
            </div>
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
                value={details.bvn}
                onChange={handleChange}
                placeholder="22123456789"
                className={inputClassName}
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
                className="w-full focus-within:border-transparent focus-within:ring-2 focus-within:ring-brand-main"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Address
              </label>
              <input
                name="address"
                value={details.address}
                onChange={handleChange}
                placeholder="12 Admiralty Way, Lekki"
                className={inputClassName}
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
                className={inputClassName}
              >
                <option value="">Select Country</option>
                {allCountries.map((country) => (
                  <option key={country.isoCode} value={country.name}>
                    {country.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                State
              </label>
              <select
                name="state"
                value={details.state}
                onChange={handleStateChange}
                disabled={!details.country}
                className={inputClassName}
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
                className={inputClassName}
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

          {formError ? (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {formError}
            </div>
          ) : null}

          <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-6">
            <button
              type="button"
              disabled
              className="cursor-not-allowed text-sm font-medium text-gray-400"
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

LandlordOnboardingDetailsPage.getLayout = (page) => (
  <AuthLayout showImage={false}>{page}</AuthLayout>
);

export default LandlordOnboardingDetailsPage;
