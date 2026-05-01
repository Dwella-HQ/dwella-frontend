/**
 * Parse `GET /property/{id}/settings` payloads for forms and read-only summaries.
 */

export const MONTHLY_GRACE_VALUES = [
  "NO_GRACE_PERIOD",
  "ONE_WEEK",
  "TWO_WEEKS",
] as const;

export const QUARTERLY_GRACE_VALUES = [
  "NO_GRACE_PERIOD",
  "ONE_WEEK",
  "TWO_WEEKS",
  "THREE_WEEKS",
  "ONE_MONTH",
  "FIVE_WEEKS",
  "SIX_WEEKS",
] as const;

export const YEARLY_GRACE_VALUES = [
  "NO_GRACE_PERIOD",
  "ONE_MONTH",
  "TWO_MONTHS",
  "THREE_MONTHS",
  "FOUR_MONTHS",
  "FIVE_MONTHS",
  "SIX_MONTHS",
] as const;

export const GRACE_LABELS: Record<string, string> = {
  NO_GRACE_PERIOD: "No grace period",
  ONE_WEEK: "One week",
  TWO_WEEKS: "Two weeks",
  THREE_WEEKS: "Three weeks",
  ONE_MONTH: "One month",
  FIVE_WEEKS: "Five weeks",
  SIX_WEEKS: "Six weeks",
  TWO_MONTHS: "Two months",
  THREE_MONTHS: "Three months",
  FOUR_MONTHS: "Four months",
  FIVE_MONTHS: "Five months",
  SIX_MONTHS: "Six months",
};

export function gracePeriodLabel(code: string): string {
  return GRACE_LABELS[code] ?? code;
}

function pickGraceValue(raw: unknown, allowed: readonly string[]): string {
  const s = typeof raw === "string" ? raw : "NO_GRACE_PERIOD";
  return allowed.includes(s) ? s : "NO_GRACE_PERIOD";
}

export type PropertyGraceFormState = {
  monthlyRentGracePeriod: string;
  quarterlyRentGracePeriod: string;
  yearlyRentGracePeriod: string;
};

export type PropertyLateFeeFormState = {
  lateFeeAmount: string;
  lateFeeType: "fixed" | "percentage";
};

export function applyPropertySettingsFromApi(d: Record<string, unknown>): {
  grace: PropertyGraceFormState;
  lateFee: PropertyLateFeeFormState;
} {
  const gp = d.gracePeriodPeriods as Record<string, unknown> | undefined;
  const grace: PropertyGraceFormState = {
    monthlyRentGracePeriod: pickGraceValue(
      gp?.monthlyRentDueDateGracePeriod ?? gp?.monthlyRentGracePeriod,
      MONTHLY_GRACE_VALUES as unknown as string[],
    ),
    quarterlyRentGracePeriod: pickGraceValue(
      gp?.quarterlyRentDueDateGracePeriod ?? gp?.quarterlyRentGracePeriod,
      QUARTERLY_GRACE_VALUES as unknown as string[],
    ),
    yearlyRentGracePeriod: pickGraceValue(
      gp?.yearlyRentDueDateGracePeriod ?? gp?.yearlyRentGracePeriod,
      YEARLY_GRACE_VALUES as unknown as string[],
    ),
  };
  const lf = d.lateFeeSettings as Record<string, unknown> | undefined;
  const lateFeeType: "fixed" | "percentage" =
    lf?.lateFeeType === "percentage" ? "percentage" : "fixed";
  const rawAmt = lf?.lateFeeAmount;
  const amt =
    typeof rawAmt === "number"
      ? rawAmt
      : typeof rawAmt === "string"
        ? Number(rawAmt)
        : 0;
  return {
    grace,
    lateFee: {
      lateFeeAmount: String(Number.isFinite(amt) ? amt : 0),
      lateFeeType,
    },
  };
}

export function formatLateFeeLine(fee: PropertyLateFeeFormState): string {
  const n = Number(fee.lateFeeAmount);
  const safe = Number.isFinite(n) ? n : 0;
  if (fee.lateFeeType === "percentage") {
    return `${safe}% (percentage of rent)`;
  }
  return `₦${safe.toLocaleString("en-NG")} (fixed amount)`;
}

/** One-line + structured labels for cards / tables. */
export type PropertyRentRulesCardLines = {
  late: string;
  monthly: string;
  quarterly: string;
  yearly: string;
};

export function buildRentRulesCardLines(
  data: Record<string, unknown>,
): PropertyRentRulesCardLines {
  const m = applyPropertySettingsFromApi(data);
  return {
    late: formatLateFeeLine(m.lateFee),
    monthly: gracePeriodLabel(m.grace.monthlyRentGracePeriod),
    quarterly: gracePeriodLabel(m.grace.quarterlyRentGracePeriod),
    yearly: gracePeriodLabel(m.grace.yearlyRentGracePeriod),
  };
}

export function formatRentRulesPolicyTooltip(
  lines: PropertyRentRulesCardLines,
): string {
  return `Late fee: ${lines.late}\nMonthly grace: ${lines.monthly}\nQuarterly grace: ${lines.quarterly}\nYearly grace: ${lines.yearly}`;
}

/** Approximate calendar extension after due date for UI previews (backend may differ). */
export function gracePeriodCodeToApproxCalendarDays(code: string): number {
  const map: Record<string, number> = {
    NO_GRACE_PERIOD: 0,
    ONE_WEEK: 7,
    TWO_WEEKS: 14,
    THREE_WEEKS: 21,
    ONE_MONTH: 30,
    FIVE_WEEKS: 35,
    SIX_WEEKS: 42,
    TWO_MONTHS: 60,
    THREE_MONTHS: 90,
    FOUR_MONTHS: 120,
    FIVE_MONTHS: 150,
    SIX_MONTHS: 180,
  };
  return map[code] ?? 0;
}

/**
 * Which saved grace applies depends on how often rent is billed (lease
 * `rentFrequency`). Weekly/biweekly/monthly/one_time use the monthly grace
 * bucket as the closest match in settings.
 */
export function graceCodeForRentFrequency(
  frequency: string | undefined,
  grace: PropertyGraceFormState,
): string {
  const f = (frequency || "monthly").toLowerCase().replace(/-/g, "_");
  if (f === "quarterly") return grace.quarterlyRentGracePeriod;
  if (f === "yearly") return grace.yearlyRentGracePeriod;
  return grace.monthlyRentGracePeriod;
}
