import type { ConsumerTransactionDTO, ConsumerDTO, PartnerDTO } from "./consumer.schema";
import type { CustomerTransaction, TransactionStatus } from "@/components/CustomerTransactionTable";

/**
 * Format currency amount to Naira format
 */
const formatAmount = (amount: string): string => {
  const numAmount = parseFloat(amount);
  return `₦${numAmount.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

/**
 * Format time ago from ISO date string
 */
const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return `${diffInSeconds} second${diffInSeconds !== 1 ? "s" : ""} ago`;
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} min${diffInMinutes !== 1 ? "s" : ""} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours !== 1 ? "s" : ""} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays} day${diffInDays !== 1 ? "s" : ""} ago`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths !== 1 ? "s" : ""} ago`;
  }

  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears} year${diffInYears !== 1 ? "s" : ""} ago`;
};

/**
 * Map API status to TransactionStatus
 */
const mapStatus = (status: string): TransactionStatus => {
  const normalizedStatus = status.toLowerCase();
  if (normalizedStatus === "completed" || normalizedStatus === "successful" || normalizedStatus === "success") {
    return "Successful";
  }
  if (normalizedStatus === "pending") {
    return "Pending";
  }
  if (normalizedStatus === "failed" || normalizedStatus === "fail") {
    return "Failed";
  }
  // Default to successful if status doesn't match
  return "Successful";
};

/**
 * Extended CustomerTransaction type that includes consumer transaction metadata
 */
export type ConsumerTransactionWithMetadata = CustomerTransaction & {
  consumerTransaction?: {
    id: number;
    transaction_id: number;
    transaction_reference: string;
    status: string;
    account_number: string;
    meter_number: string;
    payment_type: string;
    customer: string;
    account_type: string;
    tariff: string;
    feeder: string;
    amount: string;
    debt_reconciliation: string;
    charged_amount: string;
    vat: string;
    transaction_charge: number;
    kwh: string;
    token: string;
    date: string;
    partner_reference: string;
    createdAt: string;
    updatedAt: string;
      consumer: ConsumerDTO;
      partner: PartnerDTO;
  };
};

/**
 * Map consumer transaction from API to CustomerTransaction type for UI
 */
export const mapConsumerTransaction = (
  consumerTx: ConsumerTransactionDTO
): ConsumerTransactionWithMetadata => {
  // Calculate net amount (amount - transaction_charge)
  const netAmount = parseFloat(consumerTx.amount) - (consumerTx.transaction_charge || 0);
  const formattedNet = formatAmount(netAmount.toString());

  return {
    id: consumerTx.transaction_reference,
    name: consumerTx.customer,
    reference: consumerTx.consumer.res_address1 || consumerTx.transaction_reference,
    account: consumerTx.meter_number,
    type: `${consumerTx.kwh} kWh`,
    amount: formatAmount(consumerTx.amount),
    fee: formatAmount(consumerTx.transaction_charge.toString()),
    net: formattedNet,
    timeAgo: formatTimeAgo(consumerTx.date),
    status: mapStatus(consumerTx.status),
    consumerTransaction: {
      id: consumerTx.id,
      transaction_id: consumerTx.transaction_id,
      transaction_reference: consumerTx.transaction_reference,
      status: consumerTx.status,
      account_number: consumerTx.account_number,
      meter_number: consumerTx.meter_number,
      payment_type: consumerTx.payment_type,
      customer: consumerTx.customer,
      account_type: consumerTx.account_type,
      tariff: consumerTx.tariff,
      feeder: consumerTx.feeder,
      amount: consumerTx.amount,
      debt_reconciliation: consumerTx.debt_reconciliation,
      charged_amount: consumerTx.charged_amount,
      vat: consumerTx.vat,
      transaction_charge: consumerTx.transaction_charge,
      kwh: consumerTx.kwh,
      token: consumerTx.token,
      date: consumerTx.date,
      partner_reference: consumerTx.partner_reference,
      createdAt: consumerTx.createdAt,
      updatedAt: consumerTx.updatedAt,
      consumer: consumerTx.consumer,
      partner: consumerTx.partner,
    },
  };
};

