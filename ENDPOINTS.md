# API Endpoints Implementation Status

This document tracks all API endpoints needed for the Dwella NG application, organized by role and feature.

## Base URL
`http://dwella-dev.us-east-1.elasticbeanstalk.com`

---

## 🔐 Authentication Endpoints

### ✅ Implemented
- **POST** `/auth/register` - User registration
- **POST** `/auth/login` - User login
- **GET** `/auth/verify-email?token={token}&email={email}` - Email verification (via redirect)
- **POST** `/auth/forgot-password` - Request password reset
- **POST** `/auth/reset-password` - Reset password with OTP

### ❌ Not Implemented
- **POST** `/auth/resend-verification-email` - Resend verification email
- **POST** `/auth/refresh-token` - Refresh access token
- **POST** `/auth/logout` - Logout (if needed server-side)

---

## 👤 Landlord Endpoints

### ✅ Implemented
- **POST** `/landlord` - Create landlord (onboarding)
- **GET** `/landlord/user/{userId}` - Get landlord by user ID
- **GET** `/landlord/{landlordId}` - Get landlord by ID
- **GET** `/property/landlord/{landlordId}` - Get all properties for a landlord
- **GET** `/property/{propertyId}` - Get single property details
- **GET** `/property/{propertyId}/units` - Get units for a property
- **POST** `/property` - Create property
- **POST** `/property/{propertyId}/unit` - Create unit for a property
- **POST** `/file` - Upload file (photos, documents)
- **DELETE** `/file/{fileId}` - Delete file

### ❌ Not Implemented
- **PATCH** `/landlord/{landlordId}` - Update landlord profile
- **GET** `/landlord/{landlordId}/properties` - Alternative endpoint (if different from `/property/landlord/{landlordId}`)
- **PATCH** `/property/{propertyId}` - Update property
- **DELETE** `/property/{propertyId}` - Delete property
- **PATCH** `/property/{propertyId}/unit/{unitId}` - Update unit
- **DELETE** `/property/{propertyId}/unit/{unitId}` - Delete unit
- **GET** `/property/{propertyId}/tenants` - Get tenants for a property
- **POST** `/property/{propertyId}/tenant` - Assign tenant to property/unit
- **GET** `/property/{propertyId}/payments` - Get payment history for property
- **GET** `/property/{propertyId}/maintenance` - Get maintenance requests for property
- **GET** `/property/{propertyId}/documents` - Get documents for property
- **POST** `/property/{propertyId}/document` - Upload document to property
- **GET** `/unit/{unitId}` - Get single unit details
- **GET** `/unit/{unitId}/tenant` - Get tenant assigned to unit
- **GET** `/unit/{unitId}/payments` - Get payment history for unit
- **GET** `/unit/{unitId}/maintenance` - Get maintenance requests for unit

---

## 🏢 Property Manager Endpoints

### ✅ Implemented
- **GET** `/property` - Get all properties (for managers with access)
- **GET** `/property/{propertyId}` - Get property details
- **GET** `/property/{propertyId}/units` - Get units for a property

### ❌ Not Implemented
- **GET** `/manager/{managerId}/landlords` - Get landlords assigned to manager
- **GET** `/manager/{managerId}/properties` - Get properties managed by manager
- **POST** `/manager/invite` - Invite new property manager
- **GET** `/manager/{managerId}/tenants` - Get all tenants across managed properties
- **GET** `/manager/{managerId}/payments` - Get all payments across managed properties
- **GET** `/manager/{managerId}/maintenance` - Get all maintenance requests
- **POST** `/property/{propertyId}/assign-manager` - Assign manager to property

---

## 👥 Tenant Endpoints

### ❌ Not Implemented
- **GET** `/tenant/{tenantId}` - Get tenant profile
- **GET** `/tenant/{tenantId}/unit` - Get unit assigned to tenant
- **GET** `/tenant/{tenantId}/payments` - Get payment history
- **GET** `/tenant/{tenantId}/maintenance` - Get maintenance requests
- **POST** `/tenant/{tenantId}/maintenance` - Create maintenance request
- **POST** `/tenant/{tenantId}/payment` - Make payment
- **GET** `/tenant/{tenantId}/notifications` - Get notifications

