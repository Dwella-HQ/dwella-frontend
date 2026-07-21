import * as React from "react";
import Head from "next/head";
import {
  Bell,
  Eye,
  EyeOff,
  FileText,
  Key,
  Lock,
  User,
} from "lucide-react";
import { GuestLayout } from "@/components/guest/GuestLayout";
import { PhoneInputWithCountry } from "@/components/PhoneInputWithCountry";
import { useToast } from "@/components/Toast";
import { useUser } from "@/contexts/UserContext";
import { updateUser } from "@/api/user";
import { updateUserPassword } from "@/api/user/updateUserPassword";
import { uploadFile } from "@/api/files";
import type { NextPageWithLayout } from "../_app";

type SettingsTab =
  | "profile"
  | "notifications"
  | "purchase-document"
  | "change-password";

type ProfileForm = {
  fullName: string;
  email: string;
  phoneNumber: string;
  businessName: string;
  address: string;
  city: string;
  state: string;
  country: string;
};

type NotifChannel = { email: boolean; push: boolean; sms: boolean };

type NotificationPrefs = {
  payments: NotifChannel;
  maintenance: NotifChannel;
  overdue: NotifChannel;
  weekly: { email: boolean };
};

const PROFILE_KEY = "guestSettingsProfile";
const NOTIF_KEY = "guestSettingsNotifications";

const inputClassName =
  "h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand-main)] focus:border-transparent";

const defaultNotifs: NotificationPrefs = {
  payments: { email: true, push: true, sms: false },
  maintenance: { email: true, push: false, sms: false },
  overdue: { email: true, push: true, sms: true },
  weekly: { email: true },
};

