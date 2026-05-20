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
  updateLandlord,
  updateLandlordDocumentsSettings,
  updateLandlordNotificationPreferencesSettings,
  updateLandlordPlatformPreferencesSettings,
} from "@/api/landlord";
import type {
  LandlordBankAccountDTO,
  LandlordDTO,
  UpdateLandlordDTO,
} from "@/api/landlord";
import {
  getWithdrawalBanksByCurrency,
  resolveWithdrawalAccount,
} from "@/api/withdrawal";
import type { WithdrawalBankDTO } from "@/api/withdrawal";
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
const PAYMENT_SETTINGS_LOG = "[Dwella Settings · Payment]";
const PROFILE_SETTINGS_LOG = "[Dwella Settings · Profile]";

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

/**
 * Read bank account from GET /landlord/:id (top-level `bankAccount`).
 */
function pickBankAccountFromLandlordRecord(
  landlord: Record<string, unknown>,
): PaymentBankAccountFields | null {
  const top = landlord.bankAccount;
  if (top && typeof top === "object") {
    return top as PaymentBankAccountFields;
  }
  const settings = landlord.settings;
  if (settings && typeof settings === "object") {
    const nested = (settings as Record<string, unknown>).bankAccount;
    if (nested && typeof nested === "object") {
      return nested as PaymentBankAccountFields;
    }
  }
  return null;
}

