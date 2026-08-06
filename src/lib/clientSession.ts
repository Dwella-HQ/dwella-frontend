/**
 * Clears client-side auth and landlord/tenant selection caches before a new session.
 */
export function resetClientSession(): void {
  if (typeof window === "undefined") return;

  const localKeysToClear = [
    "user",
    "authToken",
    "accessToken",
    "refreshToken",
    "userId",
    "landlordId",
    "tenantId",
    "leaseId",
    "selectedLandlord",
    "selectedLandlordId",
    "lastCreatedPropertyId",
  ];
  localKeysToClear.forEach((k) => localStorage.removeItem(k));
  // The refresh token may live in sessionStorage instead of localStorage
  // when "Keep me logged in" was unchecked — clear both defensively.
  sessionStorage.removeItem("refreshToken");

  const sessionKeysToClear = [
    "landlordOnboardingDetails",
    "landlordOnboardingDocumentIds",
    "landlordOnboardingProfilePictureId",
    "landlordOnboardingFinance",
    "landlordOnboardingKyc",
    "landlordOnboardingKyb",
    "landlordOnboardingStarted",
    "propertyManagerOnboardingDetails",
    "propertyManagerOnboardingKyc",
    "propertyManagerOnboardingProfilePictureId",
    "propertyManagerOnboardingStarted",
    "tenantOnboardingDetails",
    "tenantOnboardingKyc",
    "tenantOnboardingProfilePictureId",
    "tenantOnboardingInviteTenantId",
    "tenantOnboardingStarted",
  ];
  sessionKeysToClear.forEach((k) => sessionStorage.removeItem(k));

  const expired = "Thu, 01 Jan 1970 00:00:00 GMT";
  document.cookie = `selectedLandlord=; Path=/; Expires=${expired}; SameSite=Lax`;
  document.cookie = `selectedLandlordId=; Path=/; Expires=${expired}; SameSite=Lax`;
  document.cookie = `accessToken=; Path=/; Expires=${expired}; SameSite=Lax`;
  document.cookie = `authToken=; Path=/; Expires=${expired}; SameSite=Lax`;
  document.cookie = `landlordId=; Path=/; Expires=${expired}; SameSite=Lax`;
}

export function persistFreshAuth(userId: string, accessToken: string): void {
  if (typeof window === "undefined") return;

  localStorage.setItem("userId", userId);
  localStorage.setItem("accessToken", accessToken);
  localStorage.setItem("authToken", accessToken);

  const maxAge = 60 * 60 * 24 * 7;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `accessToken=${encodeURIComponent(accessToken)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
  document.cookie = `authToken=${encodeURIComponent(accessToken)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
}
