import assert from "node:assert/strict";
import { request as httpsRequest } from "node:https";
import { apiBaseUrl } from "./env.mjs";

const DEFAULT_TIMEOUT_MS = 30000;

export async function apiRequest(path, options = {}) {
  const baseUrl = apiBaseUrl().replace(/\/+$/, "");
  const url = new URL(`${baseUrl}${path}`);
  const body = options.body ?? null;
  const headers = {
    "ngrok-skip-browser-warning": "true",
    ...(body ? { "Content-Type": "application/json" } : {}),
    ...(body ? { "Content-Length": Buffer.byteLength(String(body)) } : {}),
    ...(options.headers || {}),
  };

  return new Promise((resolve, reject) => {
    const req = httpsRequest(
      url,
      {
        method: options.method || "GET",
        headers,
        timeout: options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
      },
      (res) => {
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          const text = Buffer.concat(chunks).toString("utf8");
          let parsedBody = null;
          if (text) {
            try {
              parsedBody = JSON.parse(text);
            } catch {
              parsedBody = text;
            }
          }
          resolve({
            response: {
              status: res.statusCode,
              headers: {
                get(name) {
                  const value = res.headers[String(name).toLowerCase()];
                  return Array.isArray(value) ? value[0] : value || null;
                },
              },
            },
            body: parsedBody,
            text,
          });
        });
      },
    );

    req.on("timeout", () => {
      req.destroy(new Error(`Request timed out after ${options.timeoutMs ?? DEFAULT_TIMEOUT_MS}ms`));
    });

    req.on("error", reject);

    if (body) {
      req.write(body);
    }
    req.end();
  });
}

export function uniqueEmail(role) {
  const stamp = new Date()
    .toISOString()
    .replace(/[-:.TZ]/g, "")
    .slice(0, 14);
  const random = Math.random().toString(36).slice(2, 8);
  return `codex+${role}+${stamp}+${random}@example.com`;
}

export function phoneForIndex(index) {
  const suffix = `${Date.now()}${index}`.slice(-8);
  return `+23480${suffix}`;
}

export function assertJsonResponse(result, expectedStatus, label) {
  assert.equal(
    result.response.status,
    expectedStatus,
    `${label} expected ${expectedStatus}, got ${result.response.status}: ${result.text}`,
  );
  assert.equal(
    typeof result.body,
    "object",
    `${label} should return a JSON object`,
  );
}
