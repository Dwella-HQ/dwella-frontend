import { apiGet } from "@/lib/apiClient";

export type GetBulkUploadTemplateResult =
  | { success: true; data: Blob | unknown }
  | { success: false; error: string; statusCode?: number };

export const getBulkUploadTemplate =
  async (): Promise<GetBulkUploadTemplateResult> => {
    return apiGet<Blob | unknown>("/property/bulk-upload", {
      responseType: "blob",
    });
  };
