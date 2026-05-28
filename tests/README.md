# Test Notes

This repo uses Node's built-in test runner for lightweight contract tests.

Run safe tests:

```powershell
npm test
```

Run browser E2E tests:

```powershell
npm run test:e2e
```

The E2E suite starts the local Next.js dev server on `E2E_PORT` or port `3100`
unless `E2E_BASE_URL` is set. It creates timestamped backend accounts for
landlord and property manager, then verifies role-based login routing in a real
Chromium browser.

Tenant browser E2E needs a tenant account that already has an attached tenant
record. Provide one to enable that test:

```powershell
$env:E2E_TENANT_EMAIL="tenant@example.com"
$env:E2E_TENANT_PASSWORD="password"
npm run test:e2e
```

Run live auth smoke tests against `NEXT_PUBLIC_API_BASE_URL`:

```powershell
$env:RUN_LIVE_API_TESTS="1"
npm test
```

The live role test creates timestamped accounts for every documented role and
then logs in with each account. It intentionally skips unless opted in because
it mutates backend state and may send verification emails.

To check the refresh-token login contract for an existing account:

```powershell
$env:RUN_LIVE_API_TESTS="1"
$env:LIVE_TEST_EMAIL="someone@example.com"
$env:LIVE_TEST_PASSWORD="password"
npm test
```
