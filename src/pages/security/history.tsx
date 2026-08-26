import * as React from "react";
import { Search } from "lucide-react";
import { SecurityLayout } from "@/components/security/SecurityLayout";
import {
  formatSecurityTimestamp,
  getSecurityHistory,
  type SecurityAccessLog,
} from "@/lib/securitySession";
import type { NextPageWithLayout } from "../_app";

const StatusBadge = ({ status }: { status: SecurityAccessLog["status"] }) => {
  if (status === "granted") {
    return (
      <span className="inline-flex rounded-full bg-emerald-600 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
        GRANTED
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-full bg-red-50 px-3 py-1 text-[11px] font-semibold text-red-600">
      Denied
    </span>
  );
};

const SecurityHistoryPage: NextPageWithLayout = () => {
  const [query, setQuery] = React.useState("");
  const [logs, setLogs] = React.useState<SecurityAccessLog[]>([]);

  React.useEffect(() => {
    setLogs(getSecurityHistory());
  }, []);

  const filtered = React.useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return logs;
    return logs.filter((log) =>
      [log.name, log.role, log.location, log.code, log.status]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [logs, query]);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="text-center sm:text-left">
          <h1 className="text-2xl font-bold text-gray-900">Recent Access</h1>
          <p className="mt-1 hidden text-sm text-gray-500 lg:block">
            Gate scans from this device. Filter by name, code, or status.
          </p>
        </div>
        <label className="relative w-full sm:max-w-xs">
          <span className="sr-only">Search access logs</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, code, status"
            className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-main focus:outline-none focus:ring-2 focus:ring-brand-main"
          />
        </label>
      </div>

      <div className="space-y-3 lg:hidden">
        {filtered.length === 0 ? (
          <p className="rounded-xl border border-dashed border-gray-200 py-10 text-center text-sm text-gray-500">
            No access records yet.
          </p>
        ) : (
          filtered.map((log) => (
            <article
              key={log.id}
              className="flex items-start justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4"
            >
              <div className="min-w-0">
                <p className="font-semibold text-gray-900">
                  {log.name} ({log.role})
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  {log.location} • {formatSecurityTimestamp(log.timestamp)}
                </p>
                <p className="mt-1 text-sm text-gray-800">Code: {log.code}</p>
              </div>
              <StatusBadge status={log.status} />
            </article>
          ))
        )}
      </div>

      <div className="hidden overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm lg:block">
        <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
          <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-5 py-3">Person</th>
              <th className="px-5 py-3">Location</th>
              <th className="px-5 py-3">Date & time</th>
              <th className="px-5 py-3">Code</th>
              <th className="px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-5 py-12 text-center text-sm text-gray-500"
                >
                  No access records yet.
                </td>
              </tr>
            ) : (
              filtered.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-5 py-4 font-medium text-gray-900">
                    {log.name}{" "}
                    <span className="font-normal text-gray-500">
                      ({log.role})
                    </span>
                  </td>
                  <td className="px-5 py-4 text-gray-600">{log.location}</td>
                  <td className="px-5 py-4 text-gray-600">
                    {formatSecurityTimestamp(log.timestamp)}
                  </td>
                  <td className="px-5 py-4 font-mono text-gray-800">
                    {log.code}
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={log.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

SecurityHistoryPage.getLayout = (page) => (
  <SecurityLayout>{page}</SecurityLayout>
);

export default SecurityHistoryPage;
