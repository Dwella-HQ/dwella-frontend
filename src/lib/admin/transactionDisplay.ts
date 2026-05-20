import type { TransactionDTO } from "@/api/transaction";
import type { RentPaymentItemDTO } from "@/api/rent-payment/rentPayment.schema";

/** e.g. "Rent payment for JC-001 from 1st May 2026…" → "JC-001" */
export function propertyLabelFromNarration(narration: unknown): string | null {
  if (typeof narration !== "string" || !narration.trim()) return null;
  const m = narration.match(/\bfor\s+(.+?)\s+from\b/i);
  if (m?.[1]) {
    const s = m[1].trim();
    return s || null;
  }
  return null;
}

/** Short reference for tables (avoids full UUID width). */
export function formatTransactionRef(tx: TransactionDTO): string {
  const r = tx as Record<string, unknown>;
  const meta = r.metaData;
  const metaRef =
    meta && typeof meta === "object"
      ? (meta as Record<string, unknown>).reference
      : undefined;
  const ref =
    (typeof r.reference === "string" && r.reference.trim()
      ? r.reference
      : null) ??
    (metaRef != null && String(metaRef).trim() ? String(metaRef) : null) ??
    (r.id != null ? String(r.id) : "");
  const s = ref.trim();
  if (!s) return "—";
  if (s.length <= 14) return s;
  return `${s.slice(0, 6)}…${s.slice(-4)}`;
}

export function resolveSenderEmail(tx: TransactionDTO): string {
  const r = tx as Record<string, unknown>;
  const sender = r.senderDetails;
  if (sender && typeof sender === "object") {
    const e = (sender as Record<string, unknown>).email;
    if (typeof e === "string" && e.trim()) return e.trim();
  }
  return "—";
}

export function resolveReceiverEmail(tx: TransactionDTO): string {
  const r = tx as Record<string, unknown>;
  const recv = r.receiverDetails;
  if (recv && typeof recv === "object") {
    const e = (recv as Record<string, unknown>).email;
    if (typeof e === "string" && e.trim()) return e.trim();
  }
  return "—";
}

