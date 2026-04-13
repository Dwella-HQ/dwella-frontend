import Head from "next/head";
import * as React from "react";
import type { NextPageWithLayout } from "@/pages/_app";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Eye, EyeOff } from "lucide-react";

type AdminSettingsTab = "profile" | "notifications" | "change-password";

const AdminSettingsPage: NextPageWithLayout = () => {
  const [tab, setTab] = React.useState<AdminSettingsTab>("profile");
  const [showCurrent, setShowCurrent] = React.useState(false);
  const [showNext, setShowNext] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);

  return (
    <>
      <Head>
        <title>DWELLA NG · Settings</title>
      </Head>
      <AdminLayout title="Settings">
        <section className="grid max-w-[980px] grid-cols-[240px_1fr] gap-4">
          <div className="h-fit rounded-lg border border-[#E2E8F0] bg-white p-3 text-sm">
            <button
              onClick={() => setTab("profile")}
              className={`mb-1 w-full rounded-md px-3 py-2 text-left ${tab === "profile" ? "bg-[#EFF6FF] text-[#0284C7]" : ""}`}
            >
              Profile
            </button>
            <button
              onClick={() => setTab("notifications")}
              className={`mb-1 w-full rounded-md px-3 py-2 text-left ${tab === "notifications" ? "bg-[#EFF6FF] text-[#0284C7]" : ""}`}
            >
              Notifications
            </button>
            <button
              onClick={() => setTab("change-password")}
              className={`w-full rounded-md px-3 py-2 text-left ${tab === "change-password" ? "bg-[#EFF6FF] text-[#0284C7]" : ""}`}
            >
              Change Password
            </button>
          </div>

          <div className="rounded-lg border border-[#E2E8F0] bg-white p-5">
            {tab === "profile" ? (
              <div className="max-w-[520px] space-y-4">
                <p className="text-base font-semibold">Profile Information</p>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0EA5E9] text-sm font-semibold text-white">
                    JD
                  </div>
                  <p className="text-xs text-[#64748B]">Admin profile photo</p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <input
                    className="h-10 rounded-md border border-[#E2E8F0] px-3"
                    placeholder="Full Name"
                  />
                  <input
                    className="h-10 rounded-md border border-[#E2E8F0] px-3"
                    placeholder="Email Address"
                  />
                </div>
                <button className="rounded-md bg-[#111827] px-5 py-2 text-sm text-white">
                  Save Changes
                </button>
              </div>
            ) : null}

            {tab === "notifications" ? (
              <div className="max-w-[700px] space-y-5 text-sm">
                <p className="text-base font-semibold">
                  Notification Preferences
                </p>
                {[
                  "Payment Notifications",
                  "Maintenance Requests",
                  "Overdue Rent Alerts",
                ].map((label) => (
                  <div key={label} className="border-b border-[#E2E8F0] pb-3">
                    <p className="font-medium">{label}</p>
                    <div className="mt-2 flex gap-5 text-xs">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" defaultChecked />
                        Email
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" />
                        Push
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" />
                        SMS
                      </label>
                    </div>
                  </div>
                ))}
                <div className="pb-1">
                  <p className="font-medium">Weekly Reports</p>
                  <div className="mt-2 text-xs">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" defaultChecked />
                      Email
                    </label>
                  </div>
                </div>
                <button className="rounded-md bg-[#111827] px-5 py-2 text-sm text-white">
                  Save Preferences
                </button>
              </div>
            ) : null}

            {tab === "change-password" ? (
              <div className="max-w-[700px] space-y-4">
                <p className="text-base font-semibold">Change Password</p>
                <div className="space-y-3 text-sm">
                  <div className="relative">
                    <input
                      type={showCurrent ? "text" : "password"}
                      className="h-11 w-full rounded-md border border-[#E2E8F0] px-3 pr-10"
                      placeholder="Current Password"
                    />
                    <button
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
                      className="h-11 w-full rounded-md border border-[#E2E8F0] px-3 pr-10"
                      placeholder="New Password"
                    />
                    <button
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
                      className="h-11 w-full rounded-md border border-[#E2E8F0] px-3 pr-10"
                      placeholder="Confirm New Password"
                    />
                    <button
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
                <button className="rounded-md bg-[#111827] px-5 py-2 text-sm text-white">
                  Save Preferences
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