/** Build PATCH /landlord/:id body from form + existing landlord (avoids wiping fields). */
function buildLandlordUpdatePayload(
  profileForm: ProfileFormState,
  landlord: LandlordDTO | null,
  userId: string | null,
  extras?: { bankAccount?: LandlordBankAccountDTO },
): UpdateLandlordDTO {
  const payload: UpdateLandlordDTO = {
    userId: userId ?? landlord?.userId ?? undefined,
    businessName:
      profileForm.businessName.trim() ||
      landlord?.businessName ||
      landlord?.landLordName ||
      undefined,
    businessEmail:
      profileForm.businessEmail.trim() || landlord?.businessEmail || undefined,
    businessPhoneNumber:
      profileForm.businessPhoneNumber.trim() ||
      landlord?.businessPhoneNumber ||
      undefined,
    govermentIdDocumentId: landlord?.govermentIdDocumentId,
    landSurveyDocumentId: landlord?.landSurveyDocumentId,
    proofOfOwnershipDocumentId: landlord?.proofOfOwnershipDocumentId,
    taxIdentificationNumberDocumentId:
      landlord?.taxIdentificationNumberDocumentId,
  };

  const addressLine =
    profileForm.address.trim() || landlord?.address?.address || "";
  const city = profileForm.city.trim() || landlord?.address?.city || "";
  const state = profileForm.state.trim() || landlord?.address?.state || "";
  const country =
    profileForm.country.trim() || landlord?.address?.country || "";
  if (addressLine || city || state || country) {
    payload.address = {
      address: addressLine,
      city,
      state,
      postalCode:
        profileForm.postalCode.trim() ||
        landlord?.address?.postalCode ||
        undefined,
      country: country || "Nigeria",
    };
  }

  if (extras?.bankAccount) {
    payload.bankAccount = extras.bankAccount;
  }

  return payload;
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
  // Notification preferences state
  const [notifications, setNotifications] = React.useState({
    payment: { email: true, push: true, sms: false },
    maintenance: { email: true, push: true, sms: true },
    overdue: { email: true, push: false, sms: true },
    reports: { email: true, push: false, sms: false },
  });
  const [isEditingProfile, setIsEditingProfile] = React.useState(false);
  const [profileSnapshot, setProfileSnapshot] = React.useState(profileForm);
  /** Draft phone in the yellow banner — not persisted until Save. */
  const [pendingBusinessPhone, setPendingBusinessPhone] = React.useState("");

  const [paymentForm, setPaymentForm] = React.useState({
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
        businessPhoneNumber: data.businessPhoneNumber ?? "",
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

  const refreshLandlordFromApi = React.useCallback(
    async (id: string) => {
      const landlordResult = await getLandlord(id);

      if (landlordResult.success) {
        setLandlord(landlordResult.data);
        applyProfileFormFromLandlord(landlordResult.data, user?.email);
        const baFromLandlord = pickBankAccountFromLandlordRecord(
          landlordResult.data as unknown as Record<string, unknown>,
        );
        if (baFromLandlord) {
          syncPaymentFormFromBankAccount(baFromLandlord);
        }
        if (typeof window !== "undefined") {
          console.info(PROFILE_SETTINGS_LOG, "GET /landlord/:id after save:", {
            businessPhoneNumber: landlordResult.data.businessPhoneNumber,
            bankAccount: baFromLandlord,
          });
        }
      } else if (typeof window !== "undefined") {
        console.warn(
          PROFILE_SETTINGS_LOG,
          "GET /landlord/:id after save — failed:",
          landlordResult.error,
        );
      }

      return { landlordResult };
    },
    [applyProfileFormFromLandlord, syncPaymentFormFromBankAccount, user?.email],
  );

  const landlordId = landlord?.id as string | undefined;
  const isLandlordVerified = landlord?.isApproved === true;

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
        const baFromLandlord = pickBankAccountFromLandlordRecord(
          result.data as unknown as Record<string, unknown>,
        );
        if (baFromLandlord) {
          syncPaymentFormFromBankAccount(baFromLandlord);
        }
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
  }, [user, applyProfileFormFromLandlord, syncPaymentFormFromBankAccount]);

  // Profile, phone, and bank account — GET /landlord/:id
  React.useEffect(() => {
    if (!landlordId) return;
    let cancelled = false;
    getLandlord(landlordId).then((result) => {
      if (cancelled) return;
      if (!result.success) {
        if (typeof window !== "undefined") {
          console.warn(
            PROFILE_SETTINGS_LOG,
            "GET /landlord/:id — failed:",
            result.error,
            "statusCode:",
            result.statusCode,
          );
        }
        return;
      }
      const data = result.data;
      const dataRecord = data as unknown as Record<string, unknown>;
      if (typeof window !== "undefined") {
        console.info(PROFILE_SETTINGS_LOG, "GET /landlord/:id — success:", {
          businessPhoneNumber: data.businessPhoneNumber,
          bankAccount: dataRecord.bankAccount,
        });
      }
      setLandlord(data);
      applyProfileFormFromLandlord(data, user?.email);
      const ba = pickBankAccountFromLandlordRecord(dataRecord);
      if (typeof window !== "undefined") {
        console.info(
          PAYMENT_SETTINGS_LOG,
          "GET /landlord/:id — picked bankAccount for form:",
          ba ?? "(null — nothing to prefill)",
        );
      }
      if (ba) {
        syncPaymentFormFromBankAccount(ba);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [
    landlordId,
    applyProfileFormFromLandlord,
    syncPaymentFormFromBankAccount,
    user?.email,
  ]);

  // Notification & platform preferences only — GET /landlord/:id/settings
  React.useEffect(() => {
    if (!landlordId) return;
    let cancelled = false;
    getLandlordSettings(landlordId).then((result) => {
      if (cancelled) return;
      if (!result.success) return;
      const data = result.data;
      setPlatformPrefsForm((prev) => ({
        defaultCurrency:
          (data.defaultCurrency as string) ?? prev.defaultCurrency,
        defaultLateFeeAmount: String(
          (data.defaultLateFeeAmount as number | string | undefined) ??
            prev.defaultLateFeeAmount,
        ),
        language: (data.language as string) ?? prev.language,
      }));
      setNotifications((prev) => {
        const toBooleans = (arr: unknown) => {
          const list = Array.isArray(arr) ? arr : [];
          return {
            email: list.includes("EMAIL_NOTIFICATION"),
            push: list.includes("PUSH_NOTIFICATION"),
            sms:
              list.includes("APP_NOTIFICATION") ||
              list.includes("SMS_NOTIFICATION"),
          };
        };
        return {
          ...prev,
          payment: toBooleans(data.paymentNotifications),
          maintenance: toBooleans(data.maintenanceRequestNotifications),
          overdue: toBooleans(data.overDueNotifications),
          reports: toBooleans(data.weeklyReportsNotifications),
        };
      });
    });
    return () => {
      cancelled = true;
    };
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
    landlord?.businessPhoneNumber?.trim() ||
    (isEditingProfile ? profileForm.businessPhoneNumber.trim() : "");
  const needsBusinessPhonePrompt =
    !landlord?.businessPhoneNumber?.trim() && !isEditingProfile;
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
  }, [paymentForm.accountNumber, paymentForm.bankCode, resolvePaymentAccount]);

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

    const payload = buildLandlordUpdatePayload(profileForm, landlord, userId, {
      bankAccount: {
        accountName,
        accountNumber: digits,
        bankName,
        bankCode,
        bvn,
      },
    });

    if (typeof window !== "undefined") {
      console.info(
        PAYMENT_SETTINGS_LOG,
        "PATCH /landlord/:id body (save payment):",
        JSON.stringify(payload, null, 2),
      );
    }

    setIsSaving(true);
    const result = await updateLandlord(landlordId, payload);
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
      await refreshLandlordFromApi(landlordId);
    } else {
      showToast(result.error || "Failed to save bank details", "error");
    }
  }, [
    isPaymentAccountResolved,
    landlord,
    landlordId,
    paymentForm,
    profileForm,
    refreshLandlordFromApi,
    showToast,
    userId,
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

    const payload = buildLandlordUpdatePayload(
      { ...profileForm, businessPhoneNumber: phoneTrim },
      landlord,
      userId,
    );

    if (typeof window !== "undefined") {
      console.info(
        PROFILE_SETTINGS_LOG,
        "PATCH /landlord/:id body (save phone):",
        JSON.stringify(payload, null, 2),
      );
    }

    setIsSaving(true);
    const result = await updateLandlord(landlordId, payload);
    setIsSaving(false);

    if (typeof window !== "undefined") {
      console.info(
        PROFILE_SETTINGS_LOG,
        "PATCH /landlord/:id response:",
        result.success ? { success: true, data: result.data } : result,
      );
    }

    if (result.success) {
      showToast("Business phone saved.", "success");
      setPendingBusinessPhone("");
      await refreshLandlordFromApi(landlordId);
    } else {
      showToast(result.error || "Failed to save phone number", "error");
    }
  }, [
    landlord,
    landlordId,
    pendingBusinessPhone,
    profileForm,
    refreshLandlordFromApi,
    showToast,
    userId,
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
    const payload = buildLandlordUpdatePayload(profileForm, landlord, userId);
    if (typeof window !== "undefined") {
      console.info(
        PROFILE_SETTINGS_LOG,
        "PATCH /landlord/:id body (save profile):",
        JSON.stringify(payload, null, 2),
      );
    }
    const result = await updateLandlord(landlordId, payload);
    if (result.success) {
      await refreshLandlordFromApi(landlordId);
      setProfileSnapshot(profileForm);
      setIsEditingProfile(false);
      showToast("Profile updated successfully", "success");
    } else showToast(result.error || "Failed to update profile", "error");
    setIsSaving(false);
  }, [
    landlord,
    landlordId,
    profileForm,
    refreshLandlordFromApi,
    showToast,
    userId,
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
    if (result.success) showToast("Documents updated successfully", "success");
    else showToast(result.error || "Failed to update documents", "error");
  }, [documentsForm, landlordId, showToast, toDocumentsPayload]);

  const handleSavePreferences = React.useCallback(async () => {
    if (!landlordId) return;
    setIsSaving(true);
    const result = await updateLandlordPlatformPreferencesSettings(landlordId, {
      defaultCurrency: platformPrefsForm.defaultCurrency,
      defaultLateFeeAmount: Number(platformPrefsForm.defaultLateFeeAmount || 0),
      language: platformPrefsForm.language,
    });
    setIsSaving(false);
    if (result.success) showToast("Platform preferences saved", "success");
    else showToast(result.error || "Failed to save preferences", "error");
  }, [landlordId, platformPrefsForm, showToast]);

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
    if (result.success) showToast("Notification preferences saved", "success");
    else showToast(result.error || "Failed to save notifications", "error");
  }, [landlordId, notifications, showToast, toNotificationArray]);

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

  return (
    <>
      <Head>
        <title>Settings | DWELLA NG</title>
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
                {isLandlordVerified ? (
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
                        className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition ${
                          isLandlordVerified
                            ? "cursor-pointer border-brand-main bg-white text-brand-main hover:bg-brand-main/5"
                            : "cursor-pointer border-gray-300 bg-white text-brand-main hover:bg-gray-50"
                        }`}
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
                        className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition ${
                          isLandlordVerified
                            ? "cursor-pointer border-brand-main bg-white text-brand-main hover:bg-brand-main/5"
                            : "cursor-pointer border-gray-300 bg-white text-brand-main hover:bg-gray-50"
                        }`}
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
                        className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition ${
                          isLandlordVerified
                            ? "cursor-pointer border-brand-main bg-white text-brand-main hover:bg-brand-main/5"
                            : "cursor-pointer border-gray-300 bg-white text-brand-main hover:bg-gray-50"
                        }`}
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
                        className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition ${
                          isLandlordVerified
                            ? "cursor-pointer border-brand-main bg-white text-brand-main hover:bg-brand-main/5"
                            : "cursor-pointer border-gray-300 bg-white text-brand-main hover:bg-gray-50"
                        }`}
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
                        disabled={paymentBanksLoading}
                        onChange={handlePaymentBankChange}
                        className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-900 focus:border-brand-main focus:outline-none focus:ring-2 focus:ring-brand-main"
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
                        placeholder="10-digit account number"
                        className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-main focus:outline-none focus:ring-2 focus:ring-brand-main"
                      />
                    </div>

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
                        placeholder="11 digits"
                        className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-main focus:outline-none focus:ring-2 focus:ring-brand-main"
                      />
                    </div>

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

                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Default Currency
                    </label>
                    <input
                      type="text"
                      value={platformPrefsForm.defaultCurrency}
                      onChange={(e) =>
                        setPlatformPrefsForm((prev) => ({
                          ...prev,
                          defaultCurrency: e.target.value,
                        }))
                      }
                      className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-main focus:outline-none focus:ring-2 focus:ring-brand-main"
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
                      className="h-11 w-full rounded-lg border border-gray-300 bg-gray-50 px-4 text-sm text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Default Late Fee Amount
                    </label>
                    <input
                      type="number"
                      value={platformPrefsForm.defaultLateFeeAmount}
                      onChange={(e) =>
                        setPlatformPrefsForm((prev) => ({
                          ...prev,
                          defaultLateFeeAmount: e.target.value,
                        }))
                      }
                      className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-main focus:outline-none focus:ring-2 focus:ring-brand-main"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Language
                    </label>
                    <input
                      type="text"
                      value={platformPrefsForm.language}
                      onChange={(e) =>
                        setPlatformPrefsForm((prev) => ({
                          ...prev,
                          language: e.target.value,
                        }))
                      }
                      className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-main focus:outline-none focus:ring-2 focus:ring-brand-main"
                    />
                  </div>
                </div>

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
              </div>
            )}

            {/* Change Password Tab */}
            {activeTab === "change-password" && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  Change Password
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? "text" : "password"}
                        placeholder="••••••••••"
                        className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-main focus:outline-none focus:ring-2 focus:ring-brand-main"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowCurrentPassword(!showCurrentPassword)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
                        placeholder="••••••••••"
                        className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-main focus:outline-none focus:ring-2 focus:ring-brand-main"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
                        placeholder="••••••••••"
                        className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-main focus:outline-none focus:ring-2 focus:ring-brand-main"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  className="rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
                >
                  Save Preferences
                </motion.button>
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
