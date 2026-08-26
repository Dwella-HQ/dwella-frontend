import * as React from "react";
import { Check, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { SecurityLayout } from "@/components/security/SecurityLayout";
import {
  SecurityVerifyModal,
  type SecurityVerifyResult,
} from "@/components/security/SecurityVerifyModal";
import { useToast } from "@/components/Toast";
import {
  appendSecurityHistory,
  formatSecurityTimestamp,
  getSecurityHistory,
  lookupSecurityCode,
  normalizeSecurityCode,
  type SecurityAccessLog,
} from "@/lib/securitySession";
import type { NextPageWithLayout } from "../_app";

const CODE_LENGTH = 6;

const SecurityHomePage: NextPageWithLayout = () => {
  const { showToast } = useToast();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [code, setCode] = React.useState("");
  const [isVerifying, setIsVerifying] = React.useState(false);
  const [result, setResult] = React.useState<SecurityVerifyResult | null>(null);
  const [recent, setRecent] = React.useState<SecurityAccessLog[]>([]);

  const refreshRecent = React.useCallback(() => {
    setRecent(getSecurityHistory().slice(0, 5));
  }, []);

  React.useEffect(() => {
    refreshRecent();
    inputRef.current?.focus();
  }, [refreshRecent]);

  const handleCodeChange = (value: string) => {
    setCode(normalizeSecurityCode(value));
  };

  const handleVerify = React.useCallback(() => {
    const normalized = normalizeSecurityCode(code);
    if (normalized.length !== CODE_LENGTH) {
      showToast("Enter a 6-character access code.", "error");
      return;
    }

    setIsVerifying(true);
    window.setTimeout(() => {
      const lookup = lookupSecurityCode(normalized);
      if (lookup) {
        setResult({
          kind: "valid",
          lookup,
          code: normalized,
          timestamp: new Date().toISOString(),
        });
      } else {
        setResult({ kind: "invalid", code: normalized });
      }
      setIsVerifying(false);
    }, 250);
  }, [code, showToast]);

  const closeResult = React.useCallback(() => {
    setResult(null);
    setCode("");
    refreshRecent();
    inputRef.current?.focus();
  }, [refreshRecent]);

  const handleApprove = React.useCallback(() => {
    if (result?.kind !== "valid") return;
    appendSecurityHistory({
      name: result.lookup.name,
      role: result.lookup.role,
      location: result.lookup.location,
      timestamp: result.timestamp,
      code: result.code,
      status: "granted",
    });
    showToast("Entry approved.", "success");
    closeResult();
  }, [closeResult, result, showToast]);

  const handleDeny = React.useCallback(() => {
    if (!result) return;
    appendSecurityHistory({
      name: result.kind === "valid" ? result.lookup.name : "Unknown visitor",
      role: result.kind === "valid" ? result.lookup.role : "Visitor",
      location: result.kind === "valid" ? result.lookup.location : "Main gate",
      timestamp: new Date().toISOString(),
      code: result.code,
      status: "denied",
    });
    showToast("Entry denied.", "info");
    closeResult();
  }, [closeResult, result, showToast]);

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

          <form
            className="mt-10"
            onSubmit={(event) => {
              event.preventDefault();
              handleVerify();
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
        </div>

        <aside className="hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:block">
          <h2 className="text-lg font-semibold text-gray-900">
            Recent at this gate
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Latest scans from this device.
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
        onApprove={handleApprove}
        onDeny={handleDeny}
      />
    </>
  );
};

SecurityHomePage.getLayout = (page) => <SecurityLayout>{page}</SecurityLayout>;

export default SecurityHomePage;