---

## 💰 Payment Endpoints

### ❌ Not Implemented
- **GET** `/payment` - Get all payments (filtered by role)
- **GET** `/payment/{paymentId}` - Get payment details
- **POST** `/payment` - Create payment record
- **PATCH** `/payment/{paymentId}` - Update payment status
- **GET** `/payment/overdue` - Get overdue payments
- **GET** `/payment/upcoming` - Get upcoming payments

---

## 🔧 Maintenance Endpoints

### ❌ Not Implemented
- **GET** `/maintenance` - Get all maintenance requests (filtered by role)
- **GET** `/maintenance/{requestId}` - Get maintenance request details
- **POST** `/maintenance` - Create maintenance request
- **PATCH** `/maintenance/{requestId}` - Update maintenance request
- **PATCH** `/maintenance/{requestId}/status` - Update maintenance status
- **POST** `/maintenance/{requestId}/comment` - Add comment to request
- **GET** `/maintenance/{requestId}/comments` - Get comments for request

---

## 📄 Document Endpoints

### ✅ Implemented
- **POST** `/file` - Upload file
- **DELETE** `/file/{fileId}` - Delete file

### ❌ Not Implemented
- **GET** `/file/{fileId}` - Get file details
- **GET** `/file/{fileId}/download` - Download file
- **GET** `/property/{propertyId}/files` - Get all files for property
- **GET** `/unit/{unitId}/files` - Get all files for unit

---

## 📢 Notification Endpoints

### ✅ Implemented (Partial)
- **GET** `/notification` - Get notifications (used in DashboardHeader)

### ❌ Not Implemented
- **PATCH** `/notification/{notificationId}/read` - Mark notification as read
- **PATCH** `/notification/read-all` - Mark all notifications as read
- **POST** `/notification` - Create notification (for announcements)
- **GET** `/notification/unread-count` - Get unread notification count

---

## 👨‍💼 Admin/Super Admin Endpoints

### ❌ Not Implemented
- **GET** `/admin/users` - Get all users
- **GET** `/admin/landlords` - Get all landlords
- **GET** `/admin/properties` - Get all properties
- **POST** `/admin/property/{propertyId}/approve` - Approve property
- **POST** `/admin/property/{propertyId}/reject` - Reject property
- **GET** `/admin/analytics` - Get platform analytics
- **GET** `/admin/reports` - Generate reports

---

## 🔍 Search & Filter Endpoints

### ❌ Not Implemented
- **GET** `/search/properties` - Search properties
- **GET** `/search/tenants` - Search tenants
- **GET** `/search/units` - Search units

---

## 📊 Reporting Endpoints

### ❌ Not Implemented
- **GET** `/report/property/{propertyId}/occupancy` - Get occupancy report
- **GET** `/report/property/{propertyId}/revenue` - Get revenue report
- **GET** `/report/landlord/{landlordId}/summary` - Get landlord summary
- **GET** `/report/maintenance/stats` - Get maintenance statistics

---

## Notes

### Image Upload Status
⚠️ **Backend Issue**: Property images are currently not being saved by the backend. Once fixed, we'll need to:
- Update property creation to include `photoIds` array
- Display property photos from the `photos` array in the API response
- Remove placeholder images

### Authentication
- All endpoints (except auth endpoints) require Bearer token authentication
- Token is automatically included via `apiClient`
- 401 responses trigger automatic logout and redirect to login

### Data Flow
- Landlord onboarding: Details → Documents → Complete
- Property creation: Basic Details → Photos → Documents → Units
- Unit creation: Form with photos, amenities, and details

---

## Priority Implementation Order

1. **High Priority** (Core functionality)
   - Property update/delete
   - Unit update/delete
   - Tenant assignment
   - Payment tracking
   - Maintenance requests

2. **Medium Priority** (Enhanced features)
   - Property manager assignment
   - Document management
   - Notification management
   - Search functionality

3. **Low Priority** (Advanced features)
   - Reporting
   - Analytics
   - Admin features

