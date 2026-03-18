import Head from "next/head";
import * as React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useRouter } from "next/router";
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
  Heart,
} from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { useToast } from "@/components/Toast";
import { uploadFile } from "@/api/files";
import {
  getLandlordByUser,
  getLandlordSettings,
  updateLandlordDocumentsSettings,
  updateLandlordGracePeriodsSettings,
  updateLandlordNotificationPreferencesSettings,
  updateLandlordPlatformPreferencesSettings,
  updateLandlordProfileSettings,
} from "@/api/landlord";
import type { NextPageWithLayout } from "../_app";

type SettingsTab =
  | "profile"
  | "documents"
  | "notifications"
  | "payment-details"
  | "preferences"
  | "grace-period"
  | "change-password";

const SettingsPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { user } = useUser();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = React.useState<SettingsTab>("profile");
  const [showCurrentPassword, setShowCurrentPassword] = React.useState(false);
  const [showNewPassword, setShowNewPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [landlord, setLandlord] = React.useState<any>(null);
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
  const [gracePeriodsForm, setGracePeriodsForm] = React.useState({
    monthlyRentGracePeriod: "NO_GRACE_PERIOD",
    quarterlyRentGracePeriod: "NO_GRACE_PERIOD",
    yearlyRentGracePeriod: "NO_GRACE_PERIOD",
  });

  // Notification preferences state
  const [notifications, setNotifications] = React.useState({
    payment: { email: true, push: true, sms: false },
    maintenance: { email: true, push: true, sms: true },
    overdue: { email: true, push: false, sms: true },
    reports: { email: true, push: false, sms: false },
  });

  const landlordId = landlord?.id as string | undefined;

  // Fetch landlord profile for landlords
  React.useEffect(() => {
    const fetchLandlord = async () => {
      if (user?.role === "landlord" && user?.id) {
        setIsLoadingLandlord(true);
        const result = await getLandlordByUser(user.id as string);
        if (result.success) {
          setLandlord(result.data);
          setProfileForm({
            businessName: result.data.landLordName ?? "",
            businessEmail: result.data.user?.email ?? user?.email ?? "",
            businessPhoneNumber: "",
            address: result.data.address?.address ?? "",
            city: result.data.address?.city ?? "",
            state: result.data.address?.state ?? "",
            postalCode: result.data.address?.postalCode ?? "",
            country: result.data.address?.country ?? "Nigeria",
          });
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
      }
    };

    fetchLandlord();
  }, [user]);

  // Fetch settings payload and prefill forms where values exist
  React.useEffect(() => {
    if (!landlordId) return;
    let cancelled = false;
    getLandlordSettings(landlordId).then((result) => {
      if (cancelled || !result.success) return;
      const data = result.data;
      setProfileForm((prev) => ({
        ...prev,
        businessName:
          (data.businessName as string) ??
          (data.landLordName as string) ??
          prev.businessName,
        businessEmail: (data.businessEmail as string) ?? prev.businessEmail,
        businessPhoneNumber:
          (data.businessPhoneNumber as string) ?? prev.businessPhoneNumber,
        address:
          (data.address as { address?: string } | undefined)?.address ??
          prev.address,
        city:
          (data.address as { city?: string } | undefined)?.city ?? prev.city,
        state:
          (data.address as { state?: string } | undefined)?.state ?? prev.state,
        postalCode:
          (data.address as { postalCode?: string } | undefined)?.postalCode ??
          prev.postalCode,
        country:
          (data.address as { country?: string } | undefined)?.country ??
          prev.country,
      }));
      setPlatformPrefsForm((prev) => ({
        defaultCurrency:
          (data.defaultCurrency as string) ?? prev.defaultCurrency,
        defaultLateFeeAmount: String(
          (data.defaultLateFeeAmount as number | string | undefined) ??
            prev.defaultLateFeeAmount,
        ),
        language: (data.language as string) ?? prev.language,
      }));
      setGracePeriodsForm((prev) => ({
        monthlyRentGracePeriod:
          (data.monthlyRentGracePeriod as string) ??
          prev.monthlyRentGracePeriod,
        quarterlyRentGracePeriod:
          (data.quarterlyRentGracePeriod as string) ??
          prev.quarterlyRentGracePeriod,
        yearlyRentGracePeriod:
          (data.yearlyRentGracePeriod as string) ?? prev.yearlyRentGracePeriod,
      }));
      setNotifications((prev) => {
        const toBooleans = (arr: unknown) => {
          const list = Array.isArray(arr) ? arr : [];
          return {
            email: list.includes("EMAIL_NOTIFICATION"),
            push: list.includes("PUSH_NOTIFICATION"),
            sms: list.includes("SMS_NOTIFICATION"),
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

  const getInitials = (name: string) => {
    if (!name) return "JD";
    const parts = name.trim().split(/\s+/);
    const first = parts[0]?.[0] || "";
    const last = parts.length > 1 ? parts[parts.length - 1]?.[0] || "" : "";
    return `${first}${last}`.toUpperCase() || "JD";
  };

  const profileName = landlord?.landLordName || user?.name || "";
  const profilePicture = landlord?.profilePicture?.url;
  const initials = getInitials(profileName);

  const settingsTabs = [
    { id: "profile" as SettingsTab, label: "Profile", icon: User },
    { id: "documents" as SettingsTab, label: "Documents", icon: FileText },
    { id: "notifications" as SettingsTab, label: "Notifications", icon: Bell },
    {
      id: "payment-details" as SettingsTab,
      label: "Payment Details",
      icon: CreditCard,
    },
    {
      id: "preferences" as SettingsTab,
      label: "Preferences",
      icon: SettingsIcon,
    },
    {
      id: "grace-period" as SettingsTab,
      label: "Grace Period",
      icon: Heart,
    },
    {
      id: "change-password" as SettingsTab,
      label: "Change Password",
      icon: Lock,
    },
  ];

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
      if (v.sms) channels.push("SMS_NOTIFICATION");
      return channels;
    },
    [],
  );

  const handleSaveProfile = React.useCallback(async () => {
    if (!landlordId) return;
    setIsSaving(true);
    const result = await updateLandlordProfileSettings(landlordId, {
      businessName: profileForm.businessName,
      businessEmail: profileForm.businessEmail,
      businessPhoneNumber: profileForm.businessPhoneNumber,
      address: {
        address: profileForm.address,
        city: profileForm.city,
        state: profileForm.state,
        postalCode: profileForm.postalCode,
        country: profileForm.country,
      },
    });
    setIsSaving(false);
    if (result.success) showToast("Profile updated successfully", "success");
    else showToast(result.error || "Failed to update profile", "error");
  }, [landlordId, profileForm, showToast]);

  const handleSaveDocuments = React.useCallback(async () => {
    if (!landlordId) return;
    setIsSaving(true);
    const result = await updateLandlordDocumentsSettings(landlordId, {
      govermentIdDocumentId: documentsForm.govermentIdDocumentId || undefined,
      landSurveyDocumentId: documentsForm.landSurveyDocumentId || undefined,
      proofOfOwnershipDocumentId:
        documentsForm.proofOfOwnershipDocumentId || undefined,
      taxIdentificationNumberDocumentId:
        documentsForm.taxIdentificationNumberDocumentId || undefined,
    });
    setIsSaving(false);
    if (result.success) showToast("Documents updated successfully", "success");
    else showToast(result.error || "Failed to update documents", "error");
  }, [documentsForm, landlordId, showToast]);

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

  const handleSaveGracePeriods = React.useCallback(async () => {
    if (!landlordId) return;
    setIsSaving(true);
    const result = await updateLandlordGracePeriodsSettings(landlordId, {
      monthlyRentGracePeriod: gracePeriodsForm.monthlyRentGracePeriod,
      quarterlyRentGracePeriod: gracePeriodsForm.quarterlyRentGracePeriod,
      yearlyRentGracePeriod: gracePeriodsForm.yearlyRentGracePeriod,
    });
    setIsSaving(false);
    if (result.success) showToast("Grace periods saved", "success");
    else showToast(result.error || "Failed to save grace periods", "error");
  }, [gracePeriodsForm, landlordId, showToast]);

  const handleUploadDocument = React.useCallback(
    async (
      key:
        | "govermentIdDocumentId"
        | "landSurveyDocumentId"
        | "proofOfOwnershipDocumentId"
        | "taxIdentificationNumberDocumentId",
      file: File,
    ) => {
      if (!user?.token) {
        showToast("You must be signed in to upload files", "error");
        return;
      }
      setIsUploadingDoc(key);
      const result = await uploadFile({
        file,
        folder: "landlord",
        label: key,
        token: user.token,
      });
      setIsUploadingDoc(null);
      if (result.success) {
        setDocumentsForm((prev) => ({ ...prev, [key]: result.data.id }));
        showToast("Document uploaded", "success");
      } else {
        showToast(result.error || "Failed to upload document", "error");
      }
    },
    [showToast, user?.token],
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

                    {/* Form Fields */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          Full Name
                        </label>
                        <input
                          type="text"
                          value={user?.name ?? ""}
                          readOnly
                          className="h-11 w-full rounded-lg border border-gray-300 bg-gray-50 px-4 text-sm text-gray-900"
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
                        <input
                          type="tel"
                          value={profileForm.businessPhoneNumber}
                          onChange={(e) =>
                            setProfileForm((prev) => ({
                              ...prev,
                              businessPhoneNumber: e.target.value,
                            }))
                          }
                          className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-main focus:outline-none focus:ring-2 focus:ring-brand-main"
                        />
                      </div>

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

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className="rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
                    >
                      {isSaving ? "Saving..." : "Save Changes"}
                    </motion.button>
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

                <div className="space-y-6">
                  {/* Government Issued ID */}
                  <div>
                    <h3 className="mb-1 text-sm font-semibold text-gray-900">
                      Government Issued ID
                    </h3>
                    <p className="mb-3 text-sm text-gray-600">
                      Driver's License, National ID, or International Passport
                    </p>
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-brand-main transition hover:bg-gray-50">
                      <Upload className="h-4 w-4" />
                      {isUploadingDoc === "govermentIdDocumentId"
                        ? "Uploading..."
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
                    {documentsForm.govermentIdDocumentId && (
                      <p className="mt-2 text-xs text-gray-500">
                        File ID: {documentsForm.govermentIdDocumentId}
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
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-brand-main transition hover:bg-gray-50">
                      <Upload className="h-4 w-4" />
                      {isUploadingDoc === "landSurveyDocumentId"
                        ? "Uploading..."
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
                    {documentsForm.landSurveyDocumentId && (
                      <p className="mt-2 text-xs text-gray-500">
                        File ID: {documentsForm.landSurveyDocumentId}
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
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-brand-main transition hover:bg-gray-50">
                      <Upload className="h-4 w-4" />
                      {isUploadingDoc === "proofOfOwnershipDocumentId"
                        ? "Uploading..."
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
                    {documentsForm.proofOfOwnershipDocumentId && (
                      <p className="mt-2 text-xs text-gray-500">
                        File ID: {documentsForm.proofOfOwnershipDocumentId}
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
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-brand-main transition hover:bg-gray-50">
                      <Upload className="h-4 w-4" />
                      {isUploadingDoc === "taxIdentificationNumberDocumentId"
                        ? "Uploading..."
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
                    {documentsForm.taxIdentificationNumberDocumentId && (
                      <p className="mt-2 text-xs text-gray-500">
                        File ID:{" "}
                        {documentsForm.taxIdentificationNumberDocumentId}
                      </p>
                    )}
                  </div>
                </div>
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
                        <span className="text-sm text-gray-700">SMS</span>
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
                        <span className="text-sm text-gray-700">SMS</span>
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
                        <span className="text-sm text-gray-700">SMS</span>
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
            {activeTab === "payment-details" && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  Payment Payout Details
                </h2>
                <p className="text-sm text-gray-600">
                  Update your bank account information for receiving payments
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      placeholder="Placeholder"
                      className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-main focus:outline-none focus:ring-2 focus:ring-brand-main"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Account Number
                    </label>
                    <input
                      type="text"
                      placeholder="Placeholder"
                      className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-main focus:outline-none focus:ring-2 focus:ring-brand-main"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Account Name
                    </label>
                    <input
                      type="text"
                      placeholder="Placeholder"
                      className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-main focus:outline-none focus:ring-2 focus:ring-brand-main"
                    />
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  className="rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
                >
                  Save Bank Details
                </motion.button>
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

            {/* Grace Period Tab */}
            {activeTab === "grace-period" && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  Rent Grace Periods
                </h2>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Monthly Rent Grace Period
                    </label>
                    <select
                      className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
                      value={gracePeriodsForm.monthlyRentGracePeriod}
                      onChange={(e) =>
                        setGracePeriodsForm((prev) => ({
                          ...prev,
                          monthlyRentGracePeriod: e.target.value,
                        }))
                      }
                    >
                      <option value="NO_GRACE_PERIOD">No Grace Period</option>
                      <option value="THREE_DAYS">Three Days</option>
                      <option value="FIVE_DAYS">Five Days</option>
                      <option value="SEVEN_DAYS">Seven Days</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Quarterly Rent Grace Period
                    </label>
                    <select
                      className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
                      value={gracePeriodsForm.quarterlyRentGracePeriod}
                      onChange={(e) =>
                        setGracePeriodsForm((prev) => ({
                          ...prev,
                          quarterlyRentGracePeriod: e.target.value,
                        }))
                      }
                    >
                      <option value="NO_GRACE_PERIOD">No Grace Period</option>
                      <option value="FIVE_DAYS">Five Days</option>
                      <option value="SEVEN_DAYS">Seven Days</option>
                      <option value="FOURTEEN_DAYS">Fourteen Days</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Yearly Rent Grace Period
                    </label>
                    <select
                      className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-main focus:border-transparent"
                      value={gracePeriodsForm.yearlyRentGracePeriod}
                      onChange={(e) =>
                        setGracePeriodsForm((prev) => ({
                          ...prev,
                          yearlyRentGracePeriod: e.target.value,
                        }))
                      }
                    >
                      <option value="NO_GRACE_PERIOD">No Grace Period</option>
                      <option value="SEVEN_DAYS">Seven Days</option>
                      <option value="FOURTEEN_DAYS">Fourteen Days</option>
                      <option value="THIRTY_DAYS">Thirty Days</option>
                    </select>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={handleSaveGracePeriods}
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
