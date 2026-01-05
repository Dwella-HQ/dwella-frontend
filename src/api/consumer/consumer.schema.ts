import { z } from "zod";

export const consumerSchema = z.object({
  id: z.number(),
  account_name: z.string(),
  phone: z.string().nullable(),
  account_number: z.string(),
  account_type: z.string(),
  district: z.string(),
  account_type_number: z.string().nullable(),
  meter_type: z.string(),
  postpaid_meter_number: z.string().nullable(),
  connection_date: z.string().nullable(),
  prepaid_meter_number: z.string(),
  long: z.number().nullable(),
  lat: z.number().nullable(),
  class: z.string().nullable(),
  category: z.string().nullable(),
  res_address1: z.string(),
  res_address2: z.string().nullable(),
  res_address3: z.string().nullable(),
  con_address1: z.string(),
  con_address2: z.string().nullable(),
  con_address3: z.string().nullable(),
  month_count: z.number(),
  reading_mode: z.string(),
  units: z.number(),
  estimated_units: z.number(),
  multiplying_factor: z.number(),
  percentage_discount: z.string().nullable(),
  discount_allowed: z.string(),
  tariff: z.string(),
  feeder: z.string(),
  substation: z.string(),
  meter_status: z.string(),
  account_status: z.string(),
  reconciliation_active: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable(),
});

export const partnerSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  phone: z.string(),
  device_token: z.string().nullable().optional(),
  role: z.string().optional(),
  isActive: z.boolean(),
  isSuspended: z.boolean(),
  notification_count: z.number().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  deletedAt: z.string().nullable().optional(),
});

export const consumerTransactionSchema = z.object({
  id: z.number(),
  transaction_id: z.number(),
  transaction_reference: z.string(),
  status: z.string(),
  issuer_id: z.number().nullable(),
  account_number: z.string(),
  meter_number: z.string(),
  payment_type: z.string(),
  customer: z.string(),
  account_type: z.string(),
  tariff: z.string(),
  feeder: z.string(),
  amount: z.string(),
  debt_reconciliation: z.string(),
  charged_amount: z.string(),
  vat: z.string(),
  transaction_charge: z.number(),
  kwh: z.string(),
  token: z.string(),
  date: z.string(),
  partner_id: z.number(),
  partner_reference: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  partner: partnerSchema,
  consumer: consumerSchema,
});

export const consumerTransactionsPaginationSchema = z.object({
  prevPage: z.number().nullable(),
  currentPage: z.number(),
  nextPage: z.number().nullable(),
  pageTotal: z.number(),
  pageSize: z.number(),
});

export const consumerTransactionsResponseSchema = z.object({
  status: z.string(),
  message: z.string(),
  data: z.object({
    total: z.number(),
    pagination: consumerTransactionsPaginationSchema,
    transactions: z.array(consumerTransactionSchema),
  }),
});

export type ConsumerDTO = z.infer<typeof consumerSchema>;
export type PartnerDTO = z.infer<typeof partnerSchema>;
export type ConsumerTransactionDTO = z.infer<typeof consumerTransactionSchema>;
export type ConsumerTransactionsPaginationDTO = z.infer<
  typeof consumerTransactionsPaginationSchema
>;
export type ConsumerTransactionsResponseDTO = z.infer<
  typeof consumerTransactionsResponseSchema
>;
