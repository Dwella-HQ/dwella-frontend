import { expect } from "@playwright/test";
import { apiRequest, phoneForIndex, uniqueEmail } from "../../helpers/liveApi.mjs";

export async function createRoleAccount(role, index = 1) {
  const email = uniqueEmail(`e2e-${role}`);
  const password = `DwellaTest1!${Date.now()}${index}`;
  const register = await apiRequest("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
      roleName: role,
      fullName: `E2E ${role} User`,
      phoneNumber: phoneForIndex(index + 100),
      registrationType: "EMAIL",
    }),
    timeoutMs: 45_000,
  });

  expect(register.response.status, register.text).toBe(201);
  return { role, email, password };
}

export async function loginThroughUi(page, account) {
  await page.goto("/auth/login");
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  await page.getByLabel("Email").fill(account.email);
  await page.getByRole("textbox", { name: "Password" }).fill(account.password);
  await page.getByRole("button", { name: "Log In" }).click();
}
