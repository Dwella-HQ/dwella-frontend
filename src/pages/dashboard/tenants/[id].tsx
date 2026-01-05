import * as React from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Phone,
  Mail,
  Home,
  Calendar,
  DollarSign,
  CheckCircle2,
  FileText,
  Wrench,
  MessageSquare,
  Upload,
  User,
} from "lucide-react";

import { DashboardLayout } from "@/components/DashboardLayout";
import { mockTenants, mockPaymentHistory } from "@/data/mockPropertyDetails";
import { mockMaintenanceRequestDetails } from "@/data/mockPropertyDetails";
import type { NextPageWithLayout } from "../../_app";

// Mock data for tenant documents
const mockTenantDocuments = [
  {
    id: "1",
    name: "Lease Agreement.pdf",
    type: "Lease",
    size: "2.3 MB",
    date: "05 Jan 2024",
  },
  {
    id: "2",
    name: "National ID Card.pdf",
    type: "ID",
    size: "1.1 MB",
    date: "05 Jan 2024",
  },
  {
    id: "3",
    name: "Employment Letter.pdf",
    type: "Employment",
    size: "856 KB",
    date: "05 Jan 2024",
  },
  {
    id: "4",
    name: "Bank Statement.pdf",
    type: "Financial",
    size: "3.2 MB",
    date: "05 Jan 2024",
  },
];

// Mock data for communications
const mockCommunications = [
  {
    id: "1",
    type: "maintenance",
    subject: "AC Issue",
    message: "The AC in my unit is not cooling properly...",
    date: "05 Dec 2025",
    icon: MessageSquare,
  },
  {
    id: "2",
    type: "payment",
    subject: "Rent Payment Confirmation",
    message: "Thank you for your payment of ₦120,000...",
    date: "05 Nov 2025",
    icon: Mail,
  },
  {
    id: "3",
    type: "inquiry",
    subject: "Parking Inquiry",
    message: "I wanted to ask about the visitor parking...",
    date: "20 Oct 2025",
    icon: MessageSquare,
  },
];

// Mock emergency contact
const mockEmergencyContact = {
  name: "John Emmanuel (Brother)",
  phone: "+234 812 345 6788",
  email: "john.emmanuel@email.com",
};

