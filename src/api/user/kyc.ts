import { apiGet, apiPatch, apiPost } from "@/lib/apiClient";

export type ClientIdType =
  | "NATIONAL_ID"
  | "DRIVER_LICENSE"
  | "PASSPORT"
  | "OTHER";

/** POST /user/{id}/kyc — OpenAPI CreateClientKycDto */
export type CreateClientKycDTO = {
  userId: string;
  idType: ClientIdType;
  tinNumber: string;
  idNumber?: string;
  idDocumentId?: string;
  proofOfAddressDocumentId?: string;
  tinDocumentId?: string;
};

/** PATCH /user/{id}/kyc — OpenAPI UpdateClientKycDto */
export type UpdateClientKycDTO = {
  idType?: ClientIdType;
  idNumber?: string;
  idDocumentId?: string;
  proofOfAddressDocumentId?: string;
  tinDocumentId?: string;
  tinNumber?: string;
};

type Result =
  | { success: true; data: unknown }
  | { success: false; error: string; statusCode?: number };

export const createUserKyc = async (
  userId: string,
  body: CreateClientKycDTO,
): Promise<Result> => {
  const result = await apiPost<unknown>(
    `/user/${encodeURIComponent(userId)}/kyc`,
    body,
  );
  if (!result.success) {
    return {
      success: false,
      error: result.error,
      statusCode: result.statusCode,
    };
  }
  return { success: true, data: result.data };
};

export const updateUserKyc = async (
  userId: string,
  body: UpdateClientKycDTO,
): Promise<Result> => {
  const result = await apiPatch<unknown>(
    `/user/${encodeURIComponent(userId)}/kyc`,
    body,
  );
  if (!result.success) {
    return {
      success: false,
      error: result.error,
      statusCode: result.statusCode,
    };
  }
  return { success: true, data: result.data };
};

export const getUserKyc = async (userId: string): Promise<Result> => {
  const result = await apiGet<unknown>(
    `/user/${encodeURIComponent(userId)}/kyc`,
  );
  if (!result.success) {
    return {
      success: false,
      error: result.error,
      statusCode: result.statusCode,
    };
  }
  return { success: true, data: result.data };
};
