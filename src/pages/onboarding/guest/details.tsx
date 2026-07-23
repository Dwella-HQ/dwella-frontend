import * as React from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Calendar, Eye, EyeOff } from "lucide-react";

import { AuthLayout } from "@/components/AuthLayout";
import { SignUpProgress } from "@/components/SignUpProgress";
import { PhoneInputWithCountry } from "@/components/PhoneInputWithCountry";
import { useToast } from "@/components/Toast";
import { useUser } from "@/contexts/UserContext";
import { register } from "@/api/auth";
import { updateUser } from "@/api/user";
import { uploadFile } from "@/api/files";
import { persistFreshAuth, resetClientSession } from "@/lib/clientSession";
import {
  loginAfterInviteRegistration,
  pickAccessTokenFromRegisterResponse,
} from "@/utils/invitePostRegisterAuth";
import {
  formatRegistrationErrorForUser,
  isDuplicateEmailRegistrationError,
} from "@/utils/registrationErrors";
import {
  isValidInternationalPhoneNumber,
  normalizePhoneNumberForApi,
} from "@/utils/phoneNumber";
import logo from "@/assets/logo_blue_horizontal.png";

import type { NextPageWithLayout } from "../../_app";
import {
  EMERGENCY_RELATIONSHIPS,
  emptyGuestDetails,
  GUEST_API_ROLE_NAME,
  GUEST_ONBOARDING_KEYS,
  guestFlowSteps,
  type EmergencyRelationship,
  type GuestOnboardingDetails,
} from "@/lib/guestOnboardingFlow";

const inputClassName =
  "h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent";

const GuestOnboardingDetailsPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { showToast } = useToast();
  const { setUser } = useUser();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [details, setDetails] =
    React.useState<GuestOnboardingDetails>(emptyGuestDetails);
  const [profileUploadProgress, setProfileUploadProgress] = React.useState(0);
  const [isProfileUploading, setIsProfileUploading] = React.useState(false);
  const [profilePictureId, setProfilePictureId] = React.useState<string | null>(
    null,
  );
  const [profilePreview, setProfilePreview] = React.useState<string | null>(
    null,
  );
  const [pendingProfileFile, setPendingProfileFile] = React.useState<File | null>(
    null,
  );
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  const initials = React.useMemo(() => {
    const first = details.firstName.trim()[0] || "";
    const last = details.lastName.trim()[0] || "";
    return `${first}${last}`.toUpperCase() || "JD";
  }, [details.firstName, details.lastName]);

  const passwordTooShort =
    details.password.length > 0 && details.password.length < 8;
  const passwordsMismatch =
    details.confirmPassword.length > 0 &&
    details.password !== details.confirmPassword;
  const passwordsMatch =
    details.password.length >= 8 &&
    details.confirmPassword.length > 0 &&
    details.password === details.confirmPassword;

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const hasStarted = sessionStorage.getItem(GUEST_ONBOARDING_KEYS.started);
    if (!hasStarted) {
      sessionStorage.removeItem(GUEST_ONBOARDING_KEYS.details);
      sessionStorage.removeItem(GUEST_ONBOARDING_KEYS.kyc);
      sessionStorage.removeItem(GUEST_ONBOARDING_KEYS.profilePictureId);
      sessionStorage.removeItem(GUEST_ONBOARDING_KEYS.profilePreview);
      sessionStorage.setItem(GUEST_ONBOARDING_KEYS.started, "true");
    }

    const storedRaw = sessionStorage.getItem(GUEST_ONBOARDING_KEYS.details);
    if (storedRaw) {
      try {
        const parsed = JSON.parse(storedRaw) as Partial<GuestOnboardingDetails>;
        setDetails({
          ...emptyGuestDetails,
          ...parsed,
          password: "",
          confirmPassword: "",
        });
      } catch {
        setDetails(emptyGuestDetails);
      }
    }

    const storedProfileId = sessionStorage.getItem(
      GUEST_ONBOARDING_KEYS.profilePictureId,
    );
    if (storedProfileId) setProfilePictureId(storedProfileId);

    const storedPreview = sessionStorage.getItem(
      GUEST_ONBOARDING_KEYS.profilePreview,
    );
    if (storedPreview) setProfilePreview(storedPreview);
  }, []);

  const handleChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = event.target;
      setDetails((prev) => ({ ...prev, [name]: value }));
    },
    [],
  );

  const handlePhoneChange = React.useCallback((value: string | undefined) => {
    setDetails((prev) => ({ ...prev, phoneNumber: value ?? "" }));
  }, []);

  const handleEmergencyPhoneChange = React.useCallback(
    (value: string | undefined) => {
      setDetails((prev) => ({
        ...prev,
        emergencyContactPhone: value ?? "",
      }));
    },
    [],
  );

  const handleContinue = React.useCallback(async () => {
    const fullName =
      `${details.firstName.trim()} ${details.lastName.trim()}`.trim();
    const email = details.email.trim();
    const phone = details.phoneNumber.trim();
    const password = details.password;
    const confirmPassword = details.confirmPassword;

    if (
      !details.firstName.trim() ||
      !details.lastName.trim() ||
      !details.dateOfBirth.trim() ||
      !email ||
      !phone ||
      !details.occupation.trim() ||
      !details.emergencyContactName.trim() ||
      !details.emergencyContactRelationship ||
      !details.emergencyContactPhone.trim() ||
      !password ||
      !confirmPassword
    ) {
      setFormError("Please complete all required fields.");
      return;
    }

    if (!isValidInternationalPhoneNumber(phone)) {
      setFormError("Enter a valid phone number.");
      return;
    }

    if (!isValidInternationalPhoneNumber(details.emergencyContactPhone)) {
      setFormError("Enter a valid emergency contact phone number.");
      return;
    }

    if (password.length < 8) {
      setFormError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    setFormError(null);
    setIsSubmitting(true);

    const normalizedPhone = normalizePhoneNumberForApi(phone);
    const normalizedEmergencyPhone = normalizePhoneNumberForApi(
      details.emergencyContactPhone,
    );

    const detailsToStore: GuestOnboardingDetails = {
      ...details,
      phoneNumber: normalizedPhone,
      emergencyContactPhone: normalizedEmergencyPhone,
      password: "",
      confirmPassword: "",
    };
    sessionStorage.setItem(
      GUEST_ONBOARDING_KEYS.details,
      JSON.stringify(detailsToStore),
    );

    const result = await register({
      email,
      password,
      roleName: GUEST_API_ROLE_NAME,
      fullName,
      phoneNumber: normalizedPhone,
      registrationType: "EMAIL",
    });

    if (!result.success) {
      if (isDuplicateEmailRegistrationError(result.error)) {
        setFormError(
          "An account with this email already exists. Please sign in instead.",
        );
      } else {
        setFormError(formatRegistrationErrorForUser(result.error));
      }
      setIsSubmitting(false);
      return;
    }

    const regUser = result.data.data;
    let accessToken =
      result.registerAccessToken ||
      pickAccessTokenFromRegisterResponse(result.data);

    if (!accessToken) {
      const loginResult = await loginAfterInviteRegistration(email, password);
      if (!loginResult.success) {
        setFormError(
          loginResult.error ||
            "Account created, but we could not sign you in automatically. Please sign in.",
        );
        setIsSubmitting(false);
        await router.push(`/auth/login?email=${encodeURIComponent(email)}`);
        return;
      }
      accessToken = loginResult.data.data.accessToken;
    }

    resetClientSession();
    setUser({
      id: regUser.id,
      name: regUser.fullName || fullName,
      email: regUser.email,
      role: "guest",
      token: accessToken,
    });
    persistFreshAuth(String(regUser.id), accessToken);
    sessionStorage.setItem(GUEST_ONBOARDING_KEYS.userId, String(regUser.id));

    let uploadedProfileId = profilePictureId;
    if (pendingProfileFile) {
      const uploadResult = await uploadFile({
        file: pendingProfileFile,
        folder: "guest",
        label: "profile_picture",
        token: accessToken,
        onProgress: setProfileUploadProgress,
      });
      if (uploadResult.success) {
        uploadedProfileId = uploadResult.data.id;
        setProfilePictureId(uploadedProfileId);
        sessionStorage.setItem(
          GUEST_ONBOARDING_KEYS.profilePictureId,
          uploadedProfileId,
        );
      } else {
        showToast(
          uploadResult.error || "Profile photo could not be uploaded yet.",
          "warning",
        );
      }
    }

    // OpenAPI UpdateUserDto is limited; send extended fields as best-effort.
    await updateUser(String(regUser.id), {
      fullName,
      phoneNumber: normalizedPhone,
      dateOfBirth: details.dateOfBirth,
      occupation: details.occupation.trim(),
      profilePictureId: uploadedProfileId || undefined,
      nextOfKinDetails: {
        fullName: details.emergencyContactName.trim(),
        relationship: details.emergencyContactRelationship || "Other",
        contactNumber: normalizedEmergencyPhone,
      },
    });

    await router.push("/onboarding/guest/documents");
    setIsSubmitting(false);
  }, [
    details,
    pendingProfileFile,
    profilePictureId,
    router,
    setUser,
    showToast,
  ]);

  const handleProfileUpload = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (file.size > 2 * 1024 * 1024) {
        showToast("Profile photo must be 2MB or less", "error");
        return;
      }

      const preview = URL.createObjectURL(file);
      setPendingProfileFile(file);
      setProfilePreview(preview);
      setProfilePictureId(null);
      sessionStorage.setItem(GUEST_ONBOARDING_KEYS.profilePreview, preview);
      sessionStorage.removeItem(GUEST_ONBOARDING_KEYS.profilePictureId);
      event.target.value = "";
    },
    [showToast],
  );

  return (
    <>
      <Head>
        <title>Dwelliva · Guest Sign Up</title>
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
            <SignUpProgress currentStep={1} steps={guestFlowSteps} />
          </div>
          <div className="hidden w-[200px] sm:block" />
        </nav>

        <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="mb-1 text-center text-2xl font-bold text-gray-900">
            Sign Up
          </h1>
          <p className="mb-6 text-center text-sm text-gray-600">
            Provide personal informations to help us know you better
          </p>

          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-brand-main text-lg font-semibold text-white">
              {profilePreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profilePreview}
                  alt="Profile preview"
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
              <p className="text-xs text-gray-500">JPG, PNG - up to 2MB</p>
              {pendingProfileFile ? (
                <p className="text-xs text-gray-500">
                  Photo selected — uploads when you continue
                </p>
              ) : null}
              {isProfileUploading && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>Uploading...</span>
                  <div className="h-1.5 w-24 rounded-full bg-gray-200">
                    <div
                      className="h-1.5 rounded-full bg-brand-main"
                      style={{ width: `${profileUploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
              {!isProfileUploading && profilePictureId ? (
                <p className="text-xs text-green-600">Uploaded</p>
              ) : null}
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
              <div className="relative">
                <input
                  name="dateOfBirth"
                  type="date"
                  value={details.dateOfBirth}
                  onChange={handleChange}
                  className={`${inputClassName} pr-10`}
                />
                <Calendar
                  className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                  aria-hidden
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                name="email"
                type="email"
                value={details.email}
                onChange={handleChange}
                placeholder="ada.okafor@email.com"
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
                Occupation
              </label>
              <input
                name="occupation"
                value={details.occupation}
                onChange={handleChange}
                placeholder="Software Engineer"
                className={inputClassName}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Emergency Contact Name
              </label>
              <input
                name="emergencyContactName"
                value={details.emergencyContactName}
                onChange={handleChange}
                placeholder="Chidi Okafor"
                className={inputClassName}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Emergency contact phone
              </label>
              <PhoneInputWithCountry
                id="emergencyContactPhone"
                value={details.emergencyContactPhone}
                onChange={handleEmergencyPhoneChange}
                className="w-full focus-within:border-transparent focus-within:ring-2 focus-within:ring-brand-main"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Emergency Contact Relationship
              </label>
              <select
                name="emergencyContactRelationship"
                value={details.emergencyContactRelationship}
                onChange={(e) =>
                  setDetails((prev) => ({
                    ...prev,
                    emergencyContactRelationship: e.target
                      .value as EmergencyRelationship,
                  }))
                }
                className={inputClassName}
              >
                <option value="">Select relationship</option>
                {EMERGENCY_RELATIONSHIPS.map((relationship) => (
                  <option key={relationship} value={relationship}>
                    {relationship}
                  </option>
                ))}
              </select>
            </div>
            <div className="hidden sm:block" />

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={details.password}
                  onChange={handleChange}
                  placeholder="At least 8 characters"
                  aria-invalid={passwordTooShort || passwordsMismatch}
                  className={`${inputClassName} pr-10 ${
                    passwordTooShort
                      ? "border-red-400 focus:ring-red-400"
                      : passwordsMatch
                        ? "border-emerald-400 focus:ring-emerald-400"
                        : ""
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {passwordTooShort ? (
                <p className="mt-1.5 text-xs text-red-600" role="status">
                  Password must be at least 8 characters.
                </p>
              ) : null}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={details.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter password"
                  aria-invalid={passwordsMismatch}
                  className={`${inputClassName} pr-10 ${
                    passwordsMismatch
                      ? "border-red-400 focus:ring-red-400"
                      : passwordsMatch
                        ? "border-emerald-400 focus:ring-emerald-400"
                        : ""
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {passwordsMismatch ? (
                <p className="mt-1.5 text-xs text-red-600" role="status">
                  Passwords do not match.
                </p>
              ) : passwordsMatch ? (
                <p className="mt-1.5 text-xs text-emerald-600" role="status">
                  Passwords match.
                </p>
              ) : null}
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
              className="cursor-not-allowed rounded-lg border border-transparent px-5 py-2.5 text-sm font-medium text-gray-400"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleContinue}
              disabled={isSubmitting || passwordsMismatch || passwordTooShort}
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

        <p className="mt-6 text-center text-sm text-gray-600">
          Already Have account?{" "}
          <Link
            href={`/auth/login?email=${encodeURIComponent(details.email || "")}`}
            className="font-medium text-brand-main hover:underline"
          >
            Sign In
          </Link>
        </p>
      </div>
    </>
  );
};

GuestOnboardingDetailsPage.getLayout = (page) => (
  <AuthLayout showImage={false}>{page}</AuthLayout>
);

export default GuestOnboardingDetailsPage;
