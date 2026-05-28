import assert from "node:assert/strict";
import test from "node:test";
import { apiRequest, assertJsonResponse } from "../helpers/liveApi.mjs";

const RUN_LIVE = process.env.RUN_LIVE_API_TESTS === "1";
const TEST_EMAIL = process.env.LIVE_TEST_EMAIL;
const TEST_PASSWORD = process.env.LIVE_TEST_PASSWORD;

test("refresh-token live check is opt-in and credential-gated", {
  skip: RUN_LIVE && TEST_EMAIL && TEST_PASSWORD ? false : true,
}, async () => {
  const login = await apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    }),
  });

  assertJsonResponse(login, 200, "login");
  assert.equal(typeof login.body?.data?.accessToken, "string");

  const refreshHeader =
    login.response.headers.get("x-refresh-token") ||
    login.response.headers.get("X-Refresh-Token");

  assert.ok(
    refreshHeader || login.body?.data?.refreshToken,
    "backend should provide a refresh token in x-refresh-token or response body",
  );
});
