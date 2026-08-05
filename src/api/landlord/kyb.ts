import { apiGet, apiPatch, apiPost } from "@/lib/apiClient";

export type CreateAddressDTO = {
  address: string;
  city: string;
  state: string;
  postalCode?: string;
  country: string;
};

/** POST /landlord/{id}/kyb — OpenAPI CreateLandlordKybDto */
export type CreateLandlordKybDTO = {
  businessName: string;
  businessEmail: string;
  businessPhoneNumber: string;
  businessLogoId: string;
  businessCacCertificateId: string;
  businessAddress?: CreateAddressDTO;
  businessTinCertificateId?: string;
  businessTinNumber?: string;
  businessProofOfAddressId?: string;
};

/** PATCH /landlord/{id}/kyb — OpenAPI UpdateLandlordKybDto */
export type UpdateLandlordKybDTO = Partial<CreateLandlordKybDTO>;

type Result =
  | { success: true; data: unknown }
  | { success: false; error: string; statusCode?: number };

export const createLandlordKyb = async (
  landlordId: string,
  body: CreateLandlordKybDTO,
): Promise<Result> => {
  const result = await apiPost<unknown>(
    `/landlord/${encodeURIComponent(landlordId)}/kyb`,
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

export const updateLandlordKyb = async (
  landlordId: string,
  body: UpdateLandlordKybDTO,
): Promise<Result> => {
  const result = await apiPatch<unknown>(
    `/landlord/${encodeURIComponent(landlordId)}/kyb`,
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

export const getLandlordKyb = async (landlordId: string): Promise<Result> => {
  const result = await apiGet<unknown>(
    `/landlord/${encodeURIComponent(landlordId)}/kyb`,
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
