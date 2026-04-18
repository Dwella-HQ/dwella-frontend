import { format, isValid, parseISO } from "date-fns";
import type { Payment } from "@/data/mockLandlordData";
import type { RentPaymentItemDTO } from "./rentPayment.schema";

function extractName(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "name" in value) {
    const n = (value as { name?: unknown }).name;
    if (typeof n === "string") return n;
  }
  if (value && typeof value === "object" && "fullName" in value) {
    const n = (value as { fullName?: unknown }).fullName;
    if (typeof n === "string") return n;
  }
  return "";
}

function extractUnitLabel(unit: unknown): string {
  if (typeof unit === "string") return unit;
  if (unit && typeof unit === "object") {
    const u = unit as Record<string, unknown>;
    if (typeof u.name === "string") return u.name;
    if (typeof u.label === "string") return u.label;
    if (typeof u.unitNumber === "string") return u.unitNumber;
    if (typeof u.unitId === "string") return u.unitId;
  }
  return "";
}

function coerceAmount(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number.parseFloat(value.replace(/,/g, ""));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function pickRawDate(item: RentPaymentItemDTO): string | undefined {
  return (
    item.paidAt ??
    item.paid_at ??
    item.paymentDate ??
    item.payment_date ??
    item.dueDate ??
    item.due_date ??
    item.createdAt ??
    item.created_at
  );
}

function formatPaymentDate(value: string | undefined): string {
  if (!value) return "—";
  try {
    const d = parseISO(value);
    if (isValid(d)) return format(d, "dd MMM yyyy");
  } catch {
    /* ignore */
  }
  const d2 = new Date(value);
  if (isValid(d2)) return format(d2, "dd MMM yyyy");
  return value;
}

export function rentPaymentSortTimestamp(value: string | undefined): number {
  if (!value) return 0;
  try {
    const d = parseISO(value);
    if (isValid(d)) return d.getTime();
  } catch {
    /* ignore */
  }
  const d2 = new Date(value);
  return isValid(d2) ? d2.getTime() : 0;
}

export function mapRentPaymentItemToPayment(item: RentPaymentItemDTO): Payment {
  const propertyId = item.propertyId ?? item.property_id ?? undefined;
  const propertyName =
    item.propertyName ?? item.property_name ?? extractName(item.property) ?? "";
  const tenantName =
    item.tenantName ?? item.tenant_name ?? extractName(item.tenant) ?? "Tenant";
  const unit =
    extractUnitLabel(item.unit) || item.unitNumber || item.unit_number || "";

  const amount = coerceAmount(
    item.amount ?? item.paidAmount ?? item.paid_amount ?? item.total,
  );

  const rawDate = pickRawDate(item);

  const paidSignal =
    item.paidAt ?? item.paid_at ?? item.paymentDate ?? item.payment_date;
  const statusRaw =
    typeof (item as { status?: unknown }).status === "string"
      ? String((item as { status?: string }).status)
      : "";
  const paymentReceived =
    paidSignal != null && paidSignal !== ""
      ? true
      : /\b(paid|completed|success|cleared|confirmed)\b/i.test(statusRaw);

  return {
    id: item.id,
    tenantName,
    propertyName,
    unit,
    amount,
    dueDate: formatPaymentDate(rawDate),
    propertyId,
    paymentReceived,
  };
}

export function mapAndSortRecentPayments(
  items: RentPaymentItemDTO[],
): Payment[] {
  const decorated = items.map((item) => ({
    item,
    ts: rentPaymentSortTimestamp(pickRawDate(item)),
  }));
  decorated.sort((a, b) => b.ts - a.ts);
  return decorated.map(({ item }) => mapRentPaymentItemToPayment(item));
}
