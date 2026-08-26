import * as React from "react";
import Head from "next/head";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Copy,
  Eye,
  ImagePlus,
  KeyRound,
  Lock,
  Mail,
  MoreVertical,
  Plus,
  Shield,
  User,
  X,
  XCircle,
} from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useUser } from "@/contexts/UserContext";
import { getTenantByUser } from "@/api/tenants";
import type { NextPageWithLayout } from "../_app";

type AccessCodeType = "visitor" | "resident";
type AccessCodeStatus = "active" | "used" | "revoked";
type AccessCodeTab = "all" | "resident" | "visitor" | "audit";

type AccessCode = {
  id: string;
  code: string;
  recipient: string;
  note: string;
  unit: string;
  type: AccessCodeType;
  validity: string;
  usage: string;
  status: AccessCodeStatus;
  createdBy: "landlord" | "manager" | "tenant";
};

type AccessView = "full" | "simple";

type ScanRecord = {
  id: string;
  timestamp: string;
  person: string;
  unit: string;
  code: string;
  confirmedBy: string;
  outcome: "granted" | "denied";
  note: string;
};

type SecurityPerson = {
  id: string;
  name: string;
  email: string;
  assignedProperty: string;
  scans: number;
  lastScanDate: string;
  avatarUrl?: string;
};

const initialCodes: AccessCode[] = [
  {
    id: "code-1",
    code: "849201",
    recipient: "John Doe - Contractor",
    note: "Maintenance",
    unit: "Apt 4B, Lekki Haven",
    type: "visitor",
    validity: "Today, 11:59 PM",
    usage: "0 / 1 Uses",
    status: "active",
    createdBy: "landlord",
  },
  {
    id: "code-2",
    code: "592103",
    recipient: "Sarah Smith",
    note: "Permanent Resident",
    unit: "Apt 2A, Lekki Haven",
    type: "resident",
    validity: "90 Days Left",
    usage: "4 / ∞ Uses",
    status: "active",
    createdBy: "landlord",
  },
  {
    id: "code-3",
    code: "103944",
    recipient: "Amazon Delivery",
    note: "Delivery",
    unit: "Apt 4B, Lekki Haven",
    type: "visitor",
    validity: "Expired",
    usage: "1 / 1 Uses",
    status: "used",
    createdBy: "tenant",
  },
  {
    id: "code-4",
    code: "772910",
    recipient: "Mike (Plumber)",
    note: "Maintenance",
    unit: "Apt 1C, Lekki Haven",
    type: "visitor",
    validity: "Revoked",
    usage: "0 / 1 Uses",
    status: "revoked",
    createdBy: "tenant",
  },
];

const scanHistory: ScanRecord[] = [
  {
    id: "scan-1",
    timestamp: "Aug 6, 2026 • 14:22",
    person: "John Doe (Maintenance)",
    unit: "Apt 4B, Lekki Haven",
    code: "849201",
    confirmedBy: "Mike Johnson",
    outcome: "granted",
    note: "Checked ID",
  },
  {
    id: "scan-2",
    timestamp: "Aug 6, 2026 • 11:05",
    person: "Unknown",
    unit: "Apt 1C, Lekki Haven",
    code: "772910",
    confirmedBy: "Sarah Connor",
    outcome: "denied",
    note: "Code Revoked",
  },
  {
    id: "scan-3",
    timestamp: "Aug 5, 2026 • 18:30",
    person: "Amazon Delivery",
    unit: "Apt 4B, Lekki Haven",
    code: "103944",
    confirmedBy: "Mike Johnson",
    outcome: "granted",
    note: "Package dropped at door",
  },
];

const makeSecurityTeam = (): SecurityPerson[] =>
  Array.from({ length: 20 }, (_, index) => ({
    id: `security-${index + 1}`,
    name: index % 3 === 1 ? "Sarah Connor" : "Mike Johnson",
    email: index % 3 === 1 ? "sarah@dwella.com" : "mike@dwella.com",
    assignedProperty: index % 4 === 2 ? "Apt 1C, Lekki Haven" : "Lekki Haven",
    scans: index % 3 === 1 ? 96 : 142,
    lastScanDate: "15 Jan 2026",
    avatarUrl:
      index % 3 === 1
        ? "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=96&q=80"
        : "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=96&q=80",
  }));

