import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/apiClient";

type ApiResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; statusCode?: number };

export type AgentBody = Record<string, unknown>;

export const createAgent = (body: AgentBody = {}): Promise<ApiResult<unknown>> =>
  apiPost<unknown>("/agent", body);

export const getAgents = (): Promise<ApiResult<unknown>> =>
  apiGet<unknown>("/agent");

export const getAgent = (id: string): Promise<ApiResult<unknown>> =>
  apiGet<unknown>(`/agent/${encodeURIComponent(id)}`);

export const updateAgent = (
  id: string,
  body: AgentBody,
): Promise<ApiResult<unknown>> =>
  apiPatch<unknown>(`/agent/${encodeURIComponent(id)}`, body);

export const deleteAgent = (id: string): Promise<ApiResult<unknown>> =>
  apiDelete<unknown>(`/agent/${encodeURIComponent(id)}`);
