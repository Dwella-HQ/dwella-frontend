/**
 * Resolves Paystack (or other) checkout URL from POST /rent-payment response bodies.
 * Handles nested shapes: `data.transaction.paymentUrl`, `data.data.transaction.paymentUrl`,
 * plus legacy `authorizationUrl` / `checkoutUrl` fields.
 */
function pickHttpUrl(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const s = value.trim();
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  return null;
}

function transactionPaymentUrlFrom(
  record: Record<string, unknown>,
): string | null {
  const tx = record.transaction;
  if (!tx || typeof tx !== "object") return null;
  return pickHttpUrl((tx as Record<string, unknown>).paymentUrl);
}

export function extractRentPaymentCheckoutUrl(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const root = payload as Record<string, unknown>;

  let url = pickHttpUrl(root.authorizationUrl) || pickHttpUrl(root.checkoutUrl);
  if (url) return url;

  url = transactionPaymentUrlFrom(root);
  if (url) return url;

  const d1 = root.data;
  if (!d1 || typeof d1 !== "object") return null;
  const layer1 = d1 as Record<string, unknown>;

  url =
    pickHttpUrl(layer1.authorizationUrl) ||
    pickHttpUrl(layer1.checkoutUrl) ||
    transactionPaymentUrlFrom(layer1);
  if (url) return url;

  const d2 = layer1.data;
  if (!d2 || typeof d2 !== "object") return null;
  const layer2 = d2 as Record<string, unknown>;

  return (
    pickHttpUrl(layer2.authorizationUrl) ||
    pickHttpUrl(layer2.checkoutUrl) ||
    transactionPaymentUrlFrom(layer2)
  );
}
