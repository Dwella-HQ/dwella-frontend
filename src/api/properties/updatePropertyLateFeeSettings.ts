import { apiPatch } from "@/lib/apiClient";

/** `PATCH /property/{id}/settings/late-fee` (OpenAPI UpdatePropertyLateFeeDto) */
export type UpdatePropertyLateFeeDTO = {
  lateFeeAmount: number;
  lateFeeType: "fixed" | "percentage";
};

type Result =
  | { success: true; data: Record<string, unknown> }
  | { success: false; error: string; statusCode?: number };

export const updatePropertyLateFeeSettings = async (
  propertyId: string,
  body: UpdatePropertyLateFeeDTO,
): Promise<Result> => {
  const result = await apiPatch<{
    success?: boolean;
    message?: string;
    data?: Record<string, unknown>;
  }>(`/property/${encodeURIComponent(propertyId)}/settings/late-fee`, body);

  if (!result.success) {
    return result;
  }

  return {
    success: true,
    data:
      (result.data as { data?: Record<string, unknown> })?.data ??
      (result.data as unknown as Record<string, unknown>),
  };
};