const GuestSettingsPage: NextPageWithLayout = () => {
  const { user, setUser } = useUser();
  const { showToast } = useToast();
  const [tab, setTab] = React.useState<SettingsTab>("profile");

  const [profile, setProfile] = React.useState<ProfileForm>({
    fullName: user?.name || "",
    email: user?.email || "",
    phoneNumber: "",
    businessName: "",
    address: "",
    city: "",
    state: "",
    country: "",
  });
  const [profilePreview, setProfilePreview] = React.useState<string | null>(
    null,
  );
  const [notifs, setNotifs] = React.useState<NotificationPrefs>(defaultNotifs);
  const [passwordForm, setPasswordForm] = React.useState({
    current: "",
    next: "",
    confirm: "",
  });
  const [showCurrent, setShowCurrent] = React.useState(false);
  const [showNext, setShowNext] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const storedProfile = localStorage.getItem(PROFILE_KEY);
      if (storedProfile) {
        setProfile((prev) => ({
          ...prev,
          ...(JSON.parse(storedProfile) as Partial<ProfileForm>),
        }));
      }
      const storedNotifs = localStorage.getItem(NOTIF_KEY);
      if (storedNotifs) {
        setNotifs({
          ...defaultNotifs,
          ...(JSON.parse(storedNotifs) as Partial<NotificationPrefs>),
        });
      }
    } catch {
      // ignore corrupted mock storage
    }
  }, []);

  const initials = React.useMemo(() => {
    const name = profile.fullName || user?.name || "JD";
    return name
      .split(/\s+/)
      .map((p) => p[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }, [profile.fullName, user?.name]);

  const sidebarItems: {
    id: SettingsTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    disabled?: boolean;
  }[] = [
    { id: "profile", label: "Profile", icon: User },
    { id: "notifications", label: "Notifications", icon: Bell },
    {
      id: "purchase-document",
      label: "Purchase Document",
      icon: FileText,
      disabled: true,
    },
    { id: "change-password", label: "Change Password", icon: Lock },
  ];

  const saveProfile = async () => {
    if (!user?.id) {
      showToast("You must be signed in to save profile", "error");
      return;
    }
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    const result = await updateUser(String(user.id), {
      fullName: profile.fullName,
      email: profile.email,
      phoneNumber: profile.phoneNumber || undefined,
      businessName: profile.businessName || undefined,
      address: profile.address || undefined,
      city: profile.city || undefined,
      state: profile.state || undefined,
      country: profile.country || undefined,
    });
    if (!result.success) {
      showToast(result.error || "Could not save profile", "error");
      return;
    }
    setUser({
      ...user,
      name: profile.fullName || user.name,
      email: profile.email || user.email,
    });
    showToast("Profile saved", "success");
  };

  const saveNotifs = () => {
    localStorage.setItem(NOTIF_KEY, JSON.stringify(notifs));
    showToast("Preferences saved", "success");
  };

  const savePassword = async () => {
    if (!user?.id) {
      showToast("You must be signed in to change password", "error");
      return;
    }
    if (!passwordForm.current || !passwordForm.next || !passwordForm.confirm) {
      showToast("Please fill in all password fields", "error");
      return;
    }
    if (passwordForm.next.length < 8) {
      showToast("New password must be at least 8 characters", "error");
      return;
    }
    if (passwordForm.next !== passwordForm.confirm) {
      showToast("New passwords do not match", "error");
      return;
    }
    const result = await updateUserPassword(String(user.id), {
      currentPassword: passwordForm.current,
      newPassword: passwordForm.next,
      confirmNewPassword: passwordForm.confirm,
    });
    if (!result.success) {
      showToast(result.error || "Could not update password", "error");
      return;
    }
    setPasswordForm({ current: "", next: "", confirm: "" });
    showToast("Password updated", "success");
  };

  return (
    <>
      <Head>
        <title>Settings | Dwelliva</title>
      </Head>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your account and platform preferences
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
          <aside className="h-fit rounded-2xl border border-gray-200 bg-white p-2 shadow-sm">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={item.disabled}
                  onClick={() => {
                    if (!item.disabled) setTab(item.id);
                  }}
                  className={`mb-1 flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
                    item.disabled
                      ? "cursor-not-allowed text-gray-300"
                      : active
                        ? "border-l-2 border-[var(--brand-main)] bg-sky-50 text-[var(--brand-main)]"
                        : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </aside>

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
            {tab === "profile" ? (
              <div>
                <h2 className="mb-6 text-lg font-semibold text-gray-900">
                  Profile Information
                </h2>

                <div className="mb-6 flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-[var(--brand-main)] text-lg font-semibold text-white">
                    {profilePreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={profilePreview}
                        alt="Profile"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      initials
                    )}
                  </div>
                  <div>
                    <label className="cursor-pointer text-sm font-medium text-[var(--brand-main)] hover:underline">
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (file.size > 2 * 1024 * 1024) {
                            showToast("Photo must be 2MB or less", "error");
                            return;
                          }
                          setProfilePreview(URL.createObjectURL(file));
                          if (!user?.token) return;
                          const uploaded = await uploadFile({
                            file,
                            folder: "guest",
                            label: "profile_picture",
                            token: user.token,
                          });
                          if (!uploaded.success) {
                            showToast(
                              uploaded.error || "Could not upload photo",
                              "error",
                            );
                            return;
                          }
                          if (user.id) {
                            await updateUser(String(user.id), {
                              profilePictureId: uploaded.data.id,
                            });
                          }
                          showToast("Photo uploaded", "success");
                        }}
                      />
                      Change Photo
                    </label>
                    <p className="text-xs text-gray-500">JPG, PNG up to 2MB</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {(
                    [
                      ["fullName", "Full Name"],
                      ["email", "Email Address"],
                      ["phoneNumber", "Phone Number"],
                      ["businessName", "Business Name"],
                      ["address", "Address"],
                      ["city", "City"],
                      ["state", "State"],
                      ["country", "Country"],
                    ] as const
                  ).map(([key, label]) => (
                    <div key={key}>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        {label}
                      </label>
                      {key === "phoneNumber" ? (
                        <PhoneInputWithCountry
                          id="guest-phone"
                          value={profile.phoneNumber}
                          onChange={(value) =>
                            setProfile((prev) => ({
                              ...prev,
                              phoneNumber: value ?? "",
                            }))
                          }
                          placeholder="Placeholder"
                          className="w-full focus-within:border-transparent focus-within:ring-2 focus-within:ring-[var(--brand-main)]"
                        />
                      ) : (
                        <input
                          value={profile[key]}
                          onChange={(e) =>
                            setProfile((prev) => ({
                              ...prev,
                              [key]: e.target.value,
                            }))
                          }
                          placeholder="Placeholder"
                          className={inputClassName}
                        />
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={saveProfile}
                  className="mt-8 rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
                >
                  Save Changes
                </button>
              </div>
            ) : null}

            {tab === "notifications" ? (
              <div>
                <h2 className="mb-2 text-lg font-semibold text-gray-900">
                  Notification Preferences
                </h2>
                <p className="mb-6 text-sm text-gray-600">
                  Choose how you want to receive notifications.
                </p>

                <div className="divide-y divide-gray-100">
                  {(
                    [
                      {
                        key: "payments" as const,
                        title: "Payment Notifications",
                        desc: "Get notified when tenants make payments.",
                      },
                      {
                        key: "maintenance" as const,
                        title: "Maintenance Requests",
                        desc: "Get notified about new maintenance requests.",
                      },
                      {
                        key: "overdue" as const,
                        title: "Overdue Rent Alerts",
                        desc: "Get notified when rent payments are overdue.",
                      },
                    ] as const
                  ).map((row) => (
                    <div
                      key={row.key}
                      className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {row.title}
                        </p>
                        <p className="text-xs text-gray-500">{row.desc}</p>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-700">
                        {(["email", "push", "sms"] as const).map((channel) => (
                          <label
                            key={channel}
                            className="inline-flex items-center gap-2 capitalize"
                          >
                            <input
                              type="checkbox"
                              checked={notifs[row.key][channel]}
                              onChange={(e) =>
                                setNotifs((prev) => ({
                                  ...prev,
                                  [row.key]: {
                                    ...prev[row.key],
                                    [channel]: e.target.checked,
                                  },
                                }))
                              }
                              className="h-4 w-4 rounded border-gray-300 text-[var(--brand-main)] focus:ring-[var(--brand-main)]"
                            />
                            {channel === "sms"
                              ? "SMS"
                              : channel[0].toUpperCase() + channel.slice(1)}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}

                  <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        Weekly Reports
                      </p>
                      <p className="text-xs text-gray-500">
                        Receive weekly summary reports.
                      </p>
                    </div>
                    <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={notifs.weekly.email}
                        onChange={(e) =>
                          setNotifs((prev) => ({
                            ...prev,
                            weekly: { email: e.target.checked },
                          }))
                        }
                        className="h-4 w-4 rounded border-gray-300 text-[var(--brand-main)] focus:ring-[var(--brand-main)]"
                      />
                      Email
                    </label>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={saveNotifs}
                  className="mt-8 rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
                >
                  Save Preferences
                </button>
              </div>
            ) : null}

            {tab === "change-password" ? (
              <div>
                <h2 className="mb-6 text-lg font-semibold text-gray-900">
                  Change Password
                </h2>

                <div className="max-w-xl space-y-4">
                  {(
                    [
                      {
                        key: "current" as const,
                        label: "Current Password",
                        show: showCurrent,
                        setShow: setShowCurrent,
                      },
                      {
                        key: "next" as const,
                        label: "NEW Password",
                        show: showNext,
                        setShow: setShowNext,
                      },
                      {
                        key: "confirm" as const,
                        label: "Confirm New Password",
                        show: showConfirm,
                        setShow: setShowConfirm,
                      },
                    ] as const
                  ).map((field) => (
                    <div key={field.key}>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        {field.label}
                      </label>
                      <div className="relative">
                        <Key className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                          type={field.show ? "text" : "password"}
                          value={passwordForm[field.key]}
                          onChange={(e) =>
                            setPasswordForm((prev) => ({
                              ...prev,
                              [field.key]: e.target.value,
                            }))
                          }
                          className={`${inputClassName} pl-10 pr-10`}
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => field.setShow((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          aria-label={
                            field.show ? "Hide password" : "Show password"
                          }
                        >
                          {field.show ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={savePassword}
                  className="mt-8 rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
                >
                  Save Preferences
                </button>
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </>
  );
};

GuestSettingsPage.getLayout = (page) => <GuestLayout>{page}</GuestLayout>;

export default GuestSettingsPage;
