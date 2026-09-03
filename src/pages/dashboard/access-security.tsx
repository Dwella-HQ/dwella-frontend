import * as React from "react";
import Head from "next/head";
import Link from "next/link";
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
  KeyRound,
  Loader2,
  Lock,
  MoreVertical,
  Plus,
  Shield,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DataUnavailableBanner } from "@/components/DataUnavailableBanner";
import { PhoneInputWithCountry } from "@/components/PhoneInputWithCountry";
import { useToast } from "@/components/Toast";
import { useUser } from "@/contexts/UserContext";
import { getPropertiesByLandlord } from "@/api/properties";
import { getUnitsByProperty } from "@/api/units";
import { getTenantByUser } from "@/api/tenants";
import {
  generateAccessCode,
  getAccessCodeLogs,
  getAccessCodes,
  listSecurityPersonnel,
  registerSecurityPersonnel,
  removeSecurityPersonnel,
  type AccessCodeLog,
  type AccessCodeRecord,
  type SecurityPersonnel,
} from "@/api/security";
import {
  forgetSecurityAssignment,
  rememberSecurityAssignment,
} from "@/lib/securitySession";
import {
  isValidInternationalPhoneNumber,
  normalizePhoneNumberForApi,
} from "@/utils/phoneNumber";
import type { NextPageWithLayout } from "../_app";

type AccessCodeType = "visitor" | "resident";
type AccessCodeStatus = "active" | "used" | "revoked";
type AccessCodeTab = "all" | "resident" | "visitor" | "audit";
type AccessView = "full" | "simple";

type PropertyOption = { id: string; name: string };
type UnitOption = { id: string; name: string };

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

