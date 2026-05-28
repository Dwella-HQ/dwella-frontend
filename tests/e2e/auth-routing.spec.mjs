import { expect, test } from "@playwright/test";
import { createRoleAccount, loginThroughUi } from "./helpers/auth.mjs";

test.describe("role login routing", () => {
  let accounts;

  test.beforeAll(async () => {
    accounts = {
      landlord: await createRoleAccount("landlord", 1),
      manager: await createRoleAccount("property_manager", 2),
      tenant:
        process.env.E2E_TENANT_EMAIL && process.env.E2E_TENANT_PASSWORD
          ? {
              role: "tenant",
              email: process.env.E2E_TENANT_EMAIL,
              password: process.env.E2E_TENANT_PASSWORD,
            }
          : null,
    };
  });

  test("landlord logs in and is routed to onboarding or dashboard", async ({
    page,
  }) => {
    await loginThroughUi(page, accounts.landlord);
    await expect(page).toHaveURL(/\/(onboarding\/landlord\/details|dashboard)(\?.*)?$/);
  });

  test("property manager logs in and is routed to landlord selection", async ({
    page,
  }) => {
    await loginThroughUi(page, accounts.manager);
    await expect(page).toHaveURL(/\/dashboard\/select-landlord(\?.*)?$/);
    await expect(
      page.getByRole("heading", { name: "Select Landlord Account" }),
    ).toBeVisible();
  });

  test("tenant logs in and reaches the dashboard", async ({ page }) => {
    test.skip(
      !accounts.tenant,
      "Set E2E_TENANT_EMAIL and E2E_TENANT_PASSWORD for a tenant with an attached tenant record.",
    );
    await loginThroughUi(page, accounts.tenant);
    await expect(page).toHaveURL(/\/dashboard(\?.*)?$/);
    await expect(page.getByText(/dashboard|rent|maintenance|messages/i).first()).toBeVisible();
  });
});
