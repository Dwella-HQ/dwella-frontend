import { apiPatch } from "@/lib/apiClient";

/** OpenAPI `CreateAddressDto` nested in `UpdateLandlordDto`. */
export type LandlordAddressDTO = {
  address: string;
  city: string;
  state: string;
  postalCode?: string;
  country: string;
};

/** OpenAPI `BankAccountDto` used in `UpdateLandlordDto`. */
export type LandlordBankAccountDTO = {
  accountName: string;
  accountNumber: string;
  bankName: string;
  bankCode: string;
  bvn: string;
};

/** Matches OpenAPI `UpdateLandlordDto` (+ businessPhoneNumber used by the API). */
export type UpdateLandlordDTO = {
  userId?: string;
  businessName?: string;
  businessEmail?: string;
  businessPhoneNumber?: string;
  profilePictureId?: string;
  govermentIdDocumentId?: string;
  landSurveyDocumentId?: string;
  proofOfOwnershipDocumentId?: string;
  taxIdentificationNumberDocumentId?: string;
  address?: LandlordAddressDTO;
  bankAccount?: LandlordBankAccountDTO;
};

type UpdateLandlordResult =
  | { success: true; data: unknown }
  | { success: false; error: string; statusCode?: number };

export const updateLandlord = async (
  landlordId: string,
  body: UpdateLandlordDTO,
  options?: { skipAuth?: boolean },
): Promise<UpdateLandlordResult> => {
  return apiPatch<unknown>(`/landlord/${landlordId}`, body, options);
};