/** Human-readable action e.g. rent_payment → Rent payment */
export function formatActionLabel(tx: TransactionDTO): string {
  const r = tx as Record<string, unknown>;
  const raw = r.action ?? r.paymentType ?? r.kind;
  if (typeof raw !== "string" || !raw.trim()) return "—";
  return raw.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function resolveNarration(tx: TransactionDTO): string {
  const r = tx as Record<string, unknown>;
  const n = r.narration ?? r.description ?? r.memo ?? r.note;
  return typeof n === "string" && n.trim() ? n.trim() : "—";
}

export function truncateText(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, Math.max(0, max - 1))}…`;
}

function nestedName(tx: TransactionDTO, key: string): string {
  const r = tx as Record<string, unknown>;
  const block = r[key];
  if (!block || typeof block !== "object") return "—";
  const o = block as Record<string, unknown>;
  const name = o.fullName ?? o.name ?? o.businessName ?? o.title ?? o.email;
  return typeof name === "string" && name.trim() ? name : "—";
}

function nestedProperty(tx: TransactionDTO): string {
  const r = tx as Record<string, unknown>;
  const prop = r.property ?? r.estate;
  if (!prop || typeof prop !== "object") return "—";
  const o = prop as Record<string, unknown>;
  const name = o.name ?? o.title;
  return typeof name === "string" ? name : "—";
}

function pickString(r: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    const v = r[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "—";
}

function extractPersonName(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    const o = value as Record<string, unknown>;
    for (const k of ["fullName", "name", "businessName", "title", "email"]) {
      const v = o[k];
      if (typeof v === "string" && v.trim()) return v.trim();
    }
  }
  return "";
}

function rentItemFromLinkedId(
  r: Record<string, unknown>,
  rentById: Map<string, RentPaymentItemDTO>,
): RentPaymentItemDTO | null {
  const keys = [
    "rentPaymentId",
    "rent_payment_id",
    "rentPayment_id",
    "paymentId",
    "payment_id",
    "rentId",
    "rent_id",
  ];
  for (const k of keys) {
    const v = r[k];
    if (v === undefined || v === null) continue;
    const hit = rentById.get(String(v));
    if (hit) return hit;
  }

  const ref = String(r.reference ?? r.referenceId ?? "").trim();
  if (ref && rentById.has(ref)) {
    return rentById.get(ref) ?? null;
  }
  const idKey = r.id != null ? String(r.id).trim() : "";
  if (idKey && rentById.has(idKey)) {
    return rentById.get(idKey) ?? null;
  }
  return null;
}

export function buildRentPaymentIndex(
  items: RentPaymentItemDTO[],
): Map<string, RentPaymentItemDTO> {
  const map = new Map<string, RentPaymentItemDTO>();
  for (const item of items) {
    map.set(String(item.id), item);
    const ext = item as Record<string, unknown>;
    const ref = ext.reference ?? ext.reference_id;
    if (ref != null && String(ref).trim()) {
      map.set(String(ref).trim(), item);
    }
  }
  return map;
}

/** When API omits nested `tenant`, match flat fields or linked rent-payment row. */
export function resolveTenantLabel(
  tx: TransactionDTO,
  rentById: Map<string, RentPaymentItemDTO>,
): string {
  const r = tx as Record<string, unknown>;
  const sender = r.senderDetails;
  if (sender && typeof sender === "object") {
    const o = sender as Record<string, unknown>;
    const n = o.fullName ?? o.name ?? o.email;
    if (typeof n === "string" && n.trim()) return n.trim();
  }

  const nested = nestedName(tx, "tenant");
  if (nested !== "—") return nested;

  const flat = pickString(r, [
    "tenantName",
    "tenant_name",
    "renterName",
    "customerName",
    "debtorName",
  ]);
  if (flat !== "—") return flat;

  const linked = rentItemFromLinkedId(r, rentById);
  if (linked) {
    const n =
      linked.tenantName ??
      linked.tenant_name ??
      extractPersonName(linked.tenant);
    if (n) return n;
  }

  return "—";
}

/** Landlord is often omitted on payment rows; show when API sends it or nested object. */
export function resolveLandlordLabel(tx: TransactionDTO): string {
  const r = tx as Record<string, unknown>;
  const recv = r.receiverDetails;
  if (recv && typeof recv === "object") {
    const o = recv as Record<string, unknown>;
    const n = o.fullName ?? o.name ?? o.businessName ?? o.email;
    if (typeof n === "string" && n.trim()) return n.trim();
  }

  const nested = nestedName(tx, "landlord");
  if (nested !== "—") return nested;
  return pickString(r, [
    "landlordName",
    "landlord_name",
    "ownerName",
    "payeeName",
    "recipientName",
    "creditorName",
  ]);
}

export function resolvePropertyLabel(
  tx: TransactionDTO,
  rentById: Map<string, RentPaymentItemDTO>,
): string {
  const r = tx as Record<string, unknown>;
  const nested = nestedProperty(tx);
  if (nested !== "—") return nested;

  const flat = pickString(r, [
    "propertyName",
    "property_name",
    "propertyTitle",
    "estateName",
    "listingName",
  ]);
  if (flat !== "—") return flat;

  const linked = rentItemFromLinkedId(r, rentById);
  if (linked) {
    const name =
      linked.propertyName ??
      linked.property_name ??
      (typeof linked.property === "object" && linked.property !== null
        ? extractPersonName(linked.property)
        : "");
    if (name) return name;
  }

  const fromNarration = propertyLabelFromNarration(r.narration);
  if (fromNarration) return fromNarration;

  return "—";
}

export function transactionApiId(tx: TransactionDTO): string | null {
  const r = tx as Record<string, unknown>;
  const id = r.id;
  if (id !== undefined && id !== null && String(id).trim() !== "") {
    return String(id);
  }
  return null;
}
