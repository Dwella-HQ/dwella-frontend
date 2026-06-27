function pickHttpUrl(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const url = value.trim();
  return url.startsWith("http://") || url.startsWith("https://") ? url : null;
}

function transactionPaymentUrlFrom(
  record: Record<string, unknown>,
): string | null {
  const transaction = record.transaction;
  if (!transaction || typeof transaction !== "object") return null;
  return pickHttpUrl((transaction as Record<string, unknown>).paymentUrl);
}

export function extractDepositCheckoutUrl(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;

  const root = payload as Record<string, unknown>;
  let url =
    pickHttpUrl(root.paymentUrl) ||
    pickHttpUrl(root.authorizationUrl) ||
    pickHttpUrl(root.checkoutUrl) ||
    transactionPaymentUrlFrom(root);
  if (url) return url;

  const firstData = root.data;
  if (!firstData || typeof firstData !== "object") return null;

  const layer1 = firstData as Record<string, unknown>;
  url =
    pickHttpUrl(layer1.paymentUrl) ||
    pickHttpUrl(layer1.authorizationUrl) ||
    pickHttpUrl(layer1.checkoutUrl) ||
    transactionPaymentUrlFrom(layer1);
  if (url) return url;

  const secondData = layer1.data;
  if (!secondData || typeof secondData !== "object") return null;

  const layer2 = secondData as Record<string, unknown>;
  return (
    pickHttpUrl(layer2.paymentUrl) ||
    pickHttpUrl(layer2.authorizationUrl) ||
    pickHttpUrl(layer2.checkoutUrl) ||
    transactionPaymentUrlFrom(layer2)
  );
}