const outcomeStyles: Record<AccessCodeLog["outcome"], string> = {
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

const isSameDay = (iso: string, date = new Date()) => {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return false;
  return (
    parsed.getFullYear() === date.getFullYear() &&
    parsed.getMonth() === date.getMonth() &&
    parsed.getDate() === date.getDate()
  );
};

const formatLogTime = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const AccessSecurityPage: NextPageWithLayout = () => {
  const { user } = useUser();
  const { showToast } = useToast();
  const isSimpleView =
    user?.role === "tenant" || user?.role === "property_manager";
  const view: AccessView = isSimpleView ? "simple" : "full";

  const [section, setSection] = React.useState<"codes" | "personnel">("codes");
  const [activeCodeTab, setActiveCodeTab] = React.useState<AccessCodeTab>("all");
  const [codes, setCodes] = React.useState<AccessCodeRecord[]>([]);
  const [logs, setLogs] = React.useState<AccessCodeLog[]>([]);
  const [securityTeam, setSecurityTeam] = React.useState<SecurityPersonnel[]>(
    [],
  );
  const [properties, setProperties] = React.useState<PropertyOption[]>([]);
  const [units, setUnits] = React.useState<UnitOption[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = React.useState("");
  const [tenantUnit, setTenantUnit] = React.useState<UnitOption | null>(null);
  const [showCodeModal, setShowCodeModal] = React.useState(false);
  const [showPersonnelModal, setShowPersonnelModal] = React.useState(false);
  const [selectedSecurity, setSelectedSecurity] =
    React.useState<SecurityPersonnel | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const skipPropertyReload = React.useRef(false);

  const selectedProperty = properties.find(
    (property) => property.id === selectedPropertyId,
  );

  const loadPropertyData = React.useCallback(
    async (propertyId: string, propertyName: string, unitId?: string) => {
      const [codesResult, logsResult, personnelResult] = await Promise.all([
        getAccessCodes(propertyId),
        getAccessCodeLogs(propertyId),
        view === "full"
          ? listSecurityPersonnel(propertyId, propertyName)
          : Promise.resolve({ success: true as const, data: [] }),
      ]);

      if (codesResult.success) {
        const nextCodes = unitId
          ? codesResult.data.filter(
              (code) => !code.unitId || code.unitId === unitId,
            )
          : codesResult.data;
        setCodes(nextCodes);
      } else {
        setCodes([]);
      }

      if (logsResult.success) {
        setLogs(logsResult.data);
      } else {
        setLogs([]);
      }

      if (personnelResult.success) {
        setSecurityTeam(personnelResult.data);
        personnelResult.data.forEach((person) => {
          if (!person.phoneNumber) return;
          rememberSecurityAssignment(person.phoneNumber, {
            id: propertyId,
            name: propertyName,
          });
        });
      } else if (view === "full") {
        setSecurityTeam([]);
      }
    },
    [view],
  );

  React.useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      setIsLoading(true);
      setLoadError(null);

      if (user?.role === "tenant") {
        if (!user.id) {
          setLoadError("Your tenant profile is not available yet.");
          setIsLoading(false);
          return;
        }
        const tenant = await getTenantByUser(String(user.id));
        if (cancelled) return;
        if (!tenant.success || !tenant.data.currentUnit?.id) {
          setLoadError(
            "No unit is assigned to this account, so access codes cannot be generated yet.",
          );
          setIsLoading(false);
          return;
        }
        const unit = tenant.data.currentUnit;
        const propertyId = unit.property?.id;
        if (!propertyId) {
          setLoadError("This unit is not linked to a property.");
          setIsLoading(false);
          return;
        }
        const propertyName = unit.property?.name?.trim() || "Your property";
        setTenantUnit({ id: unit.id, name: unit.name });
        setProperties([{ id: propertyId, name: propertyName }]);
        setSelectedPropertyId(propertyId);
        setUnits([{ id: unit.id, name: unit.name }]);
        await loadPropertyData(propertyId, propertyName, unit.id);
        if (!cancelled) setIsLoading(false);
        return;
      }

      const landlordId =
        typeof window !== "undefined"
          ? localStorage.getItem("landlordId")
          : null;
      if (!landlordId) {
        setLoadError("Select a landlord account to manage access codes.");
        setIsLoading(false);
        return;
      }

      const propertiesResult = await getPropertiesByLandlord(landlordId);
      if (cancelled) return;
      if (!propertiesResult.success) {
        setLoadError(
          propertiesResult.error || "Could not load properties.",
        );
        setIsLoading(false);
        return;
      }

      const nextProperties = propertiesResult.data.map((property) => ({
        id: property.id,
        name: property.name,
      }));
      setProperties(nextProperties);
      const firstId = nextProperties[0]?.id ?? "";
      setSelectedPropertyId(firstId);
      if (!firstId) {
        setLoadError("Add a property before generating access codes.");
        setIsLoading(false);
        return;
      }

      skipPropertyReload.current = true;
      const unitsResult = await getUnitsByProperty(firstId);
      if (cancelled) return;
      setUnits(
        unitsResult.success
          ? unitsResult.data.map((unit) => ({
              id: unit.id,
              name: unit.name,
            }))
          : [],
      );
      await loadPropertyData(firstId, nextProperties[0]?.name || "Property");
      if (!cancelled) setIsLoading(false);
    };

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [loadPropertyData, user?.id, user?.role]);

  React.useEffect(() => {
    if (!selectedPropertyId || user?.role === "tenant") return;
    if (skipPropertyReload.current) {
      skipPropertyReload.current = false;
      return;
    }
    let cancelled = false;
    const refresh = async () => {
      setIsLoading(true);
      const unitsResult = await getUnitsByProperty(selectedPropertyId);
      if (cancelled) return;
      setUnits(
        unitsResult.success
          ? unitsResult.data.map((unit) => ({ id: unit.id, name: unit.name }))
          : [],
      );
      await loadPropertyData(
        selectedPropertyId,
        selectedProperty?.name || "Property",
      );
      if (!cancelled) setIsLoading(false);
    };
    void refresh();
    return () => {
      cancelled = true;
    };
  }, [
    loadPropertyData,
    selectedProperty?.name,
    selectedPropertyId,
    user?.role,
  ]);

  const visibleCodes = codes;
  const activeCodes = visibleCodes.filter((code) => code.status === "active")
    .length;
  const usedCodes = visibleCodes.filter((code) => code.status === "used").length;
  const revokedCodes = visibleCodes.filter(
    (code) => code.status === "revoked",
  ).length;
  const todaysGranted = logs.filter(
    (log) => log.outcome === "granted" && isSameDay(log.timestamp),
  ).length;
  const todaysDenied = logs.filter(
    (log) => log.outcome === "denied" && isSameDay(log.timestamp),
  ).length;

  const generateUnitId =
    user?.role === "tenant" ? tenantUnit?.id : units[0]?.id;
  const canCreateCode = Boolean(generateUnitId || units.length > 0);
  const canAddPersonnel = Boolean(selectedPropertyId);

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

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              {view === "full" || user?.role === "property_manager" ? (
                properties.length > 1 ? (
                  <select
                    value={selectedPropertyId}
                    onChange={(event) =>
                      setSelectedPropertyId(event.target.value)
                    }
                    className="h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 focus:border-brand-main focus:outline-none focus:ring-2 focus:ring-brand-main"
                  >
                    {properties.map((property) => (
                      <option key={property.id} value={property.id}>
                        {property.name}
                      </option>
                    ))}
                  </select>
                ) : null
              ) : null}
              <Link
                href="/security"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-800 shadow-sm transition hover:border-brand-main hover:text-brand-main"
              >
                <Shield className="h-4 w-4" />
                Open gate app
              </Link>
              <button
                type="button"
                disabled={
                  isLoading ||
                  (view === "simple" || section === "codes"
                    ? !canCreateCode
                    : !canAddPersonnel)
                }
                onClick={() =>
                  view === "simple" || section === "codes"
                    ? setShowCodeModal(true)
                    : setShowPersonnelModal(true)
                }
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Plus className="h-4 w-4" />
                {view === "simple" || section === "codes"
                  ? "Create Access Code"
                  : "Add Personnel"}
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20 text-gray-500">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading access data…
            </div>
          ) : loadError ? (
            <DataUnavailableBanner
              title="Access data unavailable"
              description={loadError}
            />
          ) : (
            <>
              {view === "full" ? (
                <div className="inline-flex w-fit rounded-lg bg-gray-100 p-1">
                  <button
                    type="button"
                    onClick={() => setSection("codes")}
                    className={cx(
                      "inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition",
                      section === "codes"
                        ? "bg-white text-gray-950 shadow-sm"
                        : "text-gray-500 hover:text-gray-900",
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
                        : "text-gray-500 hover:text-gray-900",
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
                            value={todaysGranted}
                            tone="green"
                          />
                          <StatCard
                            icon={<XCircle className="h-6 w-6" />}
                            label="Denied Access Flag"
                            value={todaysDenied}
                            tone="orange"
                            caption="Last 24h"
                          />
                        </>
                      )}
                    </div>

                    <AccessCodesPanel
                      codes={visibleCodes}
                      logs={logs}
                      activeTab={activeCodeTab}
                      onTabChange={setActiveCodeTab}
                      compact={view === "simple"}
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
                      logs={logs}
                      onViewScans={setSelectedSecurity}
                      onRemove={async (person) => {
                        if (!selectedPropertyId) return;
                        const result = await removeSecurityPersonnel(
                          selectedPropertyId,
                          person.id,
                        );
                        if (!result.success) {
                          showToast(
                            result.error || "Could not remove personnel.",
                            "error",
                          );
                          return;
                        }
                        setSecurityTeam((current) =>
                          current.filter((item) => item.id !== person.id),
                        );
                        if (person.phoneNumber) {
                          forgetSecurityAssignment(
                            person.phoneNumber,
                            selectedPropertyId,
                          );
                        }
                        showToast("Security personnel removed.", "success");
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </div>
      </div>

      <GenerateCodeModal
        open={showCodeModal}
        units={
          user?.role === "tenant" && tenantUnit ? [tenantUnit] : units
        }
        lockUnit={user?.role === "tenant"}
        onClose={() => setShowCodeModal(false)}
        onGenerate={async (name, unitId) => {
          const result = await generateAccessCode(unitId, name);
          if (!result.success) {
            showToast(result.error || "Could not generate code.", "error");
            return false;
          }
          setCodes((current) => [result.data, ...current]);
          setActiveCodeTab("all");
          setShowCodeModal(false);
          showToast(
            result.data.code && result.data.code !== "------"
              ? `Access code ${result.data.code} created.`
              : "Access code created.",
            "success",
          );
          return true;
        }}
      />
      {view === "full" ? (
        <>
          <AddPersonnelModal
            open={showPersonnelModal}
            properties={properties}
            defaultPropertyId={selectedPropertyId}
            onClose={() => setShowPersonnelModal(false)}
            onConfirm={async (values) => {
              const result = await registerSecurityPersonnel(
                values.propertyId,
                {
                  phoneNumber: values.phoneNumber,
                  password: values.password,
                },
              );
              if (!result.success) {
                showToast(
                  result.error || "Could not add security personnel.",
                  "error",
                );
                return false;
              }
              const assigned =
                properties.find((property) => property.id === values.propertyId)
                  ?.name ?? result.data.assignedProperty;
              rememberSecurityAssignment(values.phoneNumber, {
                id: values.propertyId,
                name: assigned,
              });
              const created = {
                ...result.data,
                assignedProperty: assigned,
              };
              if (values.propertyId === selectedPropertyId) {
                setSecurityTeam((current) => [created, ...current]);
              }
              setShowPersonnelModal(false);
              showToast("Security personnel added.", "success");
              if (values.propertyId === selectedPropertyId) {
                void listSecurityPersonnel(
                  values.propertyId,
                  assigned,
                ).then((listed) => {
                  if (listed.success) setSecurityTeam(listed.data);
                });
              }
              return true;
            }}
          />
          <ScanHistoryModal
            person={selectedSecurity}
            logs={logs.filter((log) => {
              if (!selectedSecurity) return false;
              return (
                log.securityId === selectedSecurity.id ||
                log.confirmedBy.toLowerCase() ===
                  selectedSecurity.name.toLowerCase()
              );
            })}
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
        tones[tone],
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
  logs,
  activeTab,
  onTabChange,
  compact = false,
}: {
  codes: AccessCodeRecord[];
  logs: AccessCodeLog[];
  activeTab: AccessCodeTab;
  onTabChange: (tab: AccessCodeTab) => void;
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
                  : "border-transparent text-gray-500 hover:text-gray-900",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {!compact && activeTab === "audit" ? (
        <AuditLogTable scans={logs} />
      ) : (
        <CodesTable codes={filteredCodes} compact={compact} />
      )}
    </section>
  );
};

const CodesTable = ({
  codes,
  compact = false,
}: {
  codes: AccessCodeRecord[];
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
            ))}
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
                  <p className="font-semibold text-gray-900">{code.name}</p>
                  {compact ? null : (
                    <span className="mt-1 inline-block rounded bg-gray-100 px-2 py-1 text-xs text-gray-500">
                      Created by: {code.createdBy}
                    </span>
                  )}
                </td>
                {compact ? null : (
                  <td className="px-5 py-4 text-sm text-gray-600">
                    {code.unitLabel}
                  </td>
                )}
                <td className="px-5 py-4">
                  <span
                    className={cx(
                      "rounded-md px-3 py-1 text-xs font-semibold uppercase",
                      typeStyles[code.type],
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
                  <CodeActions code={code.code} />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

const CodeActions = ({ code }: { code: string }) => {
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
              void navigator.clipboard?.writeText(code);
              setOpen(false);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-50"
          >
            <Copy className="h-4 w-4" />
            Copy code
          </button>
        </div>
      ) : null}
    </div>
  );
};

const StatusPill = ({ status }: { status: AccessCodeStatus }) => (
  <span
    className={cx(
      "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase",
      statusStyles[status],
    )}
  >
    <span
      className={cx(
        "h-1.5 w-1.5 rounded-full",
        status === "active"
          ? "bg-green-500"
          : status === "used"
            ? "bg-orange-500"
            : "bg-red-500",
      )}
    />
    {status}
  </span>
);

const AuditLogTable = ({ scans }: { scans: AccessCodeLog[] }) => (
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
        {scans.length === 0 ? (
          <tr>
            <td
              colSpan={6}
              className="px-5 py-12 text-center text-sm text-gray-500"
            >
              No gate scans recorded yet.
            </td>
          </tr>
        ) : (
          scans.map((scan) => (
            <tr key={scan.id} className="transition hover:bg-gray-50">
              <td className="px-5 py-5 text-sm text-gray-600">
                {formatLogTime(scan.timestamp)}
              </td>
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
                {scan.note ? (
                  <p className="mt-1 text-xs text-gray-400">{scan.note}</p>
                ) : null}
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);

const OutcomePill = ({ outcome }: { outcome: AccessCodeLog["outcome"] }) => (
  <span
    className={cx(
      "inline-flex rounded-md px-3 py-1 text-xs font-bold uppercase",
      outcomeStyles[outcome],
    )}
  >
    {outcome}
  </span>
);

const SecurityPersonnelPanel = ({
  team,
  logs,
  onViewScans,
  onRemove,
}: {
  team: SecurityPersonnel[];
  logs: AccessCodeLog[];
  onViewScans: (person: SecurityPersonnel) => void;
  onRemove: (person: SecurityPersonnel) => Promise<void>;
}) => {
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(12);
  const [removingId, setRemovingId] = React.useState<string | null>(null);
  const totalPages = Math.max(1, Math.ceil(team.length / pageSize));
  const visibleRows = team.slice((page - 1) * pageSize, page * pageSize);

  React.useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const statsFor = (person: SecurityPersonnel) => {
    const matches = logs.filter(
      (log) =>
        log.securityId === person.id ||
        log.confirmedBy.toLowerCase() === person.name.toLowerCase(),
    );
    const last = matches[0]?.timestamp;
    return {
      scans: matches.length,
      lastScanDate: last ? formatLogTime(last) : "—",
    };
  };

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
            {visibleRows.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-5 py-12 text-center text-sm text-gray-500"
                >
                  No security personnel assigned to this property yet.
                </td>
              </tr>
            ) : (
              visibleRows.map((person, index) => {
                const stats = statsFor(person);
                return (
                  <tr key={person.id} className="transition hover:bg-gray-50">
                    <td className="px-5 py-4 text-sm font-semibold text-gray-600">
                      {String((page - 1) * pageSize + index + 1).padStart(2, "0")}
                    </td>
                    <td className="px-5 py-4">
                      <Avatar person={person} />
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-900">{person.name}</p>
                      <p className="text-xs text-gray-500">
                        {person.phoneNumber || person.email || "—"}
                      </p>
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
                        {stats.scans} Scans
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-gray-700">
                      {stats.lastScanDate}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => onViewScans(person)}
                          className="inline-flex items-center gap-1 text-sm font-semibold text-brand-main transition hover:text-blue-700"
                        >
                          View Scans
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={removingId === person.id}
                          onClick={async () => {
                            setRemovingId(person.id);
                            try {
                              await onRemove(person);
                            } finally {
                              setRemovingId(null);
                            }
                          }}
                          className="inline-flex items-center gap-1 text-sm font-semibold text-red-600 transition hover:text-red-700 disabled:opacity-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
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
            {team.length === 0
              ? "0 of 0 items"
              : `${(page - 1) * pageSize + 1}-${Math.min(page * pageSize, team.length)} of ${team.length} items`}
          </span>
        </div>
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </div>
    </section>
  );
};

const Avatar = ({ person }: { person: SecurityPersonnel }) =>
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
            : "text-gray-500 hover:bg-gray-100",
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
            size === "sm" ? "max-w-md" : "max-w-xl",
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
  units,
  lockUnit,
  onClose,
  onGenerate,
}: {
  open: boolean;
  units: UnitOption[];
  lockUnit: boolean;
  onClose: () => void;
  onGenerate: (name: string, unitId: string) => Promise<boolean>;
}) => {
  const [recipient, setRecipient] = React.useState("");
  const [unitId, setUnitId] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setRecipient("");
    setUnitId(units[0]?.id ?? "");
  }, [open, units]);

  return (
    <ModalShell open={open} onClose={onClose} title="Generate Access Code">
      <div className="space-y-5 p-5">
        <InputField
          label="Recipient Name"
          placeholder="e.g. John Doe"
          value={recipient}
          onChange={setRecipient}
        />
        <SelectField
          label="Unit"
          value={unitId}
          onChange={setUnitId}
          disabled={lockUnit || units.length <= 1}
          options={units.map((unit) => ({ value: unit.id, label: unit.name }))}
        />
        {units.length === 0 ? (
          <p className="text-sm text-red-600">
            Add a unit to this property before generating a code.
          </p>
        ) : null}
      </div>
      <ModalActions
        onCancel={onClose}
        confirmLabel={isSaving ? "Generating…" : "Generate"}
        disabled={isSaving || !recipient.trim() || !unitId}
        onConfirm={async () => {
          setIsSaving(true);
          try {
            await onGenerate(recipient.trim(), unitId);
          } finally {
            setIsSaving(false);
          }
        }}
      />
    </ModalShell>
  );
};

const AddPersonnelModal = ({
  open,
  properties,
  defaultPropertyId,
  onClose,
  onConfirm,
}: {
  open: boolean;
  properties: PropertyOption[];
  defaultPropertyId: string;
  onClose: () => void;
  onConfirm: (values: {
    phoneNumber: string;
    password: string;
    propertyId: string;
  }) => Promise<boolean>;
}) => {
  const [phoneNumber, setPhoneNumber] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [propertyId, setPropertyId] = React.useState(defaultPropertyId);
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setPhoneNumber("");
    setPassword("");
    setPropertyId(defaultPropertyId || properties[0]?.id || "");
  }, [defaultPropertyId, open, properties]);

  return (
    <ModalShell open={open} onClose={onClose} title="Add Security Personnel" size="sm">
      <div className="space-y-4 p-5">
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-gray-600">
            Phone Number
          </span>
          <PhoneInputWithCountry
            id="security-personnel-phone"
            value={phoneNumber || undefined}
            onChange={(value) => setPhoneNumber(value ?? "")}
            placeholder="801 234 5678"
            aria-invalid={
              Boolean(phoneNumber) &&
              !isValidInternationalPhoneNumber(phoneNumber)
            }
          />
        </label>
        <InputField
          label="Temporary Password"
          placeholder="••••••••"
          value={password}
          onChange={setPassword}
          icon={<Lock className="h-4 w-4" />}
          type="password"
          helper="They will use this phone number and password to sign in at the gate."
        />
        <SelectField
          label="Assign to Building"
          value={propertyId}
          onChange={setPropertyId}
          options={properties.map((property) => ({
            value: property.id,
            label: property.name,
          }))}
          icon={<Building2 className="h-4 w-4" />}
        />
      </div>
      <ModalActions
        onCancel={onClose}
        confirmLabel={isSaving ? "Saving…" : "Confirm"}
        disabled={
          isSaving ||
          !isValidInternationalPhoneNumber(phoneNumber) ||
          password.length < 6 ||
          !propertyId
        }
        onConfirm={async () => {
          setIsSaving(true);
          try {
            await onConfirm({
              phoneNumber: normalizePhoneNumberForApi(phoneNumber),
              password,
              propertyId,
            });
          } finally {
            setIsSaving(false);
          }
        }}
      />
    </ModalShell>
  );
};

const ScanHistoryModal = ({
  person,
  logs,
  onClose,
}: {
  person: SecurityPersonnel | null;
  logs: AccessCodeLog[];
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
              Recent Approval History
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Latest gate scans by {person.name}
            </p>
          </div>
          <div className="space-y-3">
            {logs.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-500">
                No scans recorded for this officer yet.
              </p>
            ) : (
              logs.map((scan) => (
                <div
                  key={scan.id}
                  className="rounded-lg border border-gray-100 p-3 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-gray-900">
                        {scan.person}
                      </p>
                      <p className="mt-1 text-sm text-gray-600">
                        Scanned for {scan.unit}
                      </p>
                    </div>
                    <OutcomePill outcome={scan.outcome} />
                  </div>
                  <p className="mt-2 text-xs text-gray-400">
                    {formatLogTime(scan.timestamp)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    ) : null}
  </ModalShell>
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
          icon ? "pl-10" : "",
        )}
      />
    </span>
    {helper ? (
      <span className="mt-1 block text-xs text-gray-500">{helper}</span>
    ) : null}
  </label>
);

const SelectField = ({
  label,
  value,
  onChange,
  options,
  icon,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  icon?: React.ReactNode;
  disabled?: boolean;
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
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className={cx(
          "w-full appearance-none rounded-lg border border-gray-200 bg-white py-3 text-sm font-medium text-gray-900 outline-none transition hover:border-gray-300 focus:border-brand-main focus:ring-2 focus:ring-brand-main/20 disabled:bg-gray-50",
          icon ? "pl-14" : "pl-4",
          "pr-11",
        )}
      >
        {options.length === 0 ? (
          <option value="">No options</option>
        ) : (
          options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))
        )}
      </select>
      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 transition group-focus-within:text-brand-main" />
    </span>
  </label>
);

const ModalActions = ({
  onCancel,
  onConfirm,
  confirmLabel,
  disabled,
}: {
  onCancel: () => void;
  onConfirm: () => void;
  confirmLabel: string;
  disabled?: boolean;
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
      disabled={disabled}
      onClick={onConfirm}
      className="rounded-lg bg-gray-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {confirmLabel}
    </button>
  </div>
);

AccessSecurityPage.getLayout = (page) => (
  <DashboardLayout>{page}</DashboardLayout>
);

export default AccessSecurityPage;
