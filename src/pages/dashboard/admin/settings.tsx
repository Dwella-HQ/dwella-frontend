import Head from "next/head";
import * as React from "react";
import type { NextPageWithLayout } from "@/pages/_app";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { useToast } from "@/components/Toast";
import { getProfile } from "@/api/auth";
import { updateUser, updateUserPassword } from "@/api/user";
import {
  getPlatformSettings,
  updatePlatformSettings,
} from "@/api/platformSettings";

type AdminSettingsTab = "profile" | "notifications" | "change-password";

const settingsInputClassName =
  "h-10 w-full rounded-md border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] placeholder:text-[#94A3B8] outline-none focus:border-[#1E66FF] focus:ring-1 focus:ring-[#1E66FF]";

const settingsPasswordInputClassName =
  "h-11 w-full rounded-md border border-[#E2E8F0] bg-white px-3 pr-10 text-sm text-[#0F172A] placeholder:text-[#94A3B8] outline-none focus:border-[#1E66FF] focus:ring-1 focus:ring-[#1E66FF]";

function getInitials(name: string) {
  if (!name.trim()) return "AD";
  const parts = name.trim().split(/\s+/);
  const a = parts[0]?.[0] ?? "";
  const b = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
  return `${a}${b}`.toUpperCase() || "AD";
}

function toBooleansFromNotificationList(arr: unknown) {
  const list = Array.isArray(arr) ? arr : [];
  return {
    email: list.includes("EMAIL_NOTIFICATION"),
    push: list.includes("PUSH_NOTIFICATION"),
    sms:
      list.includes("APP_NOTIFICATION") || list.includes("SMS_NOTIFICATION"),
  };
}

function toNotificationArray(v: {
  email: boolean;
  push: boolean;
  sms: boolean;
}): string[] {
  const channels: string[] = [];
  if (v.email) channels.push("EMAIL_NOTIFICATION");
  if (v.push) channels.push("PUSH_NOTIFICATION");
  if (v.sms) channels.push("APP_NOTIFICATION");
  return channels;
}

