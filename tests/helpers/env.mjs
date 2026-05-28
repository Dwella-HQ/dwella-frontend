import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export function loadDotEnv() {
  const envPath = resolve(process.cwd(), ".env");
  let raw = "";
  try {
    raw = readFileSync(envPath, "utf8");
  } catch {
    return;
  }

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

export function apiBaseUrl() {
  loadDotEnv();
  return process.env.NEXT_PUBLIC_API_BASE_URL || "https://api-dev.dwella-ng.com";
}
