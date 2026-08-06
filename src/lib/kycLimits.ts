/**
 * Shared input caps for KYC identity fields collected across onboarding
 * flows (landlord, tenant, guest, property manager) and tenant creation.
 *
 * These are generous-but-bounded limits — not exact-format validation —
 * since `idNumber` covers several ID types (National ID, Driver's
 * License, Passport, Other) with different real-world lengths. The goal
 * is just to stop obviously-invalid, arbitrarily long input (e.g. pasted
 * text) rather than to strictly validate format.
 */
export const ID_NUMBER_MAX_LENGTH = 20;
export const TIN_MAX_LENGTH = 20;
