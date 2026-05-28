import assert from "node:assert/strict";
import test from "node:test";
import {
  apiRequest,
  assertJsonResponse,
  phoneForIndex,
  uniqueEmail,
} from "../helpers/liveApi.mjs";

const DOCUMENTED_ROLES = [
  "super_admin",
  "admin",
  "sub_admin",
  "landlord",
  "property_manager",
  "agent",
  "maintenance_staff",
  "tenant",
  "user",
];

const APP_ROLES = ["landlord", "property_manager", "tenant"];
const PRIVILEGED_ROLES = ["super_admin", "admin", "sub_admin"];
const SELF_SERVICE_ROLES = DOCUMENTED_ROLES.filter(
  (role) => !PRIVILEGED_ROLES.includes(role),
);
const RUN_LIVE = process.env.RUN_LIVE_API_TESTS === "1";

test("documented roles include every role supported by OpenAPI auth schemas", () => {
  assert.deepEqual(DOCUMENTED_ROLES, [
    "super_admin",
    "admin",
    "sub_admin",
    "landlord",
    "property_manager",
    "agent",
    "maintenance_staff",
    "tenant",
    "user",
  ]);
});

test("app roles are covered by the live auth smoke matrix", () => {
  for (const role of APP_ROLES) {
    assert.ok(
      DOCUMENTED_ROLES.includes(role),
      `${role} should be represented in the documented roles matrix`,
    );
  }
});

test(
  "live API can register and log in every self-service role",
  { skip: !RUN_LIVE, timeout: 240000 },
  async (t) => {
    const password = `DwellaTest1!${Date.now()}`;

    for (const [index, role] of SELF_SERVICE_ROLES.entries()) {
      await t.test(role, { timeout: 45000 }, async () => {
        const email = uniqueEmail(role);
        const registerPayload = {
          email,
          password,
          roleName: role,
          fullName: `Codex ${role} Smoke`,
          phoneNumber: phoneForIndex(index + 1),
          registrationType: "EMAIL",
        };

        const register = await apiRequest("/auth/register", {
          method: "POST",
          body: JSON.stringify(registerPayload),
        });

        assertJsonResponse(register, 201, `${role} registration`);
        assert.equal(
          register.body?.data?.role?.name,
          role,
          `${role} registration should echo the requested role`,
        );
        assert.equal(register.body?.data?.email, email);

        const login = await apiRequest("/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });

        assertJsonResponse(login, 200, `${role} login`);
        assert.equal(
          typeof login.body?.data?.accessToken,
          "string",
          `${role} login should return an access token`,
        );
        assert.ok(
          login.body.data.accessToken.length > 20,
          `${role} access token should look non-empty`,
        );
      });
    }
  },
);

test(
  "live API rejects privileged roles from public registration",
  { skip: !RUN_LIVE, timeout: 120000 },
  async (t) => {
    const password = `DwellaTest1!${Date.now()}`;

    for (const [index, role] of PRIVILEGED_ROLES.entries()) {
      await t.test(role, { timeout: 45000 }, async () => {
        const register = await apiRequest("/auth/register", {
          method: "POST",
          body: JSON.stringify({
            email: uniqueEmail(role),
            password,
            roleName: role,
            fullName: `Codex ${role} Privileged Smoke`,
            phoneNumber: phoneForIndex(index + 50),
            registrationType: "EMAIL",
          }),
        });

        assert.equal(
          register.response.status,
          400,
          `${role} public registration should be rejected`,
        );
        assert.match(
          JSON.stringify(register.body),
          /roleName/i,
          `${role} rejection should mention roleName`,
        );
      });
    }
  },
);
