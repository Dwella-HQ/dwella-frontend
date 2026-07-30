import * as React from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Eye, EyeOff } from "lucide-react";

import { AuthLayout } from "@/components/AuthLayout";
import { SignUpProgress } from "@/components/SignUpProgress";
import { PhoneInputWithCountry } from "@/components/PhoneInputWithCountry";
import { useToast } from "@/components/Toast";
import { uploadFile } from "@/api/files";
import { register } from "@/api/auth";
import { getTenantByUser } from "@/api/tenants";
import { resolveTenantActiveLeaseId } from "@/api/rent";
import { persistFreshAuth, resetClientSession } from "@/lib/clientSession";
import { useUser, type UserRole } from "@/contexts/UserContext";
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
  buildTenantInviteQueryString,
  EMERGENCY_RELATIONSHIPS,
  emptyTenantDetails,
  getTenantInviteIdFromQuery,
  getTenantInvitePrefillFromQuery,
  hasTenantInviteContext,
  TENANT_ONBOARDING_KEYS,
  tenantFlowSteps,
  type EmergencyRelationship,
  type TenantOnboardingDetails,
} from "@/lib/tenantOnboardingFlow";

const inputClassName =
  "h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent";

const TenantOnboardingDetailsPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { showToast } = useToast();
  const { setUser } = useUser();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [details, setDetails] =
    React.useState<TenantOnboardingDetails>(emptyTenantDetails);
  const [profileUploadProgress, setProfileUploadProgress] = React.useState(0);
  const [isProfileUploading, setIsProfileUploading] = React.useState(false);
  const [profilePictureId, setProfilePictureId] = React.useState<string | null>(
    null,
  );
  const [profilePreview, setProfilePreview] = React.useState<string | null>(
    null,
  );
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  const inviteTenantId = React.useMemo(
    () => getTenantInviteIdFromQuery(router.query),
    [router.query],
  );

  const initials = React.useMemo(() => {
    const first = details.firstName.trim()[0] || "";
    const last = details.lastName.trim()[0] || "";
    return `${first}${last}`.toUpperCase() || "JD";
  }, [details.firstName, details.lastName]);

  React.useEffect(() => {
    if (!router.isReady) return;
    if (!hasTenantInviteContext(router.query)) {
      void router.replace("/auth/signup");
      return;
    }

    if (typeof window === "undefined") return;

    const hasStarted = sessionStorage.getItem(TENANT_ONBOARDING_KEYS.started);
    if (!hasStarted) {
      sessionStorage.removeItem(TENANT_ONBOARDING_KEYS.details);
      sessionStorage.removeItem(TENANT_ONBOARDING_KEYS.kyc);
      sessionStorage.removeItem(TENANT_ONBOARDING_KEYS.profilePictureId);
      sessionStorage.setItem(TENANT_ONBOARDING_KEYS.started, "true");
    }

    if (inviteTenantId) {
      sessionStorage.setItem(
        TENANT_ONBOARDING_KEYS.inviteTenantId,
        inviteTenantId,
      );
    }

    const storedRaw = sessionStorage.getItem(TENANT_ONBOARDING_KEYS.details);
    if (storedRaw) {
      try {
        const parsed = JSON.parse(storedRaw) as Partial<TenantOnboardingDetails>;
        setDetails({
          ...emptyTenantDetails,
          ...parsed,
          password: "",
          confirmPassword: "",
        });
      } catch {
        setDetails(emptyTenantDetails);
      }
    } else {
      const prefill = getTenantInvitePrefillFromQuery(router.query);
      const nameParts = prefill.fullName.trim().split(/\s+/).filter(Boolean);
      setDetails((prev) => ({
        ...prev,
        email: prefill.email || prev.email,
        phoneNumber: prefill.phoneNumber || prev.phoneNumber,
        firstName: nameParts[0] || prev.firstName,
        lastName: nameParts.slice(1).join(" ") || prev.lastName,
      }));
    }

    const storedProfileId = sessionStorage.getItem(
      TENANT_ONBOARDING_KEYS.profilePictureId,
    );
    if (storedProfileId) setProfilePictureId(storedProfileId);
  }, [inviteTenantId, router]);

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

  const establishTenantSession = React.useCallback(
    async (
      accessToken: string,
      apiUser: {
        id: string;
        email: string;
        fullName?: string;
        name?: string;
        role?: { name?: string };
      },
      fullName: string,
    ) => {
      const roleName = apiUser.role?.name || "tenant";
      const role: UserRole =
        roleName === "tenant" ? "tenant" : ("tenant" as UserRole);
      resetClientSession();
      setUser({
        id: apiUser.id,
        name:
          apiUser.fullName ||
          apiUser.name ||
          fullName ||
          apiUser.email.split("@")[0],
        email: apiUser.email,
        role,
        token: accessToken,
      });
      persistFreshAuth(String(apiUser.id), accessToken);

      localStorage.removeItem("landlordId");
      localStorage.removeItem("leaseId");

      const tenantResult = await getTenantByUser(apiUser.id);
      if (tenantResult.success && tenantResult.data?.id) {
        localStorage.setItem("tenantId", tenantResult.data.id);
        const activeLeaseId = resolveTenantActiveLeaseId(
          tenantResult.data.leases as
            | Array<Record<string, unknown>>
            | undefined,
          null,
        );
        if (activeLeaseId) {
          localStorage.setItem("leaseId", activeLeaseId);
        }
      }
    },
    [setUser],
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

    const tenantId =
      inviteTenantId ||
      sessionStorage.getItem(TENANT_ONBOARDING_KEYS.inviteTenantId) ||
      "";

    if (!tenantId) {
      setFormError(
        "This invite link is missing a tenant ID. Please use the link from your invitation email.",
      );
      return;
    }

    setFormError(null);
    setIsSubmitting(true);

    const detailsToStore: TenantOnboardingDetails = {
      ...details,
      password: "",
      confirmPassword: "",
    };
    sessionStorage.setItem(
      TENANT_ONBOARDING_KEYS.details,
      JSON.stringify(detailsToStore),
    );
    sessionStorage.setItem(TENANT_ONBOARDING_KEYS.inviteTenantId, tenantId);

    const result = await register({
      email,
      password,
      roleName: "tenant",
      fullName,
      phoneNumber: normalizePhoneNumberForApi(phone),
      registrationType: "EMAIL",
      tenantId,
    });

    if (!result.success) {
      if (isDuplicateEmailRegistrationError(result.error)) {
        setFormError(
          "An account with this email already exists. Please sign in instead.",
        );
        setIsSubmitting(false);
        return;
      }
      setFormError(formatRegistrationErrorForUser(result.error));
      setIsSubmitting(false);
      return;
    }

    const tokenFromRegister =
      result.registerAccessToken ||
      pickAccessTokenFromRegisterResponse(result.data);
    const regUser = result.data.data;

    try {
      if (tokenFromRegister && regUser?.id && regUser?.email) {
        await establishTenantSession(tokenFromRegister, regUser, fullName);
      } else {
        const loginResult = await loginAfterInviteRegistration(email, password);
        if (!loginResult.success) {
          setFormError(
            loginResult.error ||
              "Account created, but we could not sign you in automatically. Please sign in.",
          );
          setIsSubmitting(false);
          await router.push(
            `/auth/login?email=${encodeURIComponent(email)}`,
          );
          return;
        }
        await establishTenantSession(
          loginResult.data.data.accessToken,
          loginResult.data.data.user,
          fullName,
        );
      }
    } catch (err) {
      console.warn("Tenant invite session setup failed:", err);
      setFormError("Account created, but session setup failed. Please sign in.");
      setIsSubmitting(false);
      await router.push(`/auth/login?email=${encodeURIComponent(email)}`);
      return;
    }

    await router.push(
      `/onboarding/tenant/documents${buildTenantInviteQueryString(router.query)}`,
    );
    setIsSubmitting(false);
  }, [
    details,
    establishTenantSession,
    inviteTenantId,
    router,
  ]);

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
        folder: "tenant",
        label: "profile_picture",
        onProgress: setProfileUploadProgress,
      });

      if (result.success) {
        setProfilePictureId(result.data.id);
        sessionStorage.setItem(
          TENANT_ONBOARDING_KEYS.profilePictureId,
          result.data.id,
        );
      } else {
        showToast(result.error || "Failed to upload profile photo", "error");
      }

      setIsProfileUploading(false);
    },
    [showToast],
  );

  return (
    <>
      <Head>
        <title>Dwelliva · Sign Up</title>
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
            <SignUpProgress currentStep={1} steps={tenantFlowSteps} />
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
                  className={`${inputClassName} pr-10`}
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
                  className={`${inputClassName} pr-10`}
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

TenantOnboardingDetailsPage.getLayout = (page) => (
  <AuthLayout showImage={false}>{page}</AuthLayout>
);

export default TenantOnboardingDetailsPage;
