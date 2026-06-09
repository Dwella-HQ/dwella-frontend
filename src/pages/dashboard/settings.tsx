import { isValidPhoneNumber } from "react-phone-number-input";
import { PhoneInputWithCountry } from "@/components/PhoneInputWithCountry";
import Head from "next/head";
import * as React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { DashboardLayout } from "@/components/DashboardLayout";
import {
  User,
  FileText,
  Bell,
  CreditCard,
  Settings as SettingsIcon,
  Lock,
  Upload,
  Eye,
  EyeOff,
  Pencil,
  X,
} from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { useToast } from "@/components/Toast";
import { uploadFile } from "@/api/files";
import { getProfile } from "@/api/auth";
import {
  getLandlord,
  getLandlordByUser,
  getLandlordSettings,
  resolveLandlordBusinessPhone,
  updateLandlord,
  updateLandlordDocumentsSettings,
  updateLandlordGracePeriodsSettings,
  updateLandlordLateFeeSettings,
  updateLandlordNotificationPreferencesSettings,
  updateLandlordPlatformPreferencesSettings,
  updateLandlordProfileSettings,
} from "@/api/landlord";
import type {
  LandlordBankAccountDTO,
  LandlordDTO,
  LandlordSettingsDTO,
  LandlordSettingsProfileUpdateDTO,
} from "@/api/landlord";
import {
  getWithdrawalBanksByCurrency,
  resolveWithdrawalAccount,
} from "@/api/withdrawal";
import type { WithdrawalBankDTO } from "@/api/withdrawal";
import {
  deriveVerificationKind,
  entityLandlordId,
  queryVerifications,
} from "@/api/verification";
import type { NextPageWithLayout } from "../_app";

type SettingsTab =
  | "profile"
  | "documents"
  | "notifications"
  | "payment-details"
  | "preferences"
  | "change-password";

const PAY_ACCOUNT_LEN = 10;
const PAY_BVN_LEN = 11;

const bankOptionCode = (bank: WithdrawalBankDTO) =>
  (bank.bankCode || bank.code || "").trim();

const bankOptionName = (bank: WithdrawalBankDTO, index: number) => {
  const code = bankOptionCode(bank);
  return bank.bankName || bank.name || code || `Bank ${index + 1}`;
};

/** Console label for payment settings debugging (filter DevTools by this string). */
const PAYMENT_SETTINGS_LOG = "[Dwelliva Settings · Payment]";
const PROFILE_SETTINGS_LOG = "[Dwelliva Settings · Profile]";
const LANDLORD_SETTINGS_LOG = "[Dwelliva Settings · Landlord settings]";

const notificationChannelsToBooleans = (arr: unknown) => {
  const list = Array.isArray(arr) ? arr : [];
  return {
    email: list.includes("EMAIL_NOTIFICATION"),
    push: list.includes("PUSH_NOTIFICATION"),
    sms: list.includes("APP_NOTIFICATION") || list.includes("SMS_NOTIFICATION"),
  };
};

type ProfileFormState = {
  businessName: string;
  businessEmail: string;
  businessPhoneNumber: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

type PaymentBankAccountFields = {
  accountName?: string;
  accountNumber?: string;
  accountCode?: string;
  bankName?: string;
  bankCode?: string;
  bvn?: string;
};

function pickBankAccountFromSettings(
  settings: LandlordSettingsDTO,
): PaymentBankAccountFields | null {
  const ba = settings.bankAccount;
  if (ba && typeof ba === "object") {
    return ba as PaymentBankAccountFields;
  }
  return null;
}

/** PATCH /landlord/:id/profile — UpdateLadlordProfileDto */
function buildLandlordProfilePayload(
  profileForm: ProfileFormState,
  landlord?: LandlordDTO | null,
  phoneOverride?: string,
): LandlordSettingsProfileUpdateDTO {
  const phone = (phoneOverride ?? profileForm.businessPhoneNumber).trim();
  return {
    businessName:
      profileForm.businessName.trim() ||
      landlord?.businessName ||
      landlord?.landLordName ||
      "",
    businessEmail:
      profileForm.businessEmail.trim() || landlord?.businessEmail || "",
    businessPhoneNumber:
      phoneOverride !== undefined
        ? phoneOverride.trim()
        : phone
          ? phone
          : undefined,
    address: {
      address: profileForm.address.trim() || landlord?.address?.address || "",
      city: profileForm.city.trim() || landlord?.address?.city || "",
      state: profileForm.state.trim() || landlord?.address?.state || "",
      postalCode:
        profileForm.postalCode.trim() ||
        landlord?.address?.postalCode ||
        undefined,
      country:
        profileForm.country.trim() || landlord?.address?.country || "Nigeria",
    },
  };
}

const MONTHLY_GRACE_OPTIONS = [
  "NO_GRACE_PERIOD",
  "ONE_WEEK",
  "TWO_WEEKS",
] as const;

const QUARTERLY_GRACE_OPTIONS = [
  "NO_GRACE_PERIOD",
  "ONE_WEEK",
  "TWO_WEEKS",
  "THREE_WEEKS",
  "ONE_MONTH",
  "FIVE_WEEKS",
  "SIX_WEEKS",
] as const;

const YEARLY_GRACE_OPTIONS = [
  "NO_GRACE_PERIOD",
  "ONE_MONTH",
  "TWO_MONTHS",
  "THREE_MONTHS",
  "FOUR_MONTHS",
  "FIVE_MONTHS",
  "SIX_MONTHS",
] as const;

const formatGraceLabel = (value: string) =>
  value
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");

type PaymentFormState = {
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  bvn: string;
};

type PreferencesSnapshot = {
  platformPrefsForm: {
    defaultCurrency: string;
    defaultLateFeeAmount: string;
    language: string;
  };
  gracePeriodForm: {
    monthlyRentGracePeriod: string;
    quarterlyRentGracePeriod: string;
    yearlyRentGracePeriod: string;
  };
  lateFeeForm: {
    lateFeeAmount: string;
    lateFeeType: "fixed" | "percentage";
  };
};

const SETTINGS_FIELD_READONLY =
  "h-11 w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-50 px-4 text-sm text-gray-900";
const SETTINGS_FIELD_EDITABLE =
  "h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-main focus:outline-none focus:ring-2 focus:ring-brand-main";

function SettingsSectionEditButton({
  label = "Edit",
  onClick,
}: {
  label?: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
    >
      <Pencil className="h-4 w-4" />
      {label}
    </motion.button>
  );
}

function SettingsSectionCancelButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
    >
      <X className="h-4 w-4" />
      Cancel
    </button>
  );
}

