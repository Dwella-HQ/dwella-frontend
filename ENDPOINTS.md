# API Endpoints (OpenAPI Synced)

This file reflects the backend OpenAPI JSON shared on 2026-04-30.

## Base URL

`https://api-dev.dwella-ng.com`

---

## Auth

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/google-login`
- `POST /auth/facebook-login`
- `GET /auth/verify-email-token?email=...` **(resend verification token/link)**
- `GET /auth/verify-email?token=...&email=...`
- `GET /auth/forgot-password?email=...`
- `POST /auth/reset-password`
- `GET /auth/refresh-token`
- `DELETE /auth/logout/{userId}`

---

## User / RBAC

### User

- `GET /user/me`
- `POST /user`
- `GET /user`
- `GET /user/query`
- `GET /user/{id}`
- `PATCH /user/{id}`
- `DELETE /user/{id}`
- `PATCH /user/{id}/password`

### RBAC

- `POST /rbac/permission`
- `POST /rbac/roles`
- `GET /rbac/roles`
- `POST /rbac/roles/with-permissions`
- `GET /rbac/permissions`
- `GET /rbac/roles/{id}`
- `DELETE /rbac/roles/{id}`
- `GET /rbac/permissions/{id}`
- `DELETE /rbac/permissions/{id}`
- `POST /rbac/roles/{roleId}/permissions`
- `DELETE /rbac/roles/{roleId}/permissions`

---

## Property / Units / Amenities

### Amenities

- `POST /amenities`
- `GET /amenities`
- `GET /amenities/{id}`
- `PATCH /amenities/{id}`
- `DELETE /amenities/{id}`

### Property

- `POST /property`
- `GET /property`
- `GET /property/{id}`
- `PATCH /property/{id}`
- `DELETE /property/{id}`
- `GET /property/bulk-upload`
- `POST /property/bulk-upload/{landlordId}` _(multipart/form-data: `file`)_
- `GET /property/query`
- `GET /property/landlord/{landlordId}`

### Property Settings

- `GET /property/{id}/settings`
- `PATCH /property/{id}/settings/grace-period`
- `PATCH /property/{id}/settings/late-fee`

### Units via Property

- `POST /property/{id}/unit`
- `GET /property/{id}/units`
- `GET /property/unit/{unitId}`
- `PATCH /property/unit/{unitId}`
- `DELETE /property/unit/{unitId}`

---

## Landlord

- `POST /landlord`
- `GET /landlord`
- `GET /landlord/{id}`
- `PATCH /landlord/{id}`
- `DELETE /landlord/{id}`
- `GET /landlord/user/{userId}`
- `GET /landlord/query`

### Landlord Settings / Profile / Documents

- `GET /landlord/{id}/settings`
- `PATCH /landlord/{id}/profile`
- `PATCH /landlord/{id}/documents`
- `PATCH /landlord/{id}/settings/platform-preferences`
- `PATCH /landlord/{id}/settings/notification-preferences`
- `PATCH /landlord/{id}/settings/grace-periods`
- `PATCH /landlord/{id}/settings/late-fee`

---

## Tenant

- `POST /tenant`
- `GET /tenant`
- `GET /tenant/{id}`
- `PATCH /tenant/{id}`
- `DELETE /tenant/{id}`
- `GET /tenant/user/{userId}`

### Tenant Invitations

- `POST /tenant/invite`
- `GET /tenant/invite/query`
- `GET /tenant/invite/accept-invite?token=...`
- `GET /tenant/invite/reject-invite?token=...`

---

## Property Manager

- `POST /property-manager`
- `GET /property-manager`
- `GET /property-manager/{id}`
- `PATCH /property-manager/{id}`
- `DELETE /property-manager/{id}`
- `GET /property-manager/landlord/{landlordId}`
- `GET /property-manager/user/{userId}`
- `GET /property-manager/property/{propertyId}`
- `POST /property-manager/invite/{landlordId}`
- `GET /property-manager/invite/accept-invite?token=...`
- `GET /property-manager/invite/reject-invite?token=...`

---

## Maintenance Requests

### Request Types

- `POST /maintenance-request-types`
- `GET /maintenance-request-types`
- `POST /maintenance-request-types/{typeId}/subtype`
- `GET /maintenance-request-types/{typeId}/subtypes`
- `GET /maintenance-request-types/{id}`
- `PATCH /maintenance-request-types/{id}`
- `DELETE /maintenance-request-types/{id}`
- `PATCH /maintenance-request-types/subtype/{subTypeId}`
- `DELETE /maintenance-request-types/subtype/{subTypeId}`
- `GET /maintenance-request-types/name/{name}`
- `DELETE /maintenance-request-types/subtype/{typeId}`

### Maintenance Requests

- `POST /maintenance-request`
- `GET /maintenance-request`
- `GET /maintenance-request/query`
- `GET /maintenance-request/{id}`
- `PATCH /maintenance-request/{id}`
- `DELETE /maintenance-request/{id}`
- `PATCH /maintenance-request/{id}/status`

---

## Address

- `POST /address/user/{userId}`
- `GET /address/user/{userId}`
- `GET /address`
- `GET /address/{id}`
- `PATCH /address/{id}`
- `DELETE /address/{id}`

---

## Wallet / Transactions / Payments

### Wallet

- `POST /wallet/landlord`
- `POST /wallet/{id}/vba`
- `GET /wallet`
- `GET /wallet/{id}`
- `GET /wallet/landlord/{landlordId}`
- `POST /wallet/{id}/disable`

### Transaction

- `GET /transaction`
- `GET /transaction/success?amount=...`
- `GET /transaction/{id}`
- `DELETE /transaction/{id}`

### Deposit

- `POST /deposit` _(requires `Idempotency-Key` header)_
- `GET /deposit`
- `GET /deposit/{id}`
- `GET /deposit/reference/{reference}`
- `GET /deposit/wallet-transaction/{walletTransactionId}`
- `GET /deposit/wallet/{walletId}`

### Withdrawal

- `POST /withdrawal` _(requires `Idempotency-Key` header)_
- `GET /withdrawal`
- `GET /withdrawal/banks/{walletId}`
- `POST /withdrawal/resolve-account`
- `GET /withdrawal/{id}`
- `PATCH /withdrawal/{id}`
- `DELETE /withdrawal/{id}`

### Rent Payment

- `POST /rent-payment` _(requires `Idempotency-Key` header)_
- `GET /rent-payment`
- `GET /rent-payment/{id}`
- `DELETE /rent-payment/{id}`

### Rent

- `POST /rent`
- `PATCH /rent/{rentId}/status/paid`
- `GET /rent/lease/leaseId` _(literal path; returns all rents—filter client-side by tenant’s `leaseId` / nested `lease.id`)_

---

## File

- `POST /file` _(multipart/form-data)_
- `DELETE /file/{id}`

---

## Settings

- `GET /settings`
- `PATCH /settings/update`

---

## Verification

- `POST /verification/lanlord/{landlordId}` _(note: backend path currently uses `lanlord` typo)_
- `POST /verification/property/{propertyId}`
- `GET /verification`
- `GET /verification/query`
- `GET /verification/{id}`
- `DELETE /verification/{id}`
- `PATCH /verification/{id}/landlord/status`
- `PATCH /verification/{id}/property/status`

---

## Announcement

- `POST /announcement/landlord/{landlordId}`
- `POST /announcement/property/{propertyId}`
- `GET /announcement`
- `GET /announcement/{id}`
- `PATCH /announcement/{id}/landlord`
- `DELETE /announcement/{id}/landlord`
- `PATCH /announcement/{id}/property`
- `DELETE /announcement/{id}/property`

---

## Webhooks

- `POST /webhooks/paystack`
- `POST /webhooks/flutterwave`
- `POST /webhooks/monnify`

---

## Other

- `GET /` (App hello route)
- Agent module:
  - `POST /agent`
  - `GET /agent`
  - `GET /agent/{id}`
  - `PATCH /agent/{id}`
  - `DELETE /agent/{id}`

---

## Notes

- This file is now an endpoint inventory from OpenAPI, not a frontend "implemented vs not implemented" tracker.
- For auth resend verification, frontend should call:
  - `GET /auth/verify-email-token?email={email}`
- Newly added in this sync (compared to previous endpoint inventory):
  - `GET /property/bulk-upload`
  - `POST /property/bulk-upload/{landlordId}`
  - `GET /tenant/invite/query`
  - `GET /property-manager/property/{propertyId}`
  - `POST /rent`
  - `PATCH /rent/{rentId}/status/paid`
  - `GET /rent/lease/leaseId` _(aggregate list; not `/rent/lease/{uuid}`)_
- Frontend wiring (property dashboard Settings): `GET /property/{id}/settings`, `PATCH …/grace-period`, `PATCH …/late-fee`, `POST /verification/property/{propertyId}`.