const TenantProfilePage: NextPageWithLayout = () => {
  const router = useRouter();
  const { id } = router.query;
  const [activeTab, setActiveTab] = React.useState("overview");

  const tenant = React.useMemo(() => {
    return mockTenants.find((t) => t.id === id);
  }, [id]);

  const tenantPayments = React.useMemo(() => {
    if (!tenant) return [];
    return mockPaymentHistory.filter((p) => p.tenantId === tenant.id);
  }, [tenant]);

  const tenantMaintenance = React.useMemo(() => {
    if (!tenant) return [];
    return mockMaintenanceRequestDetails.filter((m) => m.tenantId === tenant.id);
  }, [tenant]);

  if (!tenant) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-600">Tenant not found</p>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Calculate total paid (sum of all payments)
  const totalPaid = tenantPayments.reduce((sum, payment) => sum + payment.amount, 0);
  
  // Get monthly rent - default to 120000 for Ada Emmanuel
  const monthlyRent = 120000;

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "payments", label: "Payments" },
    { id: "documents", label: "Documents" },
    { id: "maintenance", label: "Maintenance" },
    { id: "communications", label: "Communications" },
  ];

  return (
    <>
      <Head>
        <title>DWELLA NG · Tenant Profile</title>
      </Head>

      <section className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Tenant Profile</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 whitespace-nowrap"
            >
              Edit Profile
            </button>
            <button
              type="button"
              onClick={() => router.push("/dashboard/messages")}
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 whitespace-nowrap"
            >
              Message
            </button>
          </div>
        </div>

        {/* Tenant Information Card */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 relative">
          {/* Paid Badge */}
          <div className="absolute right-6 top-6">
            <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
              Paid
            </span>
          </div>

          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="flex h-24 w-24 items-center justify-center rounded-lg bg-gray-200 text-2xl font-bold text-gray-700">
              {getInitials(tenant.name)}
            </div>

            {/* Tenant Details */}
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">{tenant.name}</h2>
              <p className="mt-1 text-sm text-gray-600">
                Tenant • Unit {tenant.unitId}
              </p>

              {/* Contact Information */}
              <div className="mt-4 flex flex-wrap gap-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                    <Phone className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="text-sm font-medium text-gray-900">{tenant.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
                    <Mail className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-sm font-medium text-gray-900">{tenant.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50">
                    <Home className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Unit</p>
                    <p className="text-sm font-medium text-gray-900">Unit {tenant.unitId}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Financial/Lease Summary Cards */}
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-lg border border-gray-200 bg-blue-50 p-4">
              <p className="text-xs font-medium text-blue-700 uppercase">Monthly Rent</p>
              <p className="mt-1 text-xl font-bold text-gray-900">
                ₦{monthlyRent.toLocaleString()}
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-green-50 p-4">
              <p className="text-xs font-medium text-green-700 uppercase">Move-in Date</p>
              <p className="mt-1 text-xl font-bold text-gray-900">
                {tenant.leaseStart.split(" ")[1]} {tenant.leaseStart.split(" ")[2]}
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-purple-50 p-4">
              <p className="text-xs font-medium text-purple-700 uppercase">Lease Ends</p>
              <p className="mt-1 text-xl font-bold text-gray-900">
                {tenant.leaseEnd.split(" ")[1]} {tenant.leaseEnd.split(" ")[2]}
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-orange-50 p-4">
              <p className="text-xs font-medium text-orange-700 uppercase">Total Paid</p>
              <p className="mt-1 text-xl font-bold text-gray-900">
                ₦{totalPaid.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 overflow-x-auto scrollbar-hide">
          <nav className="-mb-px flex space-x-4 sm:space-x-8 relative min-w-max">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`relative whitespace-nowrap px-1 py-4 text-sm font-medium transition flex-shrink-0 ${
                  activeTab === tab.id
                    ? "text-brand-main"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTenantTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-main"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm space-y-6"
            >
              {/* Lease Information */}
              <div>
                <h3 className="mb-4 text-lg font-semibold text-gray-900">Lease Information</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border border-gray-200 bg-white p-4">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Lease Start</p>
                        <p className="mt-1 text-sm font-semibold text-gray-900">
                          {tenant.leaseStart}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-white p-4">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Lease End</p>
                        <p className="mt-1 text-sm font-semibold text-gray-900">
                          {tenant.leaseEnd}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-white p-4">
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Monthly Rent</p>
                        <p className="mt-1 text-sm font-semibold text-gray-900">
                          ₦{monthlyRent.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-white p-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Payment Status</p>
                        <p className="mt-1">
                          <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                            Paid
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div>
                <h3 className="mb-4 text-lg font-semibold text-gray-900">Emergency Contact</h3>
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <p className="text-sm font-semibold text-gray-900">{mockEmergencyContact.name}</p>
                  <div className="mt-3 flex flex-wrap gap-6">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{mockEmergencyContact.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{mockEmergencyContact.email}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "payments" && (
            <motion.div
              key="payments"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Payment History</h3>
              </div>
              <div className="space-y-3">
                {tenantPayments.length > 0 ? (
                  tenantPayments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{payment.method}</p>
                          <p className="text-xs text-gray-500">
                            {payment.date} • {payment.transactionId.replace("TXN-", "TXN-2025-")}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">
                          ₦{payment.amount.toLocaleString()}
                        </p>
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700 mt-1">
                          Completed
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                      <DollarSign className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-900">No payments found</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === "documents" && (
            <motion.div
              key="documents"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Documents</h3>
                <button
                  type="button"
                  className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Upload Document
                </button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {mockTenantDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="rounded-lg border border-gray-200 bg-white p-4"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50">
                        <FileText className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                        <p className="mt-1 text-xs text-gray-500">
                          {doc.type} • {doc.size}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">{doc.date}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === "maintenance" && (
            <motion.div
              key="maintenance"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Maintenance Requests</h3>
              </div>
              <div className="space-y-3">
                {tenantMaintenance.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{request.type}:</p>
                        <p className="text-xs text-gray-500">{request.subType}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Reported: {request.reportedDate}
                          {request.resolvedDate && ` • Resolved: ${request.resolvedDate}`}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="rounded-lg bg-blue-100 px-3 py-1.5 text-xs font-medium text-blue-700"
                    >
                      Resolved
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === "communications" && (
            <motion.div
              key="communications"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Communication History</h3>
                <button
                  type="button"
                  className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
                >
                  New Message
                </button>
              </div>
              <div className="space-y-3">
                {mockCommunications.map((comm) => {
                  const Icon = comm.icon;
                  return (
                    <div
                      key={comm.id}
                      className="flex items-start gap-4 rounded-lg border border-gray-200 bg-white p-4"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                        <Icon className="h-5 w-5 text-gray-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{comm.subject}</p>
                        <p className="mt-1 text-sm text-gray-600">{comm.message}</p>
                        <p className="mt-2 text-xs text-gray-500">{comm.date}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </>
  );
};

TenantProfilePage.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;

export default TenantProfilePage;