const SettingsPage: NextPageWithLayout = () => {
  const { user } = useUser();
  const userId = user?.id ? String(user.id) : null;
  const userRole = user?.role ?? null;
  const userToken = user?.token ?? null;
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = React.useState<SettingsTab>("profile");
  const [showCurrentPassword, setShowCurrentPassword] = React.useState(false);
  const [showNewPassword, setShowNewPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [landlord, setLandlord] = React.useState<LandlordDTO | null>(null);
  const [isLoadingLandlord, setIsLoadingLandlord] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isUploadingDoc, setIsUploadingDoc] = React.useState<string | null>(
    null,
  );
  const [
    hasPendingLandlordVerification,
    setHasPendingLandlordVerification,
  ] = React.useState(false);

  const [profileForm, setProfileForm] = React.useState({
    businessName: "",
    businessEmail: "",
    businessPhoneNumber: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    country: "Nigeria",
  });
  const [documentsForm, setDocumentsForm] = React.useState({
    govermentIdDocumentId: "",
    landSurveyDocumentId: "",
    proofOfOwnershipDocumentId: "",
    taxIdentificationNumberDocumentId: "",
  });
  const [platformPrefsForm, setPlatformPrefsForm] = React.useState({
    defaultCurrency: "NGN",
    defaultLateFeeAmount: "0",
    language: "en",
  });
  const [gracePeriodForm, setGracePeriodForm] = React.useState({
    monthlyRentGracePeriod: "NO_GRACE_PERIOD",
    quarterlyRentGracePeriod: "NO_GRACE_PERIOD",
    yearlyRentGracePeriod: "NO_GRACE_PERIOD",
  });
  const [lateFeeForm, setLateFeeForm] = React.useState({
    lateFeeAmount: "0",
    lateFeeType: "fixed" as "fixed" | "percentage",
  });
  // Notification preferences state
  const [notifications, setNotifications] = React.useState({
    payment: { email: true, push: true, sms: false },
    maintenance: { email: true, push: true, sms: true },
    overdue: { email: true, push: false, sms: true },
    reports: { email: true, push: false, sms: false },
  });
  const [isEditingProfile, setIsEditingProfile] = React.useState(false);
  const [profileSnapshot, setProfileSnapshot] = React.useState(profileForm);
  const [landlordSettingsLoaded, setLandlordSettingsLoaded] =
    React.useState(false);
  const [isEditingPayment, setIsEditingPayment] = React.useState(false);
  const [isEditingNotifications, setIsEditingNotifications] =
    React.useState(false);
  const [isEditingPreferences, setIsEditingPreferences] = React.useState(false);
  const [isEditingPassword, setIsEditingPassword] = React.useState(false);
  const [paymentSnapshot, setPaymentSnapshot] =
    React.useState<PaymentFormState>({
      bankCode: "",
      bankName: "",
      accountNumber: "",
      accountName: "",
      bvn: "",
    });
  const [notificationsSnapshot, setNotificationsSnapshot] =
    React.useState(notifications);
  const [preferencesSnapshot, setPreferencesSnapshot] =
    React.useState<PreferencesSnapshot>({
      platformPrefsForm: {
        defaultCurrency: "NGN",
        defaultLateFeeAmount: "0",
        language: "en",
      },
      gracePeriodForm: {
        monthlyRentGracePeriod: "NO_GRACE_PERIOD",
        quarterlyRentGracePeriod: "NO_GRACE_PERIOD",
        yearlyRentGracePeriod: "NO_GRACE_PERIOD",
      },
      lateFeeForm: { lateFeeAmount: "0", lateFeeType: "fixed" },
    });
  const [passwordForm, setPasswordForm] = React.useState({
    current: "",
    new: "",
    confirm: "",
  });
  /** Draft phone in the yellow banner — not persisted until Save. */
  const [pendingBusinessPhone, setPendingBusinessPhone] = React.useState("");

  const [paymentForm, setPaymentForm] = React.useState<PaymentFormState>({
    bankCode: "",
    bankName: "",
    accountNumber: "",
    accountName: "",
    bvn: "",
  });
  const [paymentBanks, setPaymentBanks] = React.useState<WithdrawalBankDTO[]>(
    [],
  );
  const [paymentBanksLoading, setPaymentBanksLoading] = React.useState(false);
  const [paymentResolveLoading, setPaymentResolveLoading] =
    React.useState(false);
  const [isPaymentAccountResolved, setIsPaymentAccountResolved] =
    React.useState(false);

  const paymentAutoResolveTimerRef = React.useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const paymentLastResolvedSignatureRef = React.useRef("");
  const paymentResolveRequestIdRef = React.useRef(0);
  const paymentAutoResolveFailedSignatureRef = React.useRef("");

  const syncPaymentFormFromBankAccount = React.useCallback(
    (ba: PaymentBankAccountFields) => {
      const digits = String(ba.accountNumber ?? ba.accountCode ?? "")
        .replace(/\D/g, "")
        .slice(0, PAY_ACCOUNT_LEN);
      const code = String(ba.bankCode ?? "").trim();
      setPaymentForm({
        bankCode: code,
        bankName: String(ba.bankName ?? ""),
        accountNumber: digits,
        accountName: String(ba.accountName ?? "").trim(),
        bvn: String(ba.bvn ?? "")
          .replace(/\D/g, "")
          .slice(0, PAY_BVN_LEN),
      });
      if (
        digits.length === PAY_ACCOUNT_LEN &&
        code &&
        String(ba.accountName ?? "").trim()
      ) {
        paymentLastResolvedSignatureRef.current = `${code}:${digits}`;
        setIsPaymentAccountResolved(true);
      } else {
        paymentLastResolvedSignatureRef.current = "";
        setIsPaymentAccountResolved(false);
      }
    },
    [],
  );

  const applyProfileFormFromLandlord = React.useCallback(
    (data: LandlordDTO, fallbackEmail?: string) => {
      const next: ProfileFormState = {
        businessName: data.businessName ?? data.landLordName ?? "",
        businessEmail:
          data.businessEmail ?? data.user?.email ?? fallbackEmail ?? "",
        businessPhoneNumber: resolveLandlordBusinessPhone(data),
        address: data.address?.address ?? "",
        city: data.address?.city ?? "",
        state: data.address?.state ?? "",
        postalCode: data.address?.postalCode ?? "",
        country: data.address?.country ?? "Nigeria",
      };
      setProfileForm(next);
      setProfileSnapshot(next);
      return next;
    },
    [],
  );

  const applyLandlordSettings = React.useCallback(
    (settings: LandlordSettingsDTO) => {
      const notif = settings.notificationPreferences;
      if (notif) {
        setNotifications({
          payment: notificationChannelsToBooleans(notif.paymentNotifications),
          maintenance: notificationChannelsToBooleans(
            notif.maintenanceRequestNotifications,
          ),
          overdue: notificationChannelsToBooleans(notif.overDueNotifications),
          reports: notificationChannelsToBooleans(
            notif.weeklyReportsNotifications,
          ),
        });
      }

      const platform = settings.platformPreferences;
      const lateFee = settings.lateFeeSettings;
      const grace = settings.gracePeriodPeriods;
      setPlatformPrefsForm({
        defaultCurrency: platform?.defaultCurrency ?? "NGN",
        defaultLateFeeAmount: String(
          platform?.defaultLateFeeAmount ?? lateFee?.lateFeeAmount ?? 0,
        ),
        language: platform?.language ?? "en",
      });
      if (grace) {
        setGracePeriodForm({
          monthlyRentGracePeriod:
            grace.monthlyRentDueDateGracePeriod ?? "NO_GRACE_PERIOD",
          quarterlyRentGracePeriod:
            grace.quarterlyRentDueDateGracePeriod ?? "NO_GRACE_PERIOD",
          yearlyRentGracePeriod:
            grace.yearlyRentDueDateGracePeriod ?? "NO_GRACE_PERIOD",
        });
      }
      if (lateFee) {
        setLateFeeForm({
          lateFeeAmount: String(lateFee.lateFeeAmount ?? 0),
          lateFeeType:
            lateFee.lateFeeType === "percentage" ? "percentage" : "fixed",
        });
      }

      const ba = pickBankAccountFromSettings(settings);
      if (ba) {
        syncPaymentFormFromBankAccount(ba);
      }
      setLandlordSettingsLoaded(true);
    },
    [syncPaymentFormFromBankAccount],
  );

  const refreshLandlordFromApi = React.useCallback(
    async (id: string) => {
      const landlordFetch =
        userId != null ? getLandlordByUser(userId) : getLandlord(id);
      const [landlordResult, settingsResult] = await Promise.all([
        landlordFetch,
        getLandlordSettings(id),
      ]);

      if (landlordResult.success) {
        setLandlord(landlordResult.data);
        applyProfileFormFromLandlord(landlordResult.data, user?.email);
        if (typeof window !== "undefined") {
          console.info(
            PROFILE_SETTINGS_LOG,
            userId != null
              ? "GET /landlord/user/:userId after save:"
              : "GET /landlord/:id after save:",
            {
              businessPhoneNumber: landlordResult.data.businessPhoneNumber,
              userPhoneNumber: landlordResult.data.user?.phoneNumber ?? null,
              resolvedBusinessPhone: resolveLandlordBusinessPhone(
                landlordResult.data,
              ),
              landlord: landlordResult.data,
            },
          );
        }
      } else if (typeof window !== "undefined") {
        console.warn(
          PROFILE_SETTINGS_LOG,
          userId != null
            ? "GET /landlord/user/:userId after save — failed:"
            : "GET /landlord/:id after save — failed:",
          landlordResult.error,
        );
      }

      if (settingsResult.success) {
        applyLandlordSettings(settingsResult.data);
        if (typeof window !== "undefined") {
          console.info(LANDLORD_SETTINGS_LOG, "GET /landlord/:id/settings:", {
            bankAccount: settingsResult.data.bankAccount,
            notificationPreferences:
              settingsResult.data.notificationPreferences,
            platformPreferences: settingsResult.data.platformPreferences,
          });
        }
      } else if (typeof window !== "undefined") {
        console.warn(
          LANDLORD_SETTINGS_LOG,
          "GET /landlord/:id/settings after save — failed:",
          settingsResult.error,
        );
      }

      return { landlordResult, settingsResult };
    },
    [applyLandlordSettings, applyProfileFormFromLandlord, user?.email, userId],
  );

  const applyBusinessPhoneToState = React.useCallback((phone: string) => {
    const trimmed = phone.trim();
    setLandlord((prev) =>
      prev
        ? {
            ...prev,
            businessPhoneNumber: trimmed,
            user: prev.user
              ? { ...prev.user, phoneNumber: trimmed }
              : prev.user,
          }
        : prev,
    );
    setProfileForm((prev) => ({ ...prev, businessPhoneNumber: trimmed }));
    setProfileSnapshot((prev) => ({ ...prev, businessPhoneNumber: trimmed }));
  }, []);

  const loadLandlordData = React.useCallback(
    async (id: string) => {
      const landlordFetch =
        userId != null ? getLandlordByUser(userId) : getLandlord(id);
      const [landlordResult, settingsResult] = await Promise.all([
        landlordFetch,
        getLandlordSettings(id),
      ]);

      if (landlordResult.success) {
        setLandlord(landlordResult.data);
        applyProfileFormFromLandlord(landlordResult.data, user?.email);
      }

      if (settingsResult.success) {
        applyLandlordSettings(settingsResult.data);
      }

      return { landlordResult, settingsResult };
    },
    [applyLandlordSettings, applyProfileFormFromLandlord, user?.email, userId],
  );

  const landlordId = landlord?.id as string | undefined;
  const isLandlordVerified = landlord?.isApproved === true;

  const hasSavedBankAccount = React.useMemo(() => {
    const digits = paymentForm.accountNumber.replace(/\D/g, "");
    const bvn = paymentForm.bvn.replace(/\D/g, "");
    return Boolean(
      paymentForm.bankCode.trim() &&
        digits.length === PAY_ACCOUNT_LEN &&
        paymentForm.accountName.trim() &&
        bvn.length === PAY_BVN_LEN,
    );
  }, [paymentForm]);

  const hasSavedNotifications =
    landlordSettingsLoaded && userRole === "landlord" && Boolean(landlordId);
  const hasSavedPreferences = hasSavedNotifications;

  const canEditPayment = !hasSavedBankAccount || isEditingPayment;
  const canEditNotifications = !hasSavedNotifications || isEditingNotifications;
  const canEditPreferences = !hasSavedPreferences || isEditingPreferences;
  const canEditPassword = isEditingPassword;

  // Fetch landlord profile for landlords
  React.useEffect(() => {
    const fetchLandlord = async () => {
      if (!user?.id) {
        setIsLoadingLandlord(false);
        return;
      }

      setIsLoadingLandlord(true);

      // Tenant/manager/admin settings should still load live profile data
      // instead of waiting on landlord-specific endpoints.
      if (user.role !== "landlord") {
        const profile = await getProfile(user.token);
        if (profile.success) {
          const p = profile.data.data;
          setProfileForm((prev) => ({
            ...prev,
            businessName: p.fullName ?? p.name ?? user.name ?? "",
            businessEmail: p.email ?? user.email ?? "",
            businessPhoneNumber: p.phoneNumber ?? "",
            address: "",
            city: "",
            state: "",
            postalCode: "",
            country: "Nigeria",
          }));
        }
        setIsLoadingLandlord(false);
        return;
      }

      const result = await getLandlordByUser(user.id as string);
      if (result.success) {
        console.log("[Settings] landlord payload for document preview:", {
          govermentIdDocumentId: result.data.govermentIdDocumentId,
          landSurveyDocumentId: result.data.landSurveyDocumentId,
          proofOfOwnershipDocumentId: result.data.proofOfOwnershipDocumentId,
          taxIdentificationNumberDocumentId:
            result.data.taxIdentificationNumberDocumentId,
          govermentIdDocument: (
            result.data as unknown as Record<string, unknown>
          ).govermentIdDocument,
          governmentIdDocument: (
            result.data as unknown as Record<string, unknown>
          ).governmentIdDocument,
          landSurveyDocument: (
            result.data as unknown as Record<string, unknown>
          ).landSurveyDocument,
          proofOfOwnershipDocument: (
            result.data as unknown as Record<string, unknown>
          ).proofOfOwnershipDocument,
          taxIdentificationNumberDocument: (
            result.data as unknown as Record<string, unknown>
          ).taxIdentificationNumberDocument,
        });
        setLandlord(result.data);
        applyProfileFormFromLandlord(result.data, user?.email);
        setDocumentsForm({
          govermentIdDocumentId: result.data.govermentIdDocumentId ?? "",
          landSurveyDocumentId: result.data.landSurveyDocumentId ?? "",
          proofOfOwnershipDocumentId:
            result.data.proofOfOwnershipDocumentId ?? "",
          taxIdentificationNumberDocumentId:
            result.data.taxIdentificationNumberDocumentId ?? "",
        });
      }

      setIsLoadingLandlord(false);
    };

    fetchLandlord();
  }, [user, applyProfileFormFromLandlord]);

  // Profile from GET /landlord/:id; bank, notifications, prefs from GET /landlord/:id/settings
  React.useEffect(() => {
    if (!landlordId || userRole !== "landlord") return;
    let cancelled = false;
    void loadLandlordData(landlordId).then(
      ({ landlordResult, settingsResult }) => {
        if (cancelled) return;
        if (typeof window === "undefined") return;
        if (!landlordResult.success) {
          console.warn(
            PROFILE_SETTINGS_LOG,
            "GET /landlord/:id — failed:",
            landlordResult.error,
          );
        }
        if (!settingsResult.success) {
          console.warn(
            LANDLORD_SETTINGS_LOG,
            "GET /landlord/:id/settings — failed:",
            settingsResult.error,
          );
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [landlordId, loadLandlordData, userRole]);

  React.useEffect(() => {
    if (!landlordId || userRole !== "landlord") {
      setHasPendingLandlordVerification(false);
      return;
    }

    let cancelled = false;
    void queryVerifications({ landlordId, status: "PENDING" }).then(
      (result) => {
        if (cancelled) return;
        if (!result.success) {
          setHasPendingLandlordVerification(false);
          return;
        }

        setHasPendingLandlordVerification(
          result.data.some((verification) => {
            const status = String(verification.status).toUpperCase();
            const rowLandlordId = entityLandlordId(verification);
            return (
              status === "PENDING" &&
              deriveVerificationKind(verification) === "landlord" &&
              (!rowLandlordId || rowLandlordId === landlordId)
            );
          }),
        );
      },
    );

    return () => {
      cancelled = true;
    };
  }, [landlordId, userRole]);

  React.useEffect(() => {
    setLandlordSettingsLoaded(false);
    setIsEditingPayment(false);
    setIsEditingNotifications(false);
    setIsEditingPreferences(false);
    setIsEditingPassword(false);
  }, [landlordId]);

  React.useEffect(() => {
    if (userRole !== "landlord" && activeTab === "payment-details") {
      setActiveTab("profile");
    }
  }, [userRole, activeTab]);

  React.useEffect(() => {
    let cancelled = false;
    if (!landlordId || userRole !== "landlord") return;
    setPaymentBanksLoading(true);
    void getWithdrawalBanksByCurrency("NGN").then((result) => {
      if (cancelled) return;
      if (result.success) setPaymentBanks(result.data);
      else {
        setPaymentBanks([]);
        showToast(result.error || "Failed to load banks", "error");
      }
      setPaymentBanksLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [landlordId, userRole, showToast]);

  const getInitials = (name: string) => {
    if (!name) return "JD";
    const parts = name.trim().split(/\s+/);
    const first = parts[0]?.[0] || "";
    const last = parts.length > 1 ? parts[parts.length - 1]?.[0] || "" : "";
    return `${first}${last}`.toUpperCase() || "JD";
  };

  const businessDisplayName =
    profileForm.businessName ||
    landlord?.businessName ||
    landlord?.landLordName ||
    "";
  const businessDisplayEmail =
    profileForm.businessEmail ||
    landlord?.businessEmail ||
    landlord?.user?.email ||
    user?.email ||
    "";
  const businessDisplayPhone =
    resolveLandlordBusinessPhone(landlord) ||
    (isEditingProfile ? profileForm.businessPhoneNumber.trim() : "");
  const needsBusinessPhonePrompt =
    !resolveLandlordBusinessPhone(landlord) && !isEditingProfile;
  const profileName = businessDisplayName || user?.name || "Landlord";
  const profilePicture = landlord?.profilePicture?.url;
  const initials = getInitials(profileName);

  const settingsTabs = React.useMemo(() => {
    const all: Array<{
      id: SettingsTab;
      label: string;
      icon: React.ComponentType<{ className?: string }>;
    }> = [
      { id: "profile", label: "Profile", icon: User },
      { id: "documents", label: "Documents", icon: FileText },
      { id: "notifications", label: "Notifications", icon: Bell },
      {
        id: "payment-details",
        label: "Payment Details",
        icon: CreditCard,
      },
      { id: "preferences", label: "Preferences", icon: SettingsIcon },
      {
        id: "change-password",
        label: "Change Password",
        icon: Lock,
      },
    ];
    if (userRole !== "landlord") {
      return all.filter((t) => t.id !== "payment-details");
    }
    return all;
  }, [userRole]);

  const resolvePaymentAccount = React.useCallback(
    async (options?: { silent?: boolean }) => {
      const silent = options?.silent ?? false;
      const digits = paymentForm.accountNumber.replace(/\D/g, "");
      const code = paymentForm.bankCode.trim();
      if (!code || digits.length !== PAY_ACCOUNT_LEN) {
        if (!silent) {
          showToast(
            !code ? "Select a bank" : "Enter a valid 10-digit account number",
            "error",
          );
        }
        return false;
      }
      const signature = `${code}:${digits}`;
      const reqId = ++paymentResolveRequestIdRef.current;
      setPaymentResolveLoading(true);
      const result = await resolveWithdrawalAccount({
        bankCode: code,
        accountNumber: digits,
      });
      if (reqId !== paymentResolveRequestIdRef.current) {
        setPaymentResolveLoading(false);
        return false;
      }
      setPaymentResolveLoading(false);

      if (result.success) {
        const name = result.data.accountName?.trim() ?? "";
        paymentLastResolvedSignatureRef.current = signature;
        paymentAutoResolveFailedSignatureRef.current = "";
        setPaymentForm((prev) => ({
          ...prev,
          accountName: name || prev.accountName,
        }));
        setIsPaymentAccountResolved(Boolean(name));
        if (!silent) {
          if (name) showToast("Account verified", "success");
          else {
            showToast(
              "Resolved, but the bank did not return an account holder name.",
              "warning",
            );
          }
        }
        return Boolean(name);
      }

      paymentLastResolvedSignatureRef.current = "";
      setIsPaymentAccountResolved(false);
      if (silent) {
        paymentAutoResolveFailedSignatureRef.current = signature;
      } else {
        showToast(result.error || "Failed to resolve account", "error");
      }
      return false;
    },
    [paymentForm.accountNumber, paymentForm.bankCode, showToast],
  );

  const handleResolvePaymentAccount = React.useCallback(async () => {
    paymentAutoResolveFailedSignatureRef.current = "";
    await resolvePaymentAccount({ silent: false });
  }, [resolvePaymentAccount]);

  React.useEffect(() => {
    if (hasSavedBankAccount && !isEditingPayment) return;

    const digits = paymentForm.accountNumber.replace(/\D/g, "");
    const code = paymentForm.bankCode.trim();

    if (digits.length !== PAY_ACCOUNT_LEN || !code) {
      paymentLastResolvedSignatureRef.current = "";
      paymentAutoResolveFailedSignatureRef.current = "";
      setIsPaymentAccountResolved(false);
      return;
    }

    const signature = `${code}:${digits}`;
    if (signature === paymentLastResolvedSignatureRef.current) {
      return;
    }
    if (signature === paymentAutoResolveFailedSignatureRef.current) {
      return;
    }

    if (paymentAutoResolveTimerRef.current) {
      clearTimeout(paymentAutoResolveTimerRef.current);
    }

    paymentAutoResolveTimerRef.current = setTimeout(() => {
      paymentAutoResolveTimerRef.current = null;
      void resolvePaymentAccount({ silent: true });
    }, 450);

    return () => {
      if (paymentAutoResolveTimerRef.current) {
        clearTimeout(paymentAutoResolveTimerRef.current);
        paymentAutoResolveTimerRef.current = null;
      }
    };
  }, [
    hasSavedBankAccount,
    isEditingPayment,
    paymentForm.accountNumber,
    paymentForm.bankCode,
    resolvePaymentAccount,
  ]);

  const handlePaymentBankChange = React.useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const code = event.target.value;
      const idx = paymentBanks.findIndex(
        (item) => bankOptionCode(item) === code,
      );
      const bank = idx >= 0 ? paymentBanks[idx] : undefined;
      const name = bank ? bankOptionName(bank, idx) : "";
      setPaymentForm((prev) => ({
        ...prev,
        bankCode: code,
        bankName: name,
        accountName: "",
      }));
      setIsPaymentAccountResolved(false);
      paymentLastResolvedSignatureRef.current = "";
      paymentAutoResolveFailedSignatureRef.current = "";
    },
    [paymentBanks],
  );

  const handlePaymentFieldChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = event.target;
      if (name === "bvn") {
        const next = value.replace(/\D/g, "").slice(0, PAY_BVN_LEN);
        setPaymentForm((prev) => ({ ...prev, bvn: next }));
        return;
      }
      if (name === "accountNumber") {
        const next = value.replace(/\D/g, "").slice(0, PAY_ACCOUNT_LEN);
        setIsPaymentAccountResolved(false);
        paymentLastResolvedSignatureRef.current = "";
        setPaymentForm((prev) => ({
          ...prev,
          accountNumber: next,
          accountName: "",
        }));
        return;
      }
      if (name === "accountName") {
        setPaymentForm((prev) => ({ ...prev, accountName: value }));
        return;
      }
    },
    [],
  );

  const handleSavePaymentDetails = React.useCallback(async () => {
    if (!landlordId || userRole !== "landlord") {
      showToast("Landlord account not found.", "error");
      return;
    }
    const bvn = paymentForm.bvn.replace(/\D/g, "");
    const bankCode = paymentForm.bankCode.trim();
    const bankName = paymentForm.bankName.trim();
    const digits = paymentForm.accountNumber.replace(/\D/g, "");
    const accountName = paymentForm.accountName.trim();

    if (bvn.length !== PAY_BVN_LEN) {
      showToast(`BVN must be ${PAY_BVN_LEN} digits.`, "error");
      return;
    }
    if (!bankCode || !bankName) {
      showToast("Select your bank.", "error");
      return;
    }
    if (digits.length !== PAY_ACCOUNT_LEN) {
      showToast("Account number must be 10 digits.", "error");
      return;
    }
    const sig = `${bankCode}:${digits}`;
    if (
      !isPaymentAccountResolved ||
      !accountName ||
      paymentLastResolvedSignatureRef.current !== sig
    ) {
      showToast(
        "Verify your account number so the account name matches your bank records.",
        "error",
      );
      return;
    }

    const bankPayload: { bankAccount: LandlordBankAccountDTO } = {
      bankAccount: {
        accountName,
        accountNumber: digits,
        bankName,
        bankCode,
        bvn,
      },
    };

    if (typeof window !== "undefined") {
      console.info(
        PAYMENT_SETTINGS_LOG,
        "PATCH /landlord/:id body (save bank):",
        JSON.stringify(bankPayload, null, 2),
      );
    }

    setIsSaving(true);
    const result = await updateLandlord(landlordId, bankPayload);
    setIsSaving(false);

    if (typeof window !== "undefined") {
      console.info(
        PAYMENT_SETTINGS_LOG,
        "PATCH /landlord/:id response:",
        result.success ? { success: true, data: result.data } : result,
      );
    }

    if (result.success) {
      showToast("Bank details saved.", "success");
      setIsEditingPayment(false);
      await refreshLandlordFromApi(landlordId);
    } else {
      showToast(result.error || "Failed to save bank details", "error");
    }
  }, [
    isPaymentAccountResolved,
    landlordId,
    paymentForm,
    refreshLandlordFromApi,
    showToast,
    userRole,
  ]);

  const handleSaveBusinessPhone = React.useCallback(async () => {
    if (!landlordId) return;
    const phoneTrim = pendingBusinessPhone.trim();
    if (!phoneTrim) {
      showToast("Business phone number is required.", "error");
      return;
    }
    if (!isValidPhoneNumber(phoneTrim)) {
      showToast(
        "Please enter a valid business phone number (including country code).",
        "error",
      );
      return;
    }

    const payload = buildLandlordProfilePayload(
      profileForm,
      landlord,
      phoneTrim,
    );
    if (
      !payload.businessName ||
      !payload.businessEmail ||
      !payload.address.address ||
      !payload.address.city ||
      !payload.address.state
    ) {
      showToast(
        "Complete your business profile (name, email, address) before adding a phone number.",
        "error",
      );
      return;
    }

    if (typeof window !== "undefined") {
      console.info(
        PROFILE_SETTINGS_LOG,
        "PATCH /landlord/:id/profile — request",
        {
          landlordId,
          url: `/landlord/${landlordId}/profile`,
          body: payload,
        },
      );
    }

    setIsSaving(true);
    const result = await updateLandlordProfileSettings(landlordId, payload);
    setIsSaving(false);

    if (typeof window !== "undefined") {
      console.info(
        PROFILE_SETTINGS_LOG,
        "PATCH /landlord/:id/profile — response",
        result,
      );
    }

    if (!result.success) {
      showToast(result.error || "Failed to save phone number", "error");
      return;
    }

    const patchPhone = result.data
      ? resolveLandlordBusinessPhone(result.data)
      : "";
    if (patchPhone) {
      applyBusinessPhoneToState(patchPhone);
    }

    setPendingBusinessPhone("");
    const refreshed = await refreshLandlordFromApi(landlordId);
    const serverPhone = refreshed.landlordResult.success
      ? resolveLandlordBusinessPhone(refreshed.landlordResult.data)
      : "";

    if (serverPhone) {
      applyBusinessPhoneToState(serverPhone);
      showToast("Business phone saved.", "success");
    } else if (payload.businessPhoneNumber) {
      showToast("Business phone could not be verified after save.", "error");
    } else {
      showToast("Business phone could not be verified after save.", "error");
    }
  }, [
    applyBusinessPhoneToState,
    landlord,
    landlordId,
    pendingBusinessPhone,
    profileForm,
    refreshLandlordFromApi,
    showToast,
  ]);

  const handleNotificationChange = (
    category: keyof typeof notifications,
    type: "email" | "push" | "sms",
  ) => {
    setNotifications((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [type]: !prev[category][type],
      },
    }));
  };

  const toNotificationArray = React.useCallback(
    (v: { email: boolean; push: boolean; sms: boolean }) => {
      const channels: string[] = [];
      if (v.email) channels.push("EMAIL_NOTIFICATION");
      if (v.push) channels.push("PUSH_NOTIFICATION");
      if (v.sms) channels.push("APP_NOTIFICATION");
      return channels;
    },
    [],
  );

  const handleSaveProfile = React.useCallback(async () => {
    if (!landlordId) return;
    const trimmedName = profileForm.businessName.trim();
    const trimmedEmail = profileForm.businessEmail.trim();
    const addr = {
      address: profileForm.address.trim(),
      city: profileForm.city.trim(),
      state: profileForm.state.trim(),
      country: profileForm.country.trim(),
    };
    if (!trimmedName || !trimmedEmail) {
      showToast("Business name and business email are required.", "error");
      return;
    }
    if (!addr.address || !addr.city || !addr.state || !addr.country) {
      showToast(
        "Address, city, state, and country are required for your business profile.",
        "error",
      );
      return;
    }
    const phoneTrim = profileForm.businessPhoneNumber.trim();
    if (phoneTrim && !isValidPhoneNumber(phoneTrim)) {
      showToast(
        "Please enter a valid business phone number (including country code).",
        "error",
      );
      return;
    }
    setIsSaving(true);
    const payload = buildLandlordProfilePayload(profileForm, landlord);
    if (typeof window !== "undefined") {
      console.info(
        PROFILE_SETTINGS_LOG,
        "PATCH /landlord/:id/profile — request",
        {
          landlordId,
          url: `/landlord/${landlordId}/profile`,
          body: payload,
        },
      );
    }
    const result = await updateLandlordProfileSettings(landlordId, payload);
    if (typeof window !== "undefined") {
      console.info(
        PROFILE_SETTINGS_LOG,
        "PATCH /landlord/:id/profile — response",
        result,
      );
    }
    if (result.success) {
      const patchPhone = result.data
        ? resolveLandlordBusinessPhone(result.data)
        : "";
      if (patchPhone) {
        applyBusinessPhoneToState(patchPhone);
      }
      await refreshLandlordFromApi(landlordId);
      setProfileSnapshot(profileForm);
      setIsEditingProfile(false);
      showToast("Profile updated successfully", "success");
    } else showToast(result.error || "Failed to update profile", "error");
    setIsSaving(false);
  }, [
    applyBusinessPhoneToState,
    landlord,
    landlordId,
    profileForm,
    refreshLandlordFromApi,
    showToast,
  ]);

  const toDocumentsPayload = React.useCallback(
    (documents: typeof documentsForm) => ({
      govermentIdDocumentId: documents.govermentIdDocumentId,
      landSurveyDocumentId: documents.landSurveyDocumentId,
      proofOfOwnershipDocumentId: documents.proofOfOwnershipDocumentId,
      taxIdentificationNumberDocumentId:
        documents.taxIdentificationNumberDocumentId,
    }),
    [],
  );

  const handleSaveDocuments = React.useCallback(async () => {
    if (!landlordId) return;
    const missingDocuments = Object.values(documentsForm).some(
      (documentId) => !documentId,
    );
    if (missingDocuments) {
      showToast("Please upload all verification documents.", "error");
      return;
    }
    setIsSaving(true);
    const result = await updateLandlordDocumentsSettings(
      landlordId,
      toDocumentsPayload(documentsForm),
    );
    setIsSaving(false);
    if (result.success) {
      showToast("Documents updated successfully", "success");
      if (userId) {
        const refreshed = await getLandlordByUser(userId);
        if (refreshed.success) setLandlord(refreshed.data);
      }
    } else showToast(result.error || "Failed to update documents", "error");
  }, [documentsForm, landlordId, showToast, toDocumentsPayload, userId]);

  const handleSavePreferences = React.useCallback(async () => {
    if (!landlordId) return;
    setIsSaving(true);
    const [platformResult, graceResult, lateFeeResult] = await Promise.all([
      updateLandlordPlatformPreferencesSettings(landlordId, {
        defaultCurrency: platformPrefsForm.defaultCurrency,
        defaultLateFeeAmount: Number(
          platformPrefsForm.defaultLateFeeAmount || 0,
        ),
        language: platformPrefsForm.language,
      }),
      updateLandlordGracePeriodsSettings(landlordId, {
        monthlyRentGracePeriod: gracePeriodForm.monthlyRentGracePeriod,
        quarterlyRentGracePeriod: gracePeriodForm.quarterlyRentGracePeriod,
        yearlyRentGracePeriod: gracePeriodForm.yearlyRentGracePeriod,
      }),
      updateLandlordLateFeeSettings(landlordId, {
        lateFeeAmount: Number(lateFeeForm.lateFeeAmount || 0),
        lateFeeType: lateFeeForm.lateFeeType,
      }),
    ]);
    setIsSaving(false);
    if (
      platformResult.success &&
      graceResult.success &&
      lateFeeResult.success
    ) {
      showToast("Preferences saved", "success");
      setIsEditingPreferences(false);
      const refreshed = await getLandlordSettings(landlordId);
      if (refreshed.success) applyLandlordSettings(refreshed.data);
    } else {
      const err =
        (!platformResult.success && platformResult.error) ||
        (!graceResult.success && graceResult.error) ||
        (!lateFeeResult.success && lateFeeResult.error) ||
        "Failed to save preferences";
      showToast(err, "error");
    }
  }, [
    applyLandlordSettings,
    gracePeriodForm,
    landlordId,
    lateFeeForm,
    platformPrefsForm,
    showToast,
  ]);

  const handleSaveNotifications = React.useCallback(async () => {
    if (!landlordId) return;
    setIsSaving(true);
    const result = await updateLandlordNotificationPreferencesSettings(
      landlordId,
      {
        paymentNotifications: toNotificationArray(notifications.payment),
        maintenanceRequestNotifications: toNotificationArray(
          notifications.maintenance,
        ),
        overDueNotifications: toNotificationArray(notifications.overdue),
        weeklyReportsNotifications: toNotificationArray(notifications.reports),
      },
    );
    setIsSaving(false);
    if (result.success) {
      showToast("Notification preferences saved", "success");
      setIsEditingNotifications(false);
      const refreshed = await getLandlordSettings(landlordId);
      if (refreshed.success) applyLandlordSettings(refreshed.data);
    } else showToast(result.error || "Failed to save notifications", "error");
  }, [
    applyLandlordSettings,
    landlordId,
    notifications,
    showToast,
    toNotificationArray,
  ]);

  const handleUploadDocument = React.useCallback(
    async (
      key:
        | "govermentIdDocumentId"
        | "landSurveyDocumentId"
        | "proofOfOwnershipDocumentId"
        | "taxIdentificationNumberDocumentId",
      file: File,
    ) => {
      if (!userToken) {
        showToast("You must be signed in to upload files", "error");
        return;
      }
      if (isLandlordVerified && hasPendingLandlordVerification) {
        showToast(
          "A landlord verification is already pending. You can reupload after admin review.",
          "info",
        );
        return;
      }
      setIsUploadingDoc(key);
      const result = await uploadFile({
        file,
        folder: "landlord",
        label: key,
        token: userToken,
      });
      if (!result.success) {
        setIsUploadingDoc(null);
        showToast(result.error || "Failed to upload document", "error");
        return;
      }

      const nextDocuments = {
        ...documentsForm,
        [key]: result.data.id,
      };

      if (isLandlordVerified) {
        if (!landlordId) {
          setIsUploadingDoc(null);
          showToast(
            "Your landlord account could not be found. Please sign in again.",
            "error",
          );
          return;
        }

        const updateResult = await updateLandlordDocumentsSettings(
          landlordId,
          toDocumentsPayload(nextDocuments),
        );
        setIsUploadingDoc(null);

        if (updateResult.success) {
          setDocumentsForm(nextDocuments);
          setHasPendingLandlordVerification(true);
          showToast(
            "Document reuploaded. A new verification has been submitted.",
            "success",
          );
          if (userId) {
            const refreshedLandlord = await getLandlordByUser(userId);
            if (refreshedLandlord.success) {
              setLandlord(refreshedLandlord.data);
            }
          }
          return;
        }

        showToast(
          updateResult.error || "Failed to submit reuploaded document",
          "error",
        );
        return;
      }

      setIsUploadingDoc(null);
      setDocumentsForm(nextDocuments);
      showToast("Document uploaded", "success");
    },
    [
      documentsForm,
      hasPendingLandlordVerification,
      isLandlordVerified,
      landlordId,
      showToast,
      toDocumentsPayload,
      userId,
      userToken,
    ],
  );

  const documentPreview = React.useMemo(() => {
    const asFileRef = (value: unknown) => {
      if (!value || typeof value !== "object") return null;
      const v = value as { url?: unknown; fileName?: unknown; id?: unknown };
      const url = typeof v.url === "string" ? v.url : "";
      const fileName = typeof v.fileName === "string" ? v.fileName : "";
      const id = typeof v.id === "string" ? v.id : "";
      if (!url && !fileName && !id) return null;
      return { url, fileName, id };
    };

    const source = landlord as Record<string, unknown> | null;
    return {
      governmentId:
        asFileRef(source?.govermentIdDocument) ??
        asFileRef(source?.governmentIdDocument),
      landSurvey: asFileRef(source?.landSurveyDocument),
      proofOfOwnership: asFileRef(source?.proofOfOwnershipDocument),
      tin: asFileRef(source?.taxIdentificationNumberDocument),
    };
  }, [landlord]);

  const renderUploadedDocumentInfo = React.useCallback(
    (
      preview: { url?: string; fileName?: string; id?: string } | null,
      uploadedId?: string,
    ) => {
      if (preview?.url) {
        return (
          <a
            href={preview.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-lg border border-brand-main bg-white px-4 py-2 text-sm font-medium text-brand-main transition hover:bg-brand-main/5"
          >
            View uploaded document
          </a>
        );
      }
      if (preview?.fileName || preview?.id || uploadedId) {
        return (
          <p className="mt-2 text-xs text-gray-500">
            {preview?.fileName ? `Uploaded (${preview.fileName})` : "Uploaded"}
          </p>
        );
      }
      return null;
    },
    [],
  );

  const isReuploadDisabled =
    isLandlordVerified && hasPendingLandlordVerification;
  const documentUploadButtonClass = `inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition ${
    isReuploadDisabled
      ? "cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400"
      : isLandlordVerified
        ? "cursor-pointer border-brand-main bg-white text-brand-main hover:bg-brand-main/5"
        : "cursor-pointer border-gray-300 bg-white text-brand-main hover:bg-gray-50"
  }`;

  return (
    <>
      <Head>
        <title>Settings | Dwelliva</title>
      </Head>

      <section className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your account and platform preferences
          </p>
        </div>

        {/* Settings Content */}
        <div className="grid gap-6 lg:grid-cols-[250px_1fr]">
          {/* Sidebar Navigation */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm h-fit"
          >
            <nav className="space-y-1">
              {settingsTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                      isActive
                        ? "bg-brand-main text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </motion.div>

          {/* Main Content Area */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
          >
            {/* Profile Tab */}
            {activeTab === "profile" && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  Profile Information
                </h2>

                {isLoadingLandlord ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-brand-main border-r-transparent"></div>
                      <p className="mt-4 text-sm text-gray-600">
                        Loading profile...
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Avatar Upload */}
                    <div className="flex items-center gap-4">
                      <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-brand-main text-2xl font-semibold text-white overflow-hidden">
                        {profilePicture ? (
                          <Image
                            src={profilePicture}
                            alt={profileName}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          initials
                        )}
                      </div>
                      <div>
                        <button
                          type="button"
                          className="text-sm font-medium text-brand-main hover:text-brand-main/80"
                        >
                          Change Photo
                        </button>
                        <p className="text-xs text-gray-500">
                          JPG, PNG up to 2MB
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                        <p className="text-sm font-semibold text-gray-900">
                          User Details
                        </p>
                        <div className="mt-3 space-y-2 text-sm text-gray-700">
                          <p>
                            <span className="font-medium text-gray-500">
                              Full Name:
                            </span>{" "}
                            {user?.name || "—"}
                          </p>
                          <p>
                            <span className="font-medium text-gray-500">
                              Email:
                            </span>{" "}
                            {user?.email || "—"}
                          </p>
                          <p>
                            <span className="font-medium text-gray-500">
                              Role:
                            </span>{" "}
                            {user?.role || "—"}
                          </p>
                        </div>
                      </div>
                      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                        <p className="text-sm font-semibold text-blue-950">
                          Business Details
                        </p>
                        <div className="mt-3 space-y-2 text-sm text-blue-900">
                          <p>
                            <span className="font-medium text-blue-700">
                              Business Name:
                            </span>{" "}
                            {businessDisplayName || "—"}
                          </p>
                          <p>
                            <span className="font-medium text-blue-700">
                              Business Email:
                            </span>{" "}
                            {businessDisplayEmail || "—"}
                          </p>
                          <p>
                            <span className="font-medium text-blue-700">
                              Business Phone:
                            </span>{" "}
                            {businessDisplayPhone || "—"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {!isEditingProfile ? (
                      <div className="space-y-4">
                        {needsBusinessPhonePrompt ? (
                          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                            <p className="text-sm font-medium text-amber-900">
                              Business phone number is required.
                            </p>
                            <p className="mt-1 text-xs text-amber-800">
                              Add it here so your landlord profile is complete.
                            </p>
                            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-stretch">
                              <div className="min-w-0 flex-1">
                                <PhoneInputWithCountry
                                  value={pendingBusinessPhone || undefined}
                                  onChange={(v) =>
                                    setPendingBusinessPhone(v ?? "")
                                  }
                                  placeholder="Business phone"
                                  className="border-amber-300 bg-white"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={handleSaveBusinessPhone}
                                disabled={
                                  isSaving ||
                                  !pendingBusinessPhone.trim() ||
                                  !isValidPhoneNumber(pendingBusinessPhone)
                                }
                                className="shrink-0 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-70"
                              >
                                {isSaving ? "Saving..." : "Save"}
                              </button>
                            </div>
                          </div>
                        ) : null}

                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          type="button"
                          onClick={() => {
                            setProfileSnapshot(profileForm);
                            setIsEditingProfile(true);
                          }}
                          className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
                        >
                          <Pencil className="h-4 w-4" />
                          Edit Profile
                        </motion.button>
                      </div>
                    ) : (
                      <>
                        <div className="grid gap-4 sm:grid-cols-2 rounded-lg border border-gray-200 bg-white p-4">
                          <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                              Business Name
                            </label>
                            <input
                              type="text"
                              value={profileForm.businessName}
                              onChange={(e) =>
                                setProfileForm((prev) => ({
                                  ...prev,
                                  businessName: e.target.value,
                                }))
                              }
                              className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-main focus:outline-none focus:ring-2 focus:ring-brand-main"
                            />
                          </div>
                          <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                              Email Address
                            </label>
                            <input
                              type="email"
                              value={profileForm.businessEmail}
                              onChange={(e) =>
                                setProfileForm((prev) => ({
                                  ...prev,
                                  businessEmail: e.target.value,
                                }))
                              }
                              className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-main focus:outline-none focus:ring-2 focus:ring-brand-main"
                            />
                          </div>
                          <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                              Phone Number
                            </label>
                            <PhoneInputWithCountry
                              value={
                                profileForm.businessPhoneNumber || undefined
                              }
                              onChange={(v) =>
                                setProfileForm((prev) => ({
                                  ...prev,
                                  businessPhoneNumber: v ?? "",
                                }))
                              }
                              placeholder="801 234 5678"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                              Address
                            </label>
                            <input
                              type="text"
                              value={profileForm.address}
                              onChange={(e) =>
                                setProfileForm((prev) => ({
                                  ...prev,
                                  address: e.target.value,
                                }))
                              }
                              className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-main focus:outline-none focus:ring-2 focus:ring-brand-main"
                            />
                          </div>
                          <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                              City
                            </label>
                            <input
                              type="text"
                              value={profileForm.city}
                              onChange={(e) =>
                                setProfileForm((prev) => ({
                                  ...prev,
                                  city: e.target.value,
                                }))
                              }
                              className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-main focus:outline-none focus:ring-2 focus:ring-brand-main"
                            />
                          </div>
                          <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                              State
                            </label>
                            <input
                              type="text"
                              value={profileForm.state}
                              onChange={(e) =>
                                setProfileForm((prev) => ({
                                  ...prev,
                                  state: e.target.value,
                                }))
                              }
                              className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-main focus:outline-none focus:ring-2 focus:ring-brand-main"
                            />
                          </div>
                          <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                              Postal Code
                            </label>
                            <input
                              type="text"
                              value={profileForm.postalCode}
                              onChange={(e) =>
                                setProfileForm((prev) => ({
                                  ...prev,
                                  postalCode: e.target.value,
                                }))
                              }
                              className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-main focus:outline-none focus:ring-2 focus:ring-brand-main"
                            />
                          </div>
                          <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                              Country
                            </label>
                            <input
                              type="text"
                              value={profileForm.country}
                              onChange={(e) =>
                                setProfileForm((prev) => ({
                                  ...prev,
                                  country: e.target.value,
                                }))
                              }
                              className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-main focus:outline-none focus:ring-2 focus:ring-brand-main"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            type="button"
                            onClick={handleSaveProfile}
                            disabled={isSaving}
                            className="rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
                          >
                            {isSaving ? "Saving..." : "Save Changes"}
                          </motion.button>
                          <button
                            type="button"
                            onClick={() => {
                              setProfileForm(profileSnapshot);
                              setIsEditingProfile(false);
                            }}
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                          >
                            <X className="h-4 w-4" />
                            Cancel
                          </button>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Documents Tab */}
            {activeTab === "documents" && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  Verification Documents
                </h2>
                {isReuploadDisabled ? (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    A landlord verification is pending admin review. Reupload
                    will be available after this verification is reviewed.
                  </div>
                ) : isLandlordVerified ? (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                    This account is verified. You can reupload a document to
                    submit a new verification for admin approval.
                  </div>
                ) : null}

                <div className="space-y-6">
                  {/* Government Issued ID */}
                  <div>
                    <h3 className="mb-1 text-sm font-semibold text-gray-900">
                      Government Issued ID
                    </h3>
                    <p className="mb-3 text-sm text-gray-600">
                      Driver&apos;s License, National ID, or International
                      Passport
                    </p>
                    <div className="flex flex-wrap items-center gap-3">
                      <label
                        aria-disabled={isReuploadDisabled}
                        className={documentUploadButtonClass}
                        title={
                          isReuploadDisabled
                            ? "Pending verification is awaiting admin review"
                            : undefined
                        }
                      >
                        <Upload className="h-4 w-4" />
                        {isUploadingDoc === "govermentIdDocumentId"
                          ? isLandlordVerified
                            ? "Reuploading..."
                            : "Uploading..."
                          : isLandlordVerified
                            ? "Reupload"
                            : "Choose File"}
                        <input
                          type="file"
                          className="hidden"
                          disabled={isReuploadDisabled}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              void handleUploadDocument(
                                "govermentIdDocumentId",
                                file,
                              );
                            }
                          }}
                        />
                      </label>
                      {isLandlordVerified
                        ? renderUploadedDocumentInfo(
                            documentPreview.governmentId,
                            documentsForm.govermentIdDocumentId,
                          )
                        : null}
                    </div>
                    {documentsForm.govermentIdDocumentId && (
                      <p className="mt-2 text-xs text-gray-500">
                        Document uploaded
                      </p>
                    )}
                  </div>

                  {/* Land Survey Document */}
                  <div>
                    <h3 className="mb-1 text-sm font-semibold text-gray-900">
                      Land Survey Document
                    </h3>
                    <p className="mb-3 text-sm text-gray-600">
                      Property map, site plans, or official record
                    </p>
                    <div className="flex flex-wrap items-center gap-3">
                      <label
                        aria-disabled={isReuploadDisabled}
                        className={documentUploadButtonClass}
                        title={
                          isReuploadDisabled
                            ? "Pending verification is awaiting admin review"
                            : undefined
                        }
                      >
                        <Upload className="h-4 w-4" />
                        {isUploadingDoc === "landSurveyDocumentId"
                          ? isLandlordVerified
                            ? "Reuploading..."
                            : "Uploading..."
                          : isLandlordVerified
                            ? "Reupload"
                            : "Choose File"}
                        <input
                          type="file"
                          className="hidden"
                          disabled={isReuploadDisabled}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              void handleUploadDocument(
                                "landSurveyDocumentId",
                                file,
                              );
                            }
                          }}
                        />
                      </label>
                      {isLandlordVerified
                        ? renderUploadedDocumentInfo(
                            documentPreview.landSurvey,
                            documentsForm.landSurveyDocumentId,
                          )
                        : null}
                    </div>
                    {documentsForm.landSurveyDocumentId && (
                      <p className="mt-2 text-xs text-gray-500">
                        Document uploaded
                      </p>
                    )}
                  </div>

                  {/* Proof of Ownership */}
                  <div>
                    <h3 className="mb-1 text-sm font-semibold text-gray-900">
                      Proof of Ownership
                    </h3>
                    <p className="mb-3 text-sm text-gray-600">
                      Document, receipt of purchase, or transfer agreement
                    </p>
                    <div className="flex flex-wrap items-center gap-3">
                      <label
                        aria-disabled={isReuploadDisabled}
                        className={documentUploadButtonClass}
                        title={
                          isReuploadDisabled
                            ? "Pending verification is awaiting admin review"
                            : undefined
                        }
                      >
                        <Upload className="h-4 w-4" />
                        {isUploadingDoc === "proofOfOwnershipDocumentId"
                          ? isLandlordVerified
                            ? "Reuploading..."
                            : "Uploading..."
                          : isLandlordVerified
                            ? "Reupload"
                            : "Choose File (Optional)"}
                        <input
                          type="file"
                          className="hidden"
                          disabled={isReuploadDisabled}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              void handleUploadDocument(
                                "proofOfOwnershipDocumentId",
                                file,
                              );
                            }
                          }}
                        />
                      </label>
                      {isLandlordVerified
                        ? renderUploadedDocumentInfo(
                            documentPreview.proofOfOwnership,
                            documentsForm.proofOfOwnershipDocumentId,
                          )
                        : null}
                    </div>
                    {documentsForm.proofOfOwnershipDocumentId && (
                      <p className="mt-2 text-xs text-gray-500">
                        Document uploaded
                      </p>
                    )}
                  </div>

                  {/* Tax Identification Number */}
                  <div>
                    <h3 className="mb-1 text-sm font-semibold text-gray-900">
                      Tax Identification Number (TIN)
                    </h3>
                    <p className="mb-3 text-sm text-gray-600">
                      Tax certificate or TIN document
                    </p>
                    <div className="flex flex-wrap items-center gap-3">
                      <label
                        aria-disabled={isReuploadDisabled}
                        className={documentUploadButtonClass}
                        title={
                          isReuploadDisabled
                            ? "Pending verification is awaiting admin review"
                            : undefined
                        }
                      >
                        <Upload className="h-4 w-4" />
                        {isUploadingDoc === "taxIdentificationNumberDocumentId"
                          ? isLandlordVerified
                            ? "Reuploading..."
                            : "Uploading..."
                          : isLandlordVerified
                            ? "Reupload"
                            : "Choose File (Optional)"}
                        <input
                          type="file"
                          className="hidden"
                          disabled={isReuploadDisabled}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              void handleUploadDocument(
                                "taxIdentificationNumberDocumentId",
                                file,
                              );
                            }
                          }}
                        />
                      </label>
                      {isLandlordVerified
                        ? renderUploadedDocumentInfo(
                            documentPreview.tin,
                            documentsForm.taxIdentificationNumberDocumentId,
                          )
                        : null}
                    </div>
                    {documentsForm.taxIdentificationNumberDocumentId && (
                      <p className="mt-2 text-xs text-gray-500">
                        Document uploaded
                      </p>
                    )}
                  </div>
                </div>
                {!isLandlordVerified ? (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={handleSaveDocuments}
                    disabled={isSaving}
                    className="rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
                  >
                    {isSaving ? "Saving..." : "Save Documents"}
                  </motion.button>
                ) : null}
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === "notifications" && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  Notification Preferences
                </h2>
                <p className="text-sm text-gray-600">
                  Choose how you want to receive notifications
                </p>

                {hasSavedNotifications && !isEditingNotifications ? (
                  <SettingsSectionEditButton
                    label="Edit notifications"
                    onClick={() => {
                      setNotificationsSnapshot(notifications);
                      setIsEditingNotifications(true);
                    }}
                  />
                ) : null}

                <div className="space-y-6">
                  {/* Payment Notifications */}
                  <div className="border-b border-gray-200 pb-4">
                    <h3 className="mb-1 text-sm font-semibold text-gray-900">
                      Payment Notifications
                    </h3>
                    <p className="mb-3 text-sm text-gray-600">
                      Get notified when tenants make payments
                    </p>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          disabled={!canEditNotifications}
                          checked={notifications.payment.email}
                          onChange={() =>
                            handleNotificationChange("payment", "email")
                          }
                          className="h-4 w-4 rounded border-gray-300 text-brand-main focus:ring-2 focus:ring-brand-main"
                        />
                        <span className="text-sm text-gray-700">Email</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          disabled={!canEditNotifications}
                          checked={notifications.payment.push}
                          onChange={() =>
                            handleNotificationChange("payment", "push")
                          }
                          className="h-4 w-4 rounded border-gray-300 text-brand-main focus:ring-2 focus:ring-brand-main"
                        />
                        <span className="text-sm text-gray-700">Push</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          disabled={!canEditNotifications}
                          checked={notifications.payment.sms}
                          onChange={() =>
                            handleNotificationChange("payment", "sms")
                          }
                          className="h-4 w-4 rounded border-gray-300 text-brand-main focus:ring-2 focus:ring-brand-main"
                        />
                        <span className="text-sm text-gray-700">App</span>
                      </label>
                    </div>
                  </div>

                  {/* Maintenance Requests */}
                  <div className="border-b border-gray-200 pb-4">
                    <h3 className="mb-1 text-sm font-semibold text-gray-900">
                      Maintenance Requests
                    </h3>
                    <p className="mb-3 text-sm text-gray-600">
                      Get notified about new maintenance requests
                    </p>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          disabled={!canEditNotifications}
                          checked={notifications.maintenance.email}
                          onChange={() =>
                            handleNotificationChange("maintenance", "email")
                          }
                          className="h-4 w-4 rounded border-gray-300 text-brand-main focus:ring-2 focus:ring-brand-main"
                        />
                        <span className="text-sm text-gray-700">Email</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          disabled={!canEditNotifications}
                          checked={notifications.maintenance.push}
                          onChange={() =>
                            handleNotificationChange("maintenance", "push")
                          }
                          className="h-4 w-4 rounded border-gray-300 text-brand-main focus:ring-2 focus:ring-brand-main"
                        />
                        <span className="text-sm text-gray-700">Push</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          disabled={!canEditNotifications}
                          checked={notifications.maintenance.sms}
                          onChange={() =>
                            handleNotificationChange("maintenance", "sms")
                          }
                          className="h-4 w-4 rounded border-gray-300 text-brand-main focus:ring-2 focus:ring-brand-main"
                        />
                        <span className="text-sm text-gray-700">App</span>
                      </label>
                    </div>
                  </div>

                  {/* Overdue Rent Alerts */}
                  <div className="border-b border-gray-200 pb-4">
                    <h3 className="mb-1 text-sm font-semibold text-gray-900">
                      Overdue Rent Alerts
                    </h3>
                    <p className="mb-3 text-sm text-gray-600">
                      Get notified when rent payments are overdue
                    </p>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          disabled={!canEditNotifications}
                          checked={notifications.overdue.email}
                          onChange={() =>
                            handleNotificationChange("overdue", "email")
                          }
                          className="h-4 w-4 rounded border-gray-300 text-brand-main focus:ring-2 focus:ring-brand-main"
                        />
                        <span className="text-sm text-gray-700">Email</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          disabled={!canEditNotifications}
                          checked={notifications.overdue.push}
                          onChange={() =>
                            handleNotificationChange("overdue", "push")
                          }
                          className="h-4 w-4 rounded border-gray-300 text-brand-main focus:ring-2 focus:ring-brand-main"
                        />
                        <span className="text-sm text-gray-700">Push</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          disabled={!canEditNotifications}
                          checked={notifications.overdue.sms}
                          onChange={() =>
                            handleNotificationChange("overdue", "sms")
                          }
                          className="h-4 w-4 rounded border-gray-300 text-brand-main focus:ring-2 focus:ring-brand-main"
                        />
                        <span className="text-sm text-gray-700">App</span>
                      </label>
                    </div>
                  </div>

                  {/* Weekly Reports */}
                  <div>
                    <h3 className="mb-1 text-sm font-semibold text-gray-900">
                      Weekly Reports
                    </h3>
                    <p className="mb-3 text-sm text-gray-600">
                      Receive weekly summary reports
                    </p>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          disabled={!canEditNotifications}
                          checked={notifications.reports.email}
                          onChange={() =>
                            handleNotificationChange("reports", "email")
                          }
                          className="h-4 w-4 rounded border-gray-300 text-brand-main focus:ring-2 focus:ring-brand-main"
                        />
                        <span className="text-sm text-gray-700">Email</span>
                      </label>
                    </div>
                  </div>
                </div>

                {canEditNotifications ? (
                  <div className="flex flex-wrap items-center gap-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={handleSaveNotifications}
                      disabled={isSaving}
                      className="rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
                    >
                      {isSaving ? "Saving..." : "Save Preferences"}
                    </motion.button>
                    {hasSavedNotifications && isEditingNotifications ? (
                      <SettingsSectionCancelButton
                        onClick={() => {
                          setNotifications(notificationsSnapshot);
                          setIsEditingNotifications(false);
                        }}
                      />
                    ) : null}
                  </div>
                ) : null}
              </div>
            )}

            {/* Payment Details Tab */}
            {activeTab === "payment-details" && userRole === "landlord" && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  Payment Payout Details
                </h2>
                <p className="text-sm text-gray-600">
                  Select your bank and enter your account number. We verify the
                  account name with your bank before you can save. This account
                  receives withdrawals from your wallet.
                </p>

                {hasSavedBankAccount && !isEditingPayment ? (
                  <SettingsSectionEditButton
                    label="Edit bank details"
                    onClick={() => {
                      setPaymentSnapshot(paymentForm);
                      setIsEditingPayment(true);
                    }}
                  />
                ) : null}

                {isLoadingLandlord || !landlordId ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-brand-main" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Bank
                      </label>
                      <select
                        value={paymentForm.bankCode}
                        disabled={paymentBanksLoading || !canEditPayment}
                        onChange={handlePaymentBankChange}
                        className={
                          canEditPayment
                            ? SETTINGS_FIELD_EDITABLE
                            : SETTINGS_FIELD_READONLY
                        }
                      >
                        <option value="">
                          {paymentBanksLoading
                            ? "Loading banks..."
                            : "Select bank"}
                        </option>
                        {paymentBanks.map((b, idx) => {
                          const code = bankOptionCode(b);
                          return (
                            <option key={`${code}-${idx}`} value={code}>
                              {bankOptionName(b, idx)}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Account number
                      </label>
                      <input
                        name="accountNumber"
                        type="text"
                        inputMode="numeric"
                        autoComplete="off"
                        value={paymentForm.accountNumber}
                        onChange={handlePaymentFieldChange}
                        readOnly={!canEditPayment}
                        placeholder="10-digit account number"
                        className={
                          canEditPayment
                            ? SETTINGS_FIELD_EDITABLE
                            : SETTINGS_FIELD_READONLY
                        }
                      />
                    </div>

                    {canEditPayment ? (
                      <div className="flex flex-wrap items-center gap-3">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          type="button"
                          onClick={handleResolvePaymentAccount}
                          disabled={paymentResolveLoading}
                          className="rounded-lg border border-gray-300 bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-60"
                        >
                          {paymentResolveLoading
                            ? "Verifying…"
                            : "Verify account"}
                        </motion.button>
                        <p className="text-xs text-gray-500">
                          Names auto-fill after you pick a bank and enter 10
                          digits (or tap Verify).
                        </p>
                      </div>
                    ) : null}

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Account name
                      </label>
                      <input
                        name="accountName"
                        type="text"
                        readOnly
                        value={paymentForm.accountName}
                        placeholder="Verified from your bank"
                        className="h-11 w-full rounded-lg border border-gray-200 bg-gray-50 px-4 text-sm text-gray-900 placeholder:text-gray-400"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        BVN (Bank Verification Number)
                      </label>
                      <input
                        name="bvn"
                        type="text"
                        inputMode="numeric"
                        autoComplete="off"
                        value={paymentForm.bvn}
                        onChange={handlePaymentFieldChange}
                        readOnly={!canEditPayment}
                        placeholder="11 digits"
                        className={
                          canEditPayment
                            ? SETTINGS_FIELD_EDITABLE
                            : SETTINGS_FIELD_READONLY
                        }
                      />
                    </div>

                    {canEditPayment ? (
                      <div className="flex flex-wrap items-center gap-3">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          type="button"
                          onClick={handleSavePaymentDetails}
                          disabled={isSaving}
                          className="rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-60"
                        >
                          {isSaving ? "Saving…" : "Save bank details"}
                        </motion.button>
                        {hasSavedBankAccount && isEditingPayment ? (
                          <SettingsSectionCancelButton
                            onClick={() => {
                              setPaymentForm(paymentSnapshot);
                              const digits = paymentSnapshot.accountNumber
                                .replace(/\D/g, "")
                                .slice(0, PAY_ACCOUNT_LEN);
                              const code = paymentSnapshot.bankCode.trim();
                              if (
                                digits.length === PAY_ACCOUNT_LEN &&
                                code &&
                                paymentSnapshot.accountName.trim()
                              ) {
                                paymentLastResolvedSignatureRef.current = `${code}:${digits}`;
                                setIsPaymentAccountResolved(true);
                              } else {
                                paymentLastResolvedSignatureRef.current = "";
                                setIsPaymentAccountResolved(false);
                              }
                              setIsEditingPayment(false);
                            }}
                          />
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === "preferences" && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  Platform Preferences
                </h2>

                {hasSavedPreferences && !isEditingPreferences ? (
                  <SettingsSectionEditButton
                    label="Edit preferences"
                    onClick={() => {
                      setPreferencesSnapshot({
                        platformPrefsForm: { ...platformPrefsForm },
                        gracePeriodForm: { ...gracePeriodForm },
                        lateFeeForm: { ...lateFeeForm },
                      });
                      setIsEditingPreferences(true);
                    }}
                  />
                ) : null}

                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Default Currency
                    </label>
                    <input
                      type="text"
                      value={platformPrefsForm.defaultCurrency}
                      readOnly={!canEditPreferences}
                      onChange={(e) =>
                        setPlatformPrefsForm((prev) => ({
                          ...prev,
                          defaultCurrency: e.target.value,
                        }))
                      }
                      className={
                        canEditPreferences
                          ? SETTINGS_FIELD_EDITABLE
                          : SETTINGS_FIELD_READONLY
                      }
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Default Payment Due Day
                    </label>
                    <input
                      type="text"
                      value="N/A"
                      readOnly
                      className={SETTINGS_FIELD_READONLY}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Default Late Fee Amount
                    </label>
                    <input
                      type="number"
                      value={platformPrefsForm.defaultLateFeeAmount}
                      readOnly={!canEditPreferences}
                      onChange={(e) =>
                        setPlatformPrefsForm((prev) => ({
                          ...prev,
                          defaultLateFeeAmount: e.target.value,
                        }))
                      }
                      className={
                        canEditPreferences
                          ? SETTINGS_FIELD_EDITABLE
                          : SETTINGS_FIELD_READONLY
                      }
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Language
                    </label>
                    <input
                      type="text"
                      value={platformPrefsForm.language}
                      readOnly={!canEditPreferences}
                      onChange={(e) =>
                        setPlatformPrefsForm((prev) => ({
                          ...prev,
                          language: e.target.value,
                        }))
                      }
                      className={
                        canEditPreferences
                          ? SETTINGS_FIELD_EDITABLE
                          : SETTINGS_FIELD_READONLY
                      }
                    />
                  </div>
                </div>

                <h3 className="text-base font-semibold text-gray-900">
                  Rent grace periods
                </h3>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Monthly rent
                    </label>
                    <select
                      value={gracePeriodForm.monthlyRentGracePeriod}
                      disabled={!canEditPreferences}
                      onChange={(e) =>
                        setGracePeriodForm((prev) => ({
                          ...prev,
                          monthlyRentGracePeriod: e.target.value,
                        }))
                      }
                      className={
                        canEditPreferences
                          ? "h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:border-brand-main focus:outline-none focus:ring-2 focus:ring-brand-main"
                          : SETTINGS_FIELD_READONLY
                      }
                    >
                      {MONTHLY_GRACE_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {formatGraceLabel(opt)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Quarterly rent
                    </label>
                    <select
                      value={gracePeriodForm.quarterlyRentGracePeriod}
                      disabled={!canEditPreferences}
                      onChange={(e) =>
                        setGracePeriodForm((prev) => ({
                          ...prev,
                          quarterlyRentGracePeriod: e.target.value,
                        }))
                      }
                      className={
                        canEditPreferences
                          ? "h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:border-brand-main focus:outline-none focus:ring-2 focus:ring-brand-main"
                          : SETTINGS_FIELD_READONLY
                      }
                    >
                      {QUARTERLY_GRACE_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {formatGraceLabel(opt)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Yearly rent
                    </label>
                    <select
                      value={gracePeriodForm.yearlyRentGracePeriod}
                      disabled={!canEditPreferences}
                      onChange={(e) =>
                        setGracePeriodForm((prev) => ({
                          ...prev,
                          yearlyRentGracePeriod: e.target.value,
                        }))
                      }
                      className={
                        canEditPreferences
                          ? "h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:border-brand-main focus:outline-none focus:ring-2 focus:ring-brand-main"
                          : SETTINGS_FIELD_READONLY
                      }
                    >
                      {YEARLY_GRACE_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {formatGraceLabel(opt)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <h3 className="text-base font-semibold text-gray-900">
                  Late fee (settings)
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Late fee amount
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={lateFeeForm.lateFeeAmount}
                      readOnly={!canEditPreferences}
                      onChange={(e) =>
                        setLateFeeForm((prev) => ({
                          ...prev,
                          lateFeeAmount: e.target.value,
                        }))
                      }
                      className={
                        canEditPreferences
                          ? SETTINGS_FIELD_EDITABLE
                          : SETTINGS_FIELD_READONLY
                      }
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Late fee type
                    </label>
                    <select
                      value={lateFeeForm.lateFeeType}
                      disabled={!canEditPreferences}
                      onChange={(e) =>
                        setLateFeeForm((prev) => ({
                          ...prev,
                          lateFeeType: e.target.value as "fixed" | "percentage",
                        }))
                      }
                      className={
                        canEditPreferences
                          ? "h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:border-brand-main focus:outline-none focus:ring-2 focus:ring-brand-main"
                          : SETTINGS_FIELD_READONLY
                      }
                    >
                      <option value="fixed">Fixed</option>
                      <option value="percentage">Percentage</option>
                    </select>
                  </div>
                </div>

                {canEditPreferences ? (
                  <div className="flex flex-wrap items-center gap-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={handleSavePreferences}
                      disabled={isSaving}
                      className="rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
                    >
                      {isSaving ? "Saving..." : "Save Preferences"}
                    </motion.button>
                    {hasSavedPreferences && isEditingPreferences ? (
                      <SettingsSectionCancelButton
                        onClick={() => {
                          setPlatformPrefsForm(
                            preferencesSnapshot.platformPrefsForm,
                          );
                          setGracePeriodForm(
                            preferencesSnapshot.gracePeriodForm,
                          );
                          setLateFeeForm(preferencesSnapshot.lateFeeForm);
                          setIsEditingPreferences(false);
                        }}
                      />
                    ) : null}
                  </div>
                ) : null}
              </div>
            )}

            {/* Change Password Tab */}
            {activeTab === "change-password" && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  Change Password
                </h2>
                <p className="text-sm text-gray-600">
                  Update your sign-in password. Fields stay locked until you
                  choose to edit.
                </p>

                {!isEditingPassword ? (
                  <SettingsSectionEditButton
                    label="Change password"
                    onClick={() => {
                      setPasswordForm({ current: "", new: "", confirm: "" });
                      setIsEditingPassword(true);
                    }}
                  />
                ) : null}

                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? "text" : "password"}
                        value={passwordForm.current}
                        onChange={(e) =>
                          setPasswordForm((prev) => ({
                            ...prev,
                            current: e.target.value,
                          }))
                        }
                        readOnly={!canEditPassword}
                        placeholder="••••••••••"
                        className={
                          canEditPassword
                            ? `${SETTINGS_FIELD_EDITABLE} pr-10`
                            : `${SETTINGS_FIELD_READONLY} pr-10`
                        }
                      />
                      <button
                        type="button"
                        disabled={!canEditPassword}
                        onClick={() =>
                          setShowCurrentPassword(!showCurrentPassword)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={passwordForm.new}
                        onChange={(e) =>
                          setPasswordForm((prev) => ({
                            ...prev,
                            new: e.target.value,
                          }))
                        }
                        readOnly={!canEditPassword}
                        placeholder="••••••••••"
                        className={
                          canEditPassword
                            ? `${SETTINGS_FIELD_EDITABLE} pr-10`
                            : `${SETTINGS_FIELD_READONLY} pr-10`
                        }
                      />
                      <button
                        type="button"
                        disabled={!canEditPassword}
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={passwordForm.confirm}
                        onChange={(e) =>
                          setPasswordForm((prev) => ({
                            ...prev,
                            confirm: e.target.value,
                          }))
                        }
                        readOnly={!canEditPassword}
                        placeholder="••••••••••"
                        className={
                          canEditPassword
                            ? `${SETTINGS_FIELD_EDITABLE} pr-10`
                            : `${SETTINGS_FIELD_READONLY} pr-10`
                        }
                      />
                      <button
                        type="button"
                        disabled={!canEditPassword}
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
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

                {canEditPassword ? (
                  <div className="flex flex-wrap items-center gap-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      disabled={isSaving}
                      className="rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-60"
                    >
                      {isSaving ? "Saving..." : "Update password"}
                    </motion.button>
                    <SettingsSectionCancelButton
                      onClick={() => {
                        setPasswordForm({ current: "", new: "", confirm: "" });
                        setShowCurrentPassword(false);
                        setShowNewPassword(false);
                        setShowConfirmPassword(false);
                        setIsEditingPassword(false);
                      }}
                    />
                  </div>
                ) : null}
              </div>
            )}
          </motion.div>
        </div>
      </section>
    </>
  );
};

SettingsPage.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;

export default SettingsPage;
