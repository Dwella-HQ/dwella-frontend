import * as React from "react";
import { Check, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import {
  SecurityLayout,
  useSecuritySession,
} from "@/components/security/SecurityLayout";
import {
  SecurityVerifyModal,
  type SecurityVerifyResult,
} from "@/components/security/SecurityVerifyModal";
import { useToast } from "@/components/Toast";
import { getAccessCodeLogs, useAccessCode } from "@/api/security";
import {
  formatSecurityTimestamp,
  logFromAccessRecord,
  normalizeSecurityCode,
  type SecurityAccessLog,
} from "@/lib/securitySession";
import type { NextPageWithLayout } from "../_app";

const CODE_LENGTH = 6;

const SecurityHomeInner = () => {
  const { session, setSelectedPropertyId, logout } = useSecuritySession();
  const { showToast } = useToast();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [code, setCode] = React.useState("");
  const [isVerifying, setIsVerifying] = React.useState(false);
  const [result, setResult] = React.useState<SecurityVerifyResult | null>(null);
  const [recent, setRecent] = React.useState<SecurityAccessLog[]>([]);

  const propertyId = session.selectedPropertyId;
  const properties = session.properties;

  const loadRecent = React.useCallback(async () => {
    if (!propertyId) {
      setRecent([]);
      return;
    }
    const logs = await getAccessCodeLogs(propertyId, { token: session.token });
    if (!logs.success) {
      setRecent([]);
      return;
    }
    setRecent(
      logs.data.slice(0, 5).map((log) =>
        logFromAccessRecord({
          id: log.id,
          person: log.person,
          unit: log.unit,
          timestamp: log.timestamp,
          code: log.code,
          outcome: log.outcome,
        }),
      ),
    );
  }, [propertyId, session.token]);

  React.useEffect(() => {
    void loadRecent();
    inputRef.current?.focus();
  }, [loadRecent]);

  const handleCodeChange = (value: string) => {
    setCode(normalizeSecurityCode(value));
  };

  const handleVerify = React.useCallback(async () => {
    const normalized = normalizeSecurityCode(code);
    if (normalized.length !== CODE_LENGTH) {
      showToast("Enter a 6-character access code.", "error");
      return;
    }
    if (!propertyId) {
      showToast("No property is assigned to this account.", "error");
      return;
    }

    setIsVerifying(true);
    try {
      const used = await useAccessCode(propertyId, normalized, {
        token: session.token,
      });
      if (!used.success) {
        if (used.statusCode === 401) {
          showToast("Your session expired. Please sign in again.", "error");
          logout();
          return;
        }
        setResult({ kind: "invalid", code: normalized });
        return;
      }
      setResult({
        kind: "valid",
        lookup: {
          code: used.data.code || normalized,
          name: used.data.name,
          role: used.data.type === "resident" ? "Resident" : "Visitor",
          location: used.data.unitLabel,
        },
        code: used.data.code || normalized,
        timestamp: used.data.createdAt ?? new Date().toISOString(),
      });
      void loadRecent();
    } finally {
      setIsVerifying(false);
    }
  }, [code, loadRecent, logout, propertyId, session.token, showToast]);

  const closeResult = React.useCallback(() => {
    setResult(null);
    setCode("");
    void loadRecent();
    inputRef.current?.focus();
  }, [loadRecent]);

  return (
    <>
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,28rem)_minmax(0,1fr)] lg:gap-10">
        <div className="rounded-2xl bg-white lg:border lg:border-gray-200 lg:p-10 lg:shadow-sm">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Verify Gate Access Code
            </h1>
            <p className="mt-2 text-sm text-gray-500">Dwelliva Access Control.</p>
          </div>

          {properties.length > 1 ? (
            <label className="mt-6 block text-left text-sm">
              <span className="mb-1.5 block font-medium text-gray-700">
                Property
              </span>
              <select
                value={propertyId ?? ""}
                onChange={(event) => setSelectedPropertyId(event.target.value)}
                className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 focus:border-brand-main focus:outline-none focus:ring-2 focus:ring-brand-main"
              >
                {properties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.name}
                  </option>
                ))}
              </select>
            </label>
          ) : properties.length === 1 ? (
            <p className="mt-4 text-sm text-gray-500">{properties[0].name}</p>
          ) : null}

          {!propertyId ? (
            <p className="mt-8 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
              This account is not assigned to a property yet. Ask the landlord
              to register you on a building.
            </p>
          ) : (
            <form
              className="mt-10"
              onSubmit={(event) => {
                event.preventDefault();
                void handleVerify();
              }}
            >
              <label
                htmlFor="access-code"
                className="mb-4 block text-center text-sm font-medium text-gray-800"
              >
                Enter Access Code
              </label>

              <div className="relative mx-auto w-full max-w-sm">
                <div
                  className="pointer-events-none flex items-end justify-between gap-2 px-1"
                  aria-hidden="true"
                >
                  {Array.from({ length: CODE_LENGTH }).map((_, index) => (
                    <span
                      key={index}
                      className={`flex h-12 w-10 items-center justify-center border-b-2 border-dashed text-2xl font-semibold tracking-wide sm:h-14 sm:w-12 ${
                        code[index]
                          ? "border-gray-900 text-gray-900"
                          : "border-gray-300 text-gray-300"
                      }`}
                    >
                      {code[index] ?? ""}
                    </span>
                  ))}
                </div>
                <input
                  ref={inputRef}
                  id="access-code"
                  type="text"
                  inputMode="text"
                  autoComplete="one-time-code"
                  autoCapitalize="characters"
                  spellCheck={false}
                  maxLength={CODE_LENGTH}
                  value={code}
                  onChange={(event) => handleCodeChange(event.target.value)}
                  className="absolute inset-0 cursor-text opacity-0"
                  aria-label="Access code"
                />
              </div>

              <motion.button
                type="submit"
                disabled={isVerifying || code.length !== CODE_LENGTH}
                whileHover={{
                  scale: isVerifying || code.length !== CODE_LENGTH ? 1 : 1.01,
                }}
                whileTap={{
                  scale: isVerifying || code.length !== CODE_LENGTH ? 1 : 0.99,
                }}
                className="mt-10 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-gray-900 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isVerifying ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Check className="h-5 w-5" strokeWidth={2.5} />
                )}
                Verify
              </motion.button>
            </form>
          )}
        </div>

        <aside className="hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:block">
          <h2 className="text-lg font-semibold text-gray-900">
            Recent at this gate
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Latest scans for the selected property.
          </p>
          <ul className="mt-5 divide-y divide-gray-100">
            {recent.length === 0 ? (
              <li className="py-8 text-center text-sm text-gray-500">
                No scans yet.
              </li>
            ) : (
              recent.map((log) => (
                <li key={log.id} className="flex items-start justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-gray-900">
                      {log.name}
                    </p>
                    <p className="truncate text-xs text-gray-500">
                      {log.code} · {formatSecurityTimestamp(log.timestamp)}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                      log.status === "granted"
                        ? "bg-emerald-600 text-white"
                        : "bg-red-50 text-red-600"
                    }`}
                  >
                    {log.status === "granted" ? "GRANTED" : "Denied"}
                  </span>
                </li>
              ))
            )}
          </ul>
        </aside>
      </div>

      <SecurityVerifyModal
        result={result}
        onApprove={closeResult}
        onDeny={closeResult}
      />
    </>
  );
};

const SecurityHomePage: NextPageWithLayout = () => <SecurityHomeInner />;

SecurityHomePage.getLayout = (page) => <SecurityLayout>{page}</SecurityLayout>;

export default SecurityHomePage;
