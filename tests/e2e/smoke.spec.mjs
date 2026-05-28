import { expect, test } from "@playwright/test";

test("public pages render", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/DWELLA|Dwella/i);

  await page.goto("/auth/login");
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();

  await page.goto("/auth/signup");
  await expect(page.getByText(/landlord|tenant|property manager/i).first()).toBeVisible();
});