const codeTabs: { key: AccessCodeTab; label: string }[] = [
  { key: "all", label: "All Codes" },
  { key: "resident", label: "Resident Codes" },
  { key: "visitor", label: "Temporary / Visitor Codes" },
  { key: "audit", label: "Gate Entry Audit Log" },
];

const statusStyles: Record<AccessCodeStatus, string> = {
  active: "bg-green-50 text-green-700",
  used: "bg-orange-50 text-orange-700",
  revoked: "bg-red-50 text-red-700",
};

const typeStyles: Record<AccessCodeType, string> = {
  visitor: "bg-orange-50 text-orange-700",
  resident: "bg-purple-50 text-purple-700",
};

const outcomeStyles: Record<ScanRecord["outcome"], string> = {
  granted: "bg-green-50 text-green-700",
  denied: "bg-red-50 text-red-700",
};

const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

const formatCode = (code: string) => code.split("").join(" ");

const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

const AccessSecurityPage: NextPageWithLayout = () => {
  const { user } = useUser();
  const isSimpleView =
    user?.role === "tenant" || user?.role === "property_manager";
  const view: AccessView = isSimpleView ? "simple" : "full";
  const creator: AccessCode["createdBy"] =
    user?.role === "tenant"
      ? "tenant"
      : user?.role === "property_manager"
        ? "manager"
        : "landlord";

  const [section, setSection] = React.useState<"codes" | "personnel">("codes");
  const [activeCodeTab, setActiveCodeTab] = React.useState<AccessCodeTab>("all");
  const [codes, setCodes] = React.useState<AccessCode[]>(initialCodes);
  const [securityTeam, setSecurityTeam] = React.useState<SecurityPerson[]>(
    makeSecurityTeam()
  );
  const [showCodeModal, setShowCodeModal] = React.useState(false);
  const [showPersonnelModal, setShowPersonnelModal] = React.useState(false);
  const [selectedSecurity, setSelectedSecurity] =
    React.useState<SecurityPerson | null>(null);
  const [tenantUnitLabel, setTenantUnitLabel] = React.useState("Your unit");

  React.useEffect(() => {
    if (user?.role !== "tenant" || !user.id) return;
    let cancelled = false;
    void getTenantByUser(String(user.id)).then((result) => {
      if (cancelled || !result.success) return;
      const unit = result.data.currentUnit;
      if (!unit?.name) return;
      const propertyName = unit.property?.name?.trim();
      setTenantUnitLabel(
        propertyName ? `${unit.name}, ${propertyName}` : unit.name,
      );
    });
    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.role]);

  const visibleCodes = React.useMemo(() => {
    if (view === "simple" && creator === "tenant") {
      return codes.filter((code) => code.createdBy === "tenant");
    }
    return codes;
  }, [codes, creator, view]);

  const activeCodes = visibleCodes.filter((code) => code.status === "active")
    .length;
  const usedCodes = visibleCodes.filter((code) => code.status === "used").length;
  const revokedCodes = visibleCodes.filter(
    (code) => code.status === "revoked",
  ).length;

  return (
    <>
      <Head>
        <title>Access & Security | Dwelliva</title>
      </Head>
      <div className="w-full py-10">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Access & Security
              </h1>
              <p className="mt-2 max-w-3xl text-gray-600">
                {view === "simple"
                  ? "Generate access codes and manage active visitor permissions for your unit."
                  : "Generate access codes, manage active permissions, and oversee your security personnel."}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                view === "simple" || section === "codes"
                  ? setShowCodeModal(true)
                  : setShowPersonnelModal(true)
              }
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-gray-800"
            >
              <Plus className="h-4 w-4" />
              {view === "simple" || section === "codes"
                ? "Create Access Code"
                : "Add Personnel"}
            </button>
          </div>

          {view === "full" ? (
            <div className="inline-flex w-fit rounded-lg bg-gray-100 p-1">
              <button
                type="button"
                onClick={() => setSection("codes")}
                className={cx(
                  "inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition",
                  section === "codes"
                    ? "bg-white text-gray-950 shadow-sm"
                    : "text-gray-500 hover:text-gray-900"
                )}
              >
                <KeyRound className="h-4 w-4" />
                Access Codes
              </button>
              <button
                type="button"
                onClick={() => setSection("personnel")}
                className={cx(
                  "inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition",
                  section === "personnel"
                    ? "bg-white text-gray-950 shadow-sm"
                    : "text-gray-500 hover:text-gray-900"
                )}
              >
                <Shield className="h-4 w-4" />
                Security Personnel
              </button>
            </div>
          ) : null}

          <AnimatePresence mode="wait">
            {view === "simple" || section === "codes" ? (
              <motion.div
                key="codes"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="w-full space-y-6"
              >
                <div className="grid gap-4 md:grid-cols-3">
                  <StatCard
                    icon={<KeyRound className="h-6 w-6" />}
                    label="Active Codes"
                    value={activeCodes}
                    tone="blue"
                  />
                  {view === "simple" ? (
                    <>
                      <StatCard
                        icon={<CheckCircle2 className="h-6 w-6" />}
                        label="Used"
                        value={usedCodes}
                        tone="green"
                      />
                      <StatCard
                        icon={<XCircle className="h-6 w-6" />}
                        label="Revoked"
                        value={revokedCodes}
                        tone="red"
                      />
                    </>
                  ) : (
                    <>
                      <StatCard
                        icon={<CheckCircle2 className="h-6 w-6" />}
                        label="Today's Gate Entries"
                        value={24}
                        tone="green"
                      />
                      <StatCard
                        icon={<XCircle className="h-6 w-6" />}
                        label="Denied Access Flag"
                        value={3}
                        tone="orange"
                        caption="Last 24h"
                      />
                    </>
                  )}
                </div>

                <AccessCodesPanel
                  codes={visibleCodes}
                  activeTab={activeCodeTab}
                  onTabChange={setActiveCodeTab}
                  compact={view === "simple"}
                  onRevoke={(id) =>
                    setCodes((current) =>
                      current.map((code) =>
                        code.id === id
                          ? {
                              ...code,
                              status: "revoked",
                              validity: "Revoked",
                            }
                          : code
                      )
                    )
                  }
                />
              </motion.div>
            ) : (
              <motion.div
                key="personnel"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="w-full"
              >
                <SecurityPersonnelPanel
                  team={securityTeam}
                  onViewScans={setSelectedSecurity}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <GenerateCodeModal
        open={showCodeModal}
        createdBy={creator}
        unitLabel={
          user?.role === "tenant" ? tenantUnitLabel : "Apt 4B, Lekki Haven"
        }
        onClose={() => setShowCodeModal(false)}
        onGenerate={(newCode) => {
          setCodes((current) => [newCode, ...current]);
          setActiveCodeTab("all");
          setShowCodeModal(false);
        }}
      />
      {view === "full" ? (
        <>
          <AddPersonnelModal
            open={showPersonnelModal}
            onClose={() => setShowPersonnelModal(false)}
            onConfirm={(person) => {
              setSecurityTeam((current) => [person, ...current]);
              setShowPersonnelModal(false);
            }}
          />
          <ScanHistoryModal
            person={selectedSecurity}
            onClose={() => setSelectedSecurity(null)}
          />
        </>
      ) : null}
    </>
  );
};

const StatCard = ({
  icon,
  label,
  value,
  tone,
  caption,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: "blue" | "green" | "orange" | "red";
  caption?: string;
}) => {
  const tones = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-green-50 text-green-700",
    orange: "bg-orange-50 text-orange-700",
    red: "bg-red-50 text-red-700",
  };

  return (
    <div
      className={cx(
        "rounded-lg border border-gray-200 p-5 shadow-sm",
        tones[tone]
      )}
    >
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/70">
          {icon}
        </div>
        <div>
          <p className="text-sm font-semibold">{label}</p>
          <div className="flex items-end gap-2">
            <p className="text-3xl font-bold text-gray-950">{value}</p>
            {caption ? (
              <p className="pb-1 text-xs font-semibold text-red-500">
                {caption}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

const AccessCodesPanel = ({
  codes,
  activeTab,
  onTabChange,
  onRevoke,
  compact = false,
}: {
  codes: AccessCode[];
  activeTab: AccessCodeTab;
  onTabChange: (tab: AccessCodeTab) => void;
  onRevoke: (id: string) => void;
  compact?: boolean;
}) => {
  const filteredCodes = React.useMemo(() => {
    if (activeTab === "resident") {
      return codes.filter((code) => code.type === "resident");
    }
    if (activeTab === "visitor") {
      return codes.filter((code) => code.type === "visitor");
    }
    return codes;
  }, [activeTab, codes]);

  return (
    <section className="w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      {compact ? null : (
        <div className="flex gap-6 overflow-x-auto border-b border-gray-200 px-5">
          {codeTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => onTabChange(tab.key)}
              className={cx(
                "whitespace-nowrap border-b-2 px-1 py-4 text-sm font-semibold transition",
                activeTab === tab.key
                  ? "border-brand-main text-brand-main"
                  : "border-transparent text-gray-500 hover:text-gray-900"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {!compact && activeTab === "audit" ? (
        <AuditLogTable scans={scanHistory} />
      ) : (
        <CodesTable codes={filteredCodes} onRevoke={onRevoke} compact={compact} />
      )}
    </section>
  );
};

const CodesTable = ({
  codes,
  onRevoke,
  compact = false,
}: {
  codes: AccessCode[];
  onRevoke: (id: string) => void;
  compact?: boolean;
}) => {
  const headings = compact
    ? ["Code", "Recipient", "Type", "Validity", "Status", "Actions"]
    : ["Code", "Recipient", "Unit / Property", "Type", "Validity", "Status", "Actions"];

  return (
  <div className="overflow-x-auto">
    <table className="min-w-full divide-y divide-gray-100">
      <thead className="bg-gray-50/80">
        <tr>
          {headings.map((heading) => (
              <th
                key={heading}
                className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-500"
              >
                {heading}
              </th>
            )
          )}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100 bg-white">
        {codes.length === 0 ? (
          <tr>
            <td
              colSpan={compact ? 6 : 7}
              className="px-5 py-12 text-center text-sm text-gray-500"
            >
              No access codes yet. Create one to get started.
            </td>
          </tr>
        ) : (
          codes.map((code) => (
          <tr key={code.id} className="transition hover:bg-gray-50">
            <td className="px-5 py-4">
              <button
                type="button"
                onClick={() => void navigator.clipboard?.writeText(code.code)}
                className="inline-flex min-w-[13rem] items-center justify-between gap-3 whitespace-nowrap rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-700 transition hover:border-brand-main hover:text-brand-main"
              >
                <span className="font-mono tracking-[0.28em]">
                  {formatCode(code.code)}
                </span>
                <Copy className="h-3.5 w-3.5 shrink-0 text-gray-400" />
              </button>
            </td>
            <td className="px-5 py-4">
              <p className="font-semibold text-gray-900">{code.recipient}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="text-xs text-gray-500">{code.note}</span>
                {compact ? null : (
                  <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-500">
                    Created by: {code.createdBy}
                  </span>
                )}
              </div>
            </td>
            {compact ? null : (
              <td className="px-5 py-4 text-sm text-gray-600">{code.unit}</td>
            )}
            <td className="px-5 py-4">
              <span
                className={cx(
                  "rounded-md px-3 py-1 text-xs font-semibold uppercase",
                  typeStyles[code.type]
                )}
              >
                {code.type === "resident" ? "Resident" : "Visitor"}
              </span>
            </td>
            <td className="px-5 py-4">
              <p className="text-sm text-gray-700">{code.validity}</p>
              <p className="mt-1 text-xs text-gray-400">{code.usage}</p>
            </td>
            <td className="px-5 py-4">
              <StatusPill status={code.status} />
            </td>
            <td className="px-5 py-4 text-right">
              <CodeActions code={code} onRevoke={onRevoke} />
            </td>
          </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
  );
};

const CodeActions = ({
  code,
  onRevoke,
}: {
  code: AccessCode;
  onRevoke: (id: string) => void;
}) => {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="rounded-md p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
        aria-label="Open code actions"
      >
        <MoreVertical className="h-5 w-5" />
      </button>
      {open ? (
        <div className="absolute right-0 top-10 z-20 w-40 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 text-left shadow-lg">
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard?.writeText(code.code);
              setOpen(false);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-50"
          >
            <Copy className="h-4 w-4" />
            Copy code
          </button>
          {code.status === "active" ? (
            <button
              type="button"
              onClick={() => {
                onRevoke(code.id);
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 transition hover:bg-red-50"
            >
              <XCircle className="h-4 w-4" />
              Revoke code
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

const StatusPill = ({ status }: { status: AccessCodeStatus }) => (
  <span
    className={cx(
      "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase",
      statusStyles[status]
    )}
  >
    <span
      className={cx(
        "h-1.5 w-1.5 rounded-full",
        status === "active"
          ? "bg-green-500"
          : status === "used"
            ? "bg-orange-500"
            : "bg-red-500"
      )}
    />
    {status}
  </span>
);

const AuditLogTable = ({ scans }: { scans: ScanRecord[] }) => (
  <div className="overflow-x-auto">
    <table className="min-w-full divide-y divide-gray-100">
      <thead className="bg-gray-50/80">
        <tr>
          {[
            "Timestamp",
            "Visitor / Person",
            "Unit Target",
            "Code Used",
            "Confirmed By",
            "Outcome",
          ].map((heading) => (
            <th
              key={heading}
              className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-500"
            >
              {heading}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100 bg-white">
        {scans.map((scan) => (
          <tr key={scan.id} className="transition hover:bg-gray-50">
            <td className="px-5 py-5 text-sm text-gray-600">{scan.timestamp}</td>
            <td className="px-5 py-5 font-semibold text-gray-900">
              {scan.person}
            </td>
            <td className="px-5 py-5 text-sm text-gray-600">{scan.unit}</td>
            <td className="px-5 py-5 font-mono text-sm text-gray-700">
              {scan.code}
            </td>
            <td className="px-5 py-5 text-sm text-gray-600">
              {scan.confirmedBy}
            </td>
            <td className="px-5 py-5">
              <OutcomePill outcome={scan.outcome} />
              <p className="mt-1 text-xs text-gray-400">{scan.note}</p>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const OutcomePill = ({ outcome }: { outcome: ScanRecord["outcome"] }) => (
  <span
    className={cx(
      "inline-flex rounded-md px-3 py-1 text-xs font-bold uppercase",
      outcomeStyles[outcome]
    )}
  >
    {outcome}
  </span>
);

const SecurityPersonnelPanel = ({
  team,
  onViewScans,
}: {
  team: SecurityPerson[];
  onViewScans: (person: SecurityPerson) => void;
}) => {
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(12);
  const totalPages = Math.max(1, Math.ceil(team.length / pageSize));
  const visibleRows = team.slice((page - 1) * pageSize, page * pageSize);

  React.useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  return (
    <section className="w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-5 py-4">
        <h2 className="font-semibold text-gray-900">Security Team</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50/80">
            <tr>
              {[
                "S/N",
                "Image",
                "Name",
                "Assigned Property",
                "Scans",
                "Last Scan Date",
                "",
              ].map((heading) => (
                <th
                  key={heading}
                  className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-500"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {visibleRows.map((person, index) => (
              <tr key={person.id} className="transition hover:bg-gray-50">
                <td className="px-5 py-4 text-sm font-semibold text-gray-600">
                  {String((page - 1) * pageSize + index + 1).padStart(2, "0")}
                </td>
                <td className="px-5 py-4">
                  <Avatar person={person} />
                </td>
                <td className="px-5 py-4">
                  <p className="font-semibold text-gray-900">{person.name}</p>
                  <p className="text-xs text-gray-500">{person.email}</p>
                </td>
                <td className="px-5 py-4">
                  <span className="inline-flex items-center gap-2 text-sm text-gray-600">
                    <Building2 className="h-4 w-4 text-gray-400" />
                    {person.assignedProperty}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span className="inline-flex items-center gap-2 text-sm text-gray-600">
                    <Clock3 className="h-4 w-4 text-gray-400" />
                    {person.scans} Scans
                  </span>
                </td>
                <td className="px-5 py-4 text-sm font-semibold text-gray-700">
                  {person.lastScanDate}
                </td>
                <td className="px-5 py-4 text-right">
                  <button
                    type="button"
                    onClick={() => onViewScans(person)}
                    className="inline-flex items-center gap-1 text-sm font-semibold text-brand-main transition hover:text-blue-700"
                  >
                    View Scans
                    <Eye className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col gap-3 border-t border-gray-100 px-5 py-4 text-sm text-gray-500 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span>Number of items displayed per page</span>
          <select
            value={pageSize}
            onChange={(event) => {
              setPageSize(Number(event.target.value));
              setPage(1);
            }}
            className="rounded-md border border-gray-200 px-2 py-1 text-sm text-gray-700"
          >
            <option value={6}>6</option>
            <option value={12}>12</option>
            <option value={20}>20</option>
          </select>
          <span>
            {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, team.length)}{" "}
            of {team.length} items
          </span>
        </div>
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </div>
    </section>
  );
};

const Avatar = ({ person }: { person: SecurityPerson }) =>
  person.avatarUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={person.avatarUrl}
      alt={person.name}
      className="h-9 w-9 rounded-full object-cover"
    />
  ) : (
    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600">
      {initials(person.name)}
    </div>
  );

const Pagination = ({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) => (
  <div className="flex items-center gap-2">
    <button
      type="button"
      onClick={() => onChange(Math.max(1, page - 1))}
      disabled={page === 1}
      className="rounded-md p-2 text-gray-500 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
      aria-label="Previous page"
    >
      <ChevronLeft className="h-4 w-4" />
    </button>
    {Array.from({ length: totalPages }, (_, index) => index + 1).map((number) => (
      <button
        key={number}
        type="button"
        onClick={() => onChange(number)}
        className={cx(
          "h-7 min-w-7 rounded-md px-2 text-sm font-semibold transition",
          number === page
            ? "bg-brand-main text-white"
            : "text-gray-500 hover:bg-gray-100"
        )}
      >
        {number}
      </button>
    ))}
    <button
      type="button"
      onClick={() => onChange(Math.min(totalPages, page + 1))}
      disabled={page === totalPages}
      className="rounded-md p-2 text-gray-500 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
      aria-label="Next page"
    >
      <ChevronRight className="h-4 w-4" />
    </button>
  </div>
);

const ModalShell = ({
  open,
  onClose,
  title,
  children,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "sm" | "md";
}) => (
  <AnimatePresence>
    {open ? (
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 px-4 py-8"
        onMouseDown={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          onMouseDown={(event) => event.stopPropagation()}
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 20 }}
          transition={{ duration: 0.16 }}
          className={cx(
            "max-h-[90vh] w-full overflow-y-auto rounded-lg bg-white shadow-2xl",
            size === "sm" ? "max-w-md" : "max-w-xl"
          )}
        >
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
            <h2 className="text-lg font-bold text-gray-900">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-gray-500 transition hover:bg-red-50 hover:text-red-500"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          {children}
        </motion.div>
      </motion.div>
    ) : null}
  </AnimatePresence>
);

const GenerateCodeModal = ({
  open,
  onClose,
  onGenerate,
  createdBy,
  unitLabel,
}: {
  open: boolean;
  onClose: () => void;
  onGenerate: (code: AccessCode) => void;
  createdBy: AccessCode["createdBy"];
  unitLabel: string;
}) => {
  const [type, setType] = React.useState<AccessCodeType>("visitor");
  const [recipient, setRecipient] = React.useState("");
  const [purpose, setPurpose] = React.useState("Guest");
  const [validity, setValidity] = React.useState("2 Days");
  const [maxUsage, setMaxUsage] = React.useState("1");

  React.useEffect(() => {
    if (!open) return;
    setType("visitor");
    setRecipient("");
    setPurpose("Guest");
    setValidity("2 Days");
    setMaxUsage("1");
  }, [open]);

  return (
    <ModalShell open={open} onClose={onClose} title="Generate Access Code">
      <div className="space-y-5 p-5">
        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-600">
            Code Type
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <ChoiceCard
              active={type === "visitor"}
              title="Temporary / Visitor"
              subtitle="Single or short-term use"
              onClick={() => setType("visitor")}
            />
            <ChoiceCard
              active={type === "resident"}
              title="Resident"
              subtitle="Standing or multi-use"
              onClick={() => setType("resident")}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <InputField
            label="Recipient Name"
            placeholder="e.g. John Doe"
            value={recipient}
            onChange={setRecipient}
          />
          <SelectField
            label="Purpose"
            value={purpose}
            onChange={setPurpose}
            options={["Guest", "Maintenance", "Delivery", "Family", "Resident"]}
          />
          <SelectField
            label="Validity Window"
            value={validity}
            onChange={setValidity}
            options={["Today", "2 Days", "7 Days", "30 Days", "90 Days"]}
          />
          <InputField
            label="Max Usage Count"
            placeholder="1"
            value={maxUsage}
            onChange={setMaxUsage}
          />
        </div>
      </div>
      <ModalActions
        onCancel={onClose}
        confirmLabel="Generate"
        onConfirm={() => {
          const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
          onGenerate({
            id: `code-${Date.now()}`,
            code: generatedCode,
            recipient: recipient.trim() || "New Visitor",
            note: purpose,
            unit: unitLabel,
            type,
            validity: type === "resident" ? "90 Days Left" : validity,
            usage: `0 / ${type === "resident" ? "∞" : maxUsage || "1"} Uses`,
            status: "active",
            createdBy,
          });
        }}
      />
    </ModalShell>
  );
};

const AddPersonnelModal = ({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (person: SecurityPerson) => void;
}) => {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [assignedProperty, setAssignedProperty] = React.useState("Lekki Haven");

  return (
    <ModalShell open={open} onClose={onClose} title="Add Security Personnel" size="sm">
      <div className="space-y-4 p-5">
        <button
          type="button"
          className="mx-auto flex h-24 w-24 flex-col items-center justify-center rounded-full border border-dashed border-gray-300 text-xs font-semibold uppercase text-gray-400 transition hover:border-brand-main hover:text-brand-main"
        >
          <ImagePlus className="mb-1 h-5 w-5" />
          Upload
        </button>
        <InputField
          label="Full Name"
          placeholder="e.g. John Smith"
          value={name}
          onChange={setName}
          icon={<User className="h-4 w-4" />}
        />
        <InputField
          label="Email Address"
          placeholder="john@dwella.com"
          value={email}
          onChange={setEmail}
          icon={<Mail className="h-4 w-4" />}
        />
        <InputField
          label="Temporary Password"
          placeholder="••••••••"
          value=""
          onChange={() => undefined}
          icon={<Lock className="h-4 w-4" />}
          type="password"
          helper="They will be prompted to change this on first login."
        />
        <SelectField
          label="Assign to Building"
          value={assignedProperty}
          onChange={setAssignedProperty}
          options={["Lekki Haven", "Apt 1C, Lekki Haven", "Apt 4B, Lekki Haven"]}
          icon={<Building2 className="h-4 w-4" />}
        />
      </div>
      <ModalActions
        onCancel={onClose}
        confirmLabel="Confirm"
        onConfirm={() =>
          onConfirm({
            id: `security-${Date.now()}`,
            name: name.trim() || "New Security Personnel",
            email: email.trim() || "security@dwella.com",
            assignedProperty,
            scans: 0,
            lastScanDate: "—",
          })
        }
      />
    </ModalShell>
  );
};

const ScanHistoryModal = ({
  person,
  onClose,
}: {
  person: SecurityPerson | null;
  onClose: () => void;
}) => (
  <ModalShell
    open={Boolean(person)}
    onClose={onClose}
    title="View Scans"
    size="sm"
  >
    {person ? (
      <div className="p-5">
        <div className="flex flex-col items-center">
          <Avatar person={person} />
          <p className="mt-2 text-sm font-bold text-gray-900">{person.name}</p>
        </div>
        <div className="mt-6 rounded-lg border border-gray-200 p-4">
          <div className="mb-4">
            <h3 className="flex items-center gap-2 font-bold text-gray-900">
              <FileIcon />
              Recent Approval History
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Latest gate scans by {person.name}
            </p>
          </div>
          <div className="space-y-3">
            {scanHistory.map((scan) => (
              <div
                key={scan.id}
                className="rounded-lg border border-gray-100 p-3 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-gray-900">
                      {scan.confirmedBy}
                    </p>
                    <p className="mt-1 text-sm text-gray-600">
                      Scanned <strong>{scan.person}</strong> for {scan.unit}
                    </p>
                  </div>
                  <OutcomePill outcome={scan.outcome} />
                </div>
                <p className="mt-2 text-xs text-gray-400">{scan.timestamp}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    ) : null}
  </ModalShell>
);

const FileIcon = () => (
  <svg
    viewBox="0 0 20 20"
    aria-hidden="true"
    className="h-4 w-4 text-gray-400"
    fill="none"
  >
    <path
      d="M5 3.5h6.2L15 7.3v9.2H5v-13Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <path d="M11 3.5v4h4" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

const ChoiceCard = ({
  active,
  title,
  subtitle,
  onClick,
}: {
  active: boolean;
  title: string;
  subtitle: string;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={cx(
      "rounded-lg border p-4 text-left transition hover:-translate-y-0.5",
      active
        ? "border-brand-main bg-blue-50 text-brand-main"
        : "border-gray-200 text-gray-700 hover:border-gray-300"
    )}
  >
    <p className="font-semibold">{title}</p>
    <p className="mt-1 text-xs text-gray-500">{subtitle}</p>
  </button>
);

const InputField = ({
  label,
  placeholder,
  value,
  onChange,
  icon,
  helper,
  type = "text",
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  icon?: React.ReactNode;
  helper?: string;
  type?: string;
}) => (
  <label className="block">
    <span className="mb-2 block text-sm font-semibold text-gray-600">
      {label}
    </span>
    <span className="relative block">
      {icon ? (
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          {icon}
        </span>
      ) : null}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={cx(
          "w-full rounded-lg border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-brand-main focus:ring-2 focus:ring-brand-main/20",
          icon ? "pl-10" : ""
        )}
      />
    </span>
    {helper ? <span className="mt-1 block text-xs text-gray-500">{helper}</span> : null}
  </label>
);

const SelectField = ({
  label,
  value,
  onChange,
  options,
  icon,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  icon?: React.ReactNode;
}) => (
  <label className="block">
    <span className="mb-2 block text-sm font-semibold text-gray-600">
      {label}
    </span>
    <span className="group relative block">
      {icon ? (
        <span className="pointer-events-none absolute left-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md bg-gray-50 text-gray-400 transition group-focus-within:bg-brand-main/10 group-focus-within:text-brand-main">
          {icon}
        </span>
      ) : null}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cx(
          "w-full appearance-none rounded-lg border border-gray-200 bg-white py-3 text-sm font-medium text-gray-900 outline-none transition hover:border-gray-300 focus:border-brand-main focus:ring-2 focus:ring-brand-main/20",
          icon ? "pl-14" : "pl-4",
          "pr-11"
        )}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 transition group-focus-within:text-brand-main" />
    </span>
  </label>
);

const ModalActions = ({
  onCancel,
  onConfirm,
  confirmLabel,
}: {
  onCancel: () => void;
  onConfirm: () => void;
  confirmLabel: string;
}) => (
  <div className="flex justify-end gap-3 border-t border-gray-200 bg-gray-50 px-5 py-4">
    <button
      type="button"
      onClick={onCancel}
      className="rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
    >
      Cancel
    </button>
    <button
      type="button"
      onClick={onConfirm}
      className="rounded-lg bg-gray-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
    >
      {confirmLabel}
    </button>
  </div>
);

AccessSecurityPage.getLayout = (page) => (
  <DashboardLayout>{page}</DashboardLayout>
);

export default AccessSecurityPage;