const AdminSettingsPage: NextPageWithLayout = () => {
  const { user, setUser } = useUser();
  const { showToast } = useToast();

  const [tab, setTab] = React.useState<AdminSettingsTab>("profile");
  const [showCurrent, setShowCurrent] = React.useState(false);
  const [showNext, setShowNext] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);

  const [loadingProfile, setLoadingProfile] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [settingsNote, setSettingsNote] = React.useState<string | null>(null);

  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(null);

  const [notifications, setNotifications] = React.useState({
    payment: { email: true, push: false, sms: false },
    maintenance: { email: true, push: false, sms: false },
    overdue: { email: true, push: false, sms: false },
    reports: { email: true, push: false, sms: false },
  });

  const [currentPw, setCurrentPw] = React.useState("");
  const [newPw, setNewPw] = React.useState("");
  const [confirmPw, setConfirmPw] = React.useState("");

  const loadProfileAndSettings = React.useCallback(async () => {
    if (!user?.token || !user?.id) {
      setLoadingProfile(false);
      return;
    }
    setLoadingProfile(true);
    setSettingsNote(null);
    const [profileResult, settingsResult] = await Promise.all([
      getProfile(user.token),
      getPlatformSettings(),
    ]);

    if (profileResult.success) {
      const p = profileResult.data.data;
      setFullName((p.fullName ?? p.name ?? user.name ?? "").trim());
      setEmail((p.email ?? user.email ?? "").trim());
      setPhone((p.phoneNumber ?? p.phone ?? "").trim());
      const pic = p.profilePicture?.url;
      setAvatarUrl(typeof pic === "string" && pic ? pic : null);
    } else {
      setFullName(user.name ?? "");
      setEmail(user.email ?? "");
    }

    if (settingsResult.success) {
      const data = settingsResult.data;
      setNotifications(() => ({
        payment: toBooleansFromNotificationList(data.paymentNotifications),
        maintenance: toBooleansFromNotificationList(
          data.maintenanceRequestNotifications,
        ),
        overdue: toBooleansFromNotificationList(data.overDueNotifications),
        reports: toBooleansFromNotificationList(data.weeklyReportsNotifications),
      }));
    } else {
      setSettingsNote(
        "Notification preferences could not be loaded from the server. You can still try to save your choices.",
      );
    }

    if (!profileResult.success) {
      showToast(profileResult.error || "Could not load profile", "error");
    }

    setLoadingProfile(false);
  }, [user, showToast]);

  React.useEffect(() => {
    void loadProfileAndSettings();
  }, [loadProfileAndSettings]);

  const handleNotificationToggle = (
    category: keyof typeof notifications,
    channel: "email" | "push" | "sms",
  ) => {
    setNotifications((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [channel]: !prev[category][channel],
      },
    }));
  };

  const handleSaveProfile = React.useCallback(async () => {
    if (!user?.id) return;
    const nameT = fullName.trim();
    const emailT = email.trim();
    if (!nameT || !emailT) {
      showToast("Full name and email are required.", "error");
      return;
    }
    setSaving(true);
    const result = await updateUser(String(user.id), {
      fullName: nameT,
      name: nameT,
      email: emailT,
      phoneNumber: phone.trim() || undefined,
      phone: phone.trim() || undefined,
    });
    setSaving(false);
    if (result.success) {
      setUser({
        ...user,
        name: nameT,
        email: emailT,
      });
      showToast("Profile updated.", "success");
      void loadProfileAndSettings();
    } else {
      showToast(result.error || "Could not update profile", "error");
    }
  }, [
    user,
    fullName,
    email,
    phone,
    setUser,
    showToast,
    loadProfileAndSettings,
  ]);

  const handleSaveNotifications = React.useCallback(async () => {
    setSaving(true);
    const result = await updatePlatformSettings({
      paymentNotifications: toNotificationArray(notifications.payment),
      maintenanceRequestNotifications: toNotificationArray(
        notifications.maintenance,
      ),
      overDueNotifications: toNotificationArray(notifications.overdue),
      weeklyReportsNotifications: toNotificationArray(notifications.reports),
    });
    setSaving(false);
    if (result.success) {
      showToast("Notification preferences saved.", "success");
      setSettingsNote(null);
    } else {
      showToast(result.error || "Could not save notification preferences", "error");
    }
  }, [notifications, showToast]);

  const handleChangePassword = React.useCallback(async () => {
    if (!user?.id) return;
    if (!currentPw) {
      showToast("Enter your current password.", "error");
      return;
    }
    if (newPw.length < 8) {
      showToast("New password must be at least 8 characters.", "error");
      return;
    }
    if (newPw !== confirmPw) {
      showToast("New password and confirmation do not match.", "error");
      return;
    }
    setSaving(true);
    const result = await updateUserPassword(String(user.id), {
      currentPassword: currentPw,
      newPassword: newPw,
    });
    setSaving(false);
    if (result.success) {
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
      showToast("Password updated.", "success");
    } else {
      showToast(result.error || "Could not update password", "error");
    }
  }, [user, currentPw, newPw, confirmPw, showToast]);

  const initials = getInitials(fullName || user?.name || "");

  return (
    <>
      <Head>
        <title>Dwelliva · Settings</title>
      </Head>
      <AdminLayout title="Settings">
        <section className="grid w-full max-w-[980px] grid-cols-1 gap-4 [color-scheme:light] lg:grid-cols-[240px_1fr]">
          <div className="h-fit rounded-lg border border-[#E2E8F0] bg-white p-3 text-sm">
            <button
              type="button"
              onClick={() => setTab("profile")}
              className={`mb-1 w-full rounded-md px-3 py-2 text-left ${tab === "profile" ? "bg-[#EFF6FF] text-[#0284C7]" : ""}`}
            >
              Profile
            </button>
            <button
              type="button"
              onClick={() => setTab("notifications")}
              className={`mb-1 w-full rounded-md px-3 py-2 text-left ${tab === "notifications" ? "bg-[#EFF6FF] text-[#0284C7]" : ""}`}
            >
              Notifications
            </button>
            <button
              type="button"
              onClick={() => setTab("change-password")}
              className={`w-full rounded-md px-3 py-2 text-left ${tab === "change-password" ? "bg-[#EFF6FF] text-[#0284C7]" : ""}`}
            >
              Change Password
            </button>
          </div>

          <div className="rounded-lg border border-[#E2E8F0] bg-white p-5">
            {loadingProfile ? (
              <div className="flex items-center gap-2 py-12 text-sm text-[#64748B]">
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading settings…
              </div>
            ) : null}

            {!loadingProfile && tab === "profile" ? (
              <div className="max-w-[520px] space-y-4">
                <p className="text-base font-semibold">Profile Information</p>
                <p className="text-xs text-[#64748B]">
                  Update the admin profile details used across the dashboard.
                </p>
                <div className="flex items-center gap-3">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt=""
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0EA5E9] text-sm font-semibold text-white">
                      {initials}
                    </div>
                  )}
                  <p className="text-xs text-[#64748B]">Profile photo</p>
                </div>
                <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
                  <input
                    className={settingsInputClassName}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Full Name"
                    aria-label="Full name"
                  />
                  <input
                    className={settingsInputClassName}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email Address"
                    autoComplete="email"
                    aria-label="Email address"
                  />
                  <input
                    className={`${settingsInputClassName} sm:col-span-2`}
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Phone number (optional)"
                    autoComplete="tel"
                    aria-label="Phone number"
                  />
                </div>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void handleSaveProfile()}
                  className="rounded-md bg-[#111827] px-5 py-2 text-sm text-white disabled:opacity-60"
                >
                  {saving ? "Saving…" : "Save Changes"}
                </button>
              </div>
            ) : null}

            {!loadingProfile && tab === "notifications" ? (
              <div className="max-w-[700px] space-y-5 text-sm">
                <p className="text-base font-semibold">
                  Notification Preferences
                </p>
                <p className="text-xs text-[#64748B]">
                  Choose how this account should receive platform updates.
                </p>
                {settingsNote ? (
                  <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                    {settingsNote}
                  </p>
                ) : null}
                {(
                  [
                    ["Payment Notifications", "payment" as const],
                    ["Maintenance Requests", "maintenance" as const],
                    ["Overdue Rent Alerts", "overdue" as const],
                  ] as const
                ).map(([label, key]) => (
                  <div key={label} className="border-b border-[#E2E8F0] pb-3">
                    <p className="font-medium">{label}</p>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs sm:gap-5">
                      {(
                        [
                          ["email", "Email"] as const,
                          ["push", "Push"] as const,
                          ["sms", "SMS"] as const,
                        ]
                      ).map(([ch, lab]) => (
                        <label
                          key={ch}
                          className="flex cursor-pointer items-center gap-2"
                        >
                          <input
                            type="checkbox"
                            checked={notifications[key][ch]}
                            onChange={() =>
                              handleNotificationToggle(key, ch)
                            }
                          />
                          {lab}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
                <div className="pb-1">
                  <p className="font-medium">Weekly Reports</p>
                  <div className="mt-2 text-xs">
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={notifications.reports.email}
                        onChange={() =>
                          handleNotificationToggle("reports", "email")
                        }
                      />
                      Email
                    </label>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void handleSaveNotifications()}
                  className="rounded-md bg-[#111827] px-5 py-2 text-sm text-white disabled:opacity-60"
                >
                  {saving ? "Saving…" : "Save Preferences"}
                </button>
              </div>
            ) : null}

            {!loadingProfile && tab === "change-password" ? (
              <div className="max-w-[700px] space-y-4">
                <p className="text-base font-semibold">Change Password</p>
                <p className="text-xs text-[#64748B]">
                  Use a strong password that is not shared with another
                  account.
                </p>
                <div className="space-y-3 text-sm">
                  <div className="relative">
                    <input
                      type={showCurrent ? "text" : "password"}
                      className={settingsPasswordInputClassName}
                      placeholder="Current Password"
                      value={currentPw}
                      onChange={(e) => setCurrentPw(e.target.value)}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B]"
                    >
                      {showCurrent ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showNext ? "text" : "password"}
                      className={settingsPasswordInputClassName}
                      placeholder="New Password"
                      value={newPw}
                      onChange={(e) => setNewPw(e.target.value)}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNext((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B]"
                    >
                      {showNext ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      className={settingsPasswordInputClassName}
                      placeholder="Confirm New Password"
                      value={confirmPw}
                      onChange={(e) => setConfirmPw(e.target.value)}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B]"
                    >
                      {showConfirm ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void handleChangePassword()}
                  className="rounded-md bg-[#111827] px-5 py-2 text-sm text-white disabled:opacity-60"
                >
                  {saving ? "Saving…" : "Update password"}
                </button>
              </div>
            ) : null}
          </div>
        </section>
      </AdminLayout>
    </>
  );
};

export default AdminSettingsPage;
