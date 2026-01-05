import Head from "next/head";
import * as React from "react";
import { motion } from "framer-motion";
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
} from "lucide-react";
import type { NextPageWithLayout } from "../_app";

type SettingsTab =
  | "profile"
  | "documents"
  | "notifications"
  | "payment-details"
  | "preferences"
  | "change-password";

const SettingsPage: NextPageWithLayout = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState<SettingsTab>("profile");
  const [showCurrentPassword, setShowCurrentPassword] = React.useState(false);
  const [showNewPassword, setShowNewPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  // Notification preferences state
  const [notifications, setNotifications] = React.useState({
    payment: { email: true, push: true, sms: false },
    maintenance: { email: true, push: true, sms: true },
    overdue: { email: true, push: false, sms: true },
    reports: { email: true, push: false, sms: false },
  });

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
      id: "change-password" as SettingsTab,
      label: "Change Password",
      icon: Lock,
    },
  ];

  const handleNotificationChange = (
    category: keyof typeof notifications,
    type: "email" | "push" | "sms"
  ) => {
    setNotifications((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [type]: !prev[category][type],
      },
    }));
  };

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

                {/* Avatar Upload */}
                <div className="flex items-center gap-4">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-main text-2xl font-semibold text-white">
                    JD
                  </div>
                  <button
                    type="button"
                    className="text-sm font-medium text-brand-main hover:text-brand-main/80"
                  >
                    Change Photo
                    <p className="text-xs text-gray-500">
                      JPG, PNG up to 2MB
                    </p>
                  </button>
                </div>

                {/* Form Fields */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Full Name
                    </label>
                    <input
                      type="text"
                      placeholder="Placeholder"
                      className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-main focus:outline-none focus:ring-2 focus:ring-brand-main"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="Placeholder"
                      className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-main focus:outline-none focus:ring-2 focus:ring-brand-main"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      placeholder="Placeholder"
                      className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-main focus:outline-none focus:ring-2 focus:ring-brand-main"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Business Name
                    </label>
                    <input
                      type="text"
                      placeholder="Placeholder"
                      className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-main focus:outline-none focus:ring-2 focus:ring-brand-main"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Address
                    </label>
                    <input
                      type="text"
                      placeholder="Placeholder"
                      className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-main focus:outline-none focus:ring-2 focus:ring-brand-main"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      City
                    </label>
                    <input
                      type="text"
                      placeholder="Placeholder"
                      className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-main focus:outline-none focus:ring-2 focus:ring-brand-main"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      State
                    </label>
                    <input
                      type="text"
                      placeholder="Placeholder"
                      className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-main focus:outline-none focus:ring-2 focus:ring-brand-main"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Country
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
                  Save Changes
                </motion.button>
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
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-brand-main transition hover:bg-gray-50"
                    >
                      <Upload className="h-4 w-4" />
                      Choose File
                    </button>
                  </div>

                  {/* Land Survey Document */}
                  <div>
                    <h3 className="mb-1 text-sm font-semibold text-gray-900">
                      Land Survey Document
                    </h3>
                    <p className="mb-3 text-sm text-gray-600">
                      Property map, site plans, or official record
                    </p>
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-brand-main transition hover:bg-gray-50"
                    >
                      <Upload className="h-4 w-4" />
                      Choose File
                    </button>
                  </div>

                  {/* Proof of Ownership */}
                  <div>
                    <h3 className="mb-1 text-sm font-semibold text-gray-900">
                      Proof of Ownership
                    </h3>
                    <p className="mb-3 text-sm text-gray-600">
                      Document, receipt of purchase, or transfer agreement
                    </p>
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-brand-main transition hover:bg-gray-50"
                    >
                      <Upload className="h-4 w-4" />
                      Choose File (Optional)
                    </button>
                  </div>

                  {/* Tax Identification Number */}
                  <div>
                    <h3 className="mb-1 text-sm font-semibold text-gray-900">
                      Tax Identification Number (TIN)
                    </h3>
                    <p className="mb-3 text-sm text-gray-600">
                      Tax certificate or TIN document
                    </p>
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-brand-main transition hover:bg-gray-50"
                    >
                      <Upload className="h-4 w-4" />
                      Choose File (Optional)
                    </button>
                  </div>
                </div>
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
                  className="rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
                >
                  Save Preferences
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
                      placeholder="Placeholder"
                      className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-main focus:outline-none focus:ring-2 focus:ring-brand-main"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Default Payment Due Day
                    </label>
                    <input
                      type="text"
                      placeholder="Placeholder"
                      className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-main focus:outline-none focus:ring-2 focus:ring-brand-main"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Default Late Fee (%)
                    </label>
                    <input
                      type="text"
                      placeholder="Placeholder"
                      className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-main focus:outline-none focus:ring-2 focus:ring-brand-main"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Default Late Fee (%)
                    </label>
                    <input
                      type="text"
                      placeholder="Placeholder"
                      className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-main focus:outline-none focus:ring-2 focus:ring-brand-main"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Language
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
                  Save Preferences
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
