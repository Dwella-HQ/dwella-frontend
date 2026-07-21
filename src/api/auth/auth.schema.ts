import { z } from "zod";

// Login Request
export const loginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type LoginRequestDTO = z.infer<typeof loginRequestSchema>;

// Login Response
export const walletSchema = z.object({
  balance: z.string(),
});

export const authorizationSchema = z.object({
  token: z.string(),
  expiresIn: z.number(),
});

export const partnerSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string(),
  device_token: z.string().nullable(),
  role: z.string(),
  isActive: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable(),
  wallet: walletSchema,
  authorization: authorizationSchema,
});

export const loginResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: partnerSchema,
});

export type WalletDTO = z.infer<typeof walletSchema>;
export type AuthorizationDTO = z.infer<typeof authorizationSchema>;
export type PartnerDTO = z.infer<typeof partnerSchema>;
export type LoginResponseDTO = z.infer<typeof loginResponseSchema>;

// Password Reset Request
export const passwordResetRequestSchema = z.object({
  email: z.string().email(),
});

export type PasswordResetRequestDTO = z.infer<
  typeof passwordResetRequestSchema
>;

export const passwordResetResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export type PasswordResetResponseDTO = z.infer<
  typeof passwordResetResponseSchema
>;

// Reset Password (with OTP)
export const resetPasswordRequestSchema = z.object({
  token: z.string().min(1, "OTP is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type ResetPasswordRequestDTO = z.infer<
  typeof resetPasswordRequestSchema
>;

export const resetPasswordResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    email: z.string().email(),
  }),
});

export type ResetPasswordResponseDTO = z.infer<
  typeof resetPasswordResponseSchema
>;

// Role object from API (defined early so it can be used in other schemas)
export const roleSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type RoleDTO = z.infer<typeof roleSchema>;

// Partner Profile (updated to match actual API response)
export const profileWalletSchema = z
  .object({
    balance: z.string(),
  })
  .optional();

export const profileDataSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  registrationType: z.string().optional(),
  fullName: z.string().optional(),
  name: z.string().optional(),
  phoneNumber: z.string().nullable().optional(),
  phone: z.string().optional(),
  isEmailVerified: z.boolean().optional(),
  isActive: z.boolean().optional(),
  role: roleSchema,
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  // Optional fields that may not be present
  device_token: z.string().nullable().optional(),
  isSuspended: z.number().optional(),
  notification_count: z.number().optional(),
  profilePicture: z
    .object({ id: z.string(), url: z.string().url() })
    .optional()
    .nullable(),
  account_mode: z.preprocess(
    (val) => {
      // Handle null, undefined, or convert to string
      if (val == null) return "sandbox";
      const str = String(val).toLowerCase().trim();
      return str === "sandbox" || str === "live" ? str : "sandbox";
    },
    z.union([z.literal("sandbox"), z.literal("live")]).optional(),
  ),
  deletedAt: z.string().nullable().optional(),
  wallet: profileWalletSchema.optional(),
});

export const profileResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: profileDataSchema,
});

export type ProfileWalletDTO = z.infer<typeof profileWalletSchema>;
export type ProfileDataDTO = z.infer<typeof profileDataSchema>;
export type ProfileResponseDTO = z.infer<typeof profileResponseSchema>;

// API Key
export const apiKeyResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    apiKey: z.string().nullable(),
  }),
});

export type ApiKeyResponseDTO = z.infer<typeof apiKeyResponseSchema>;

// Change Password
export const changePasswordRequestSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ChangePasswordRequestDTO = z.infer<
  typeof changePasswordRequestSchema
>;

export const changePasswordResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export type ChangePasswordResponseDTO = z.infer<
  typeof changePasswordResponseSchema
>;

// Register Request
export const registerRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  roleName: z.enum([
    "tenant",
    "landlord",
    "admin",
    "manager",
    "property_manager",
    "user", // public guest / short-stay role in OpenAPI
    "guest", // tolerate if backend aliases guest → user
    "super_admin",
    "sub_admin",
    "agent",
    "maintenance_staff",
  ]),
  fullName: z.string().min(1, "Full name is required"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  registrationType: z.enum(["EMAIL", "GOOGLE", "FACEBOOK"]).default("EMAIL"),
  propertyManagerId: z.string().uuid().optional(), // For property manager invitations
  tenantId: z.string().uuid().optional(), // For tenant invitations (signup link with tenant-id)
});

export type RegisterRequestDTO = z.infer<typeof registerRequestSchema>;

// Register Response (different from login - no accessToken, user needs to verify email)
// Note: API has typo "sucess" instead of "success" - we handle both
export const registerResponseSchema = z
  .object({
    sucess: z.boolean().optional(), // API typo
    success: z.boolean().optional(), // Correct spelling (for future compatibility)
    message: z.string(),
    data: z
      .object({
        email: z.string().email(),
        registrationType: z.string(),
        fullName: z.string(),
        phoneNumber: z.string(),
        role: roleSchema,
        id: z.string(),
        isEmailVerified: z.boolean(),
        isActive: z.boolean(),
        createdAt: z.string(),
        updatedAt: z.string(),
      })
      .passthrough(),
  })
  .passthrough()
  .refine((data) => data.sucess === true || data.success === true, {
    message: "Response must have either 'sucess' or 'success' set to true",
  });

export type RegisterResponseDTO = z.infer<typeof registerResponseSchema>;

// Social Login Request (POST /auth/google-login, POST /auth/facebook-login)
export const socialLoginRequestSchema = z.object({
  token: z.string().min(1, "OAuth token is required"),
  roleName: z.enum([
    "tenant",
    "landlord",
    "admin",
    "manager",
    "property_manager",
    "user",
    "guest",
    "super_admin",
    "sub_admin",
    "agent",
    "maintenance_staff",
  ]),
});

export type SocialLoginRequestDTO = z.infer<typeof socialLoginRequestSchema>;

// Social Login Response (same as new login response format)
export type SocialLoginResponseDTO = NewLoginResponseDTO;

// Verify Email Request
export const verifyEmailRequestSchema = z.object({
  token: z.string(),
  email: z.string().email(),
});

export type VerifyEmailRequestDTO = z.infer<typeof verifyEmailRequestSchema>;

export const verifyEmailResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export type VerifyEmailResponseDTO = z.infer<typeof verifyEmailResponseSchema>;

// Logout Response
export const logoutResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export type LogoutResponseDTO = z.infer<typeof logoutResponseSchema>;

// User object from API
export const apiUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  registrationType: z.string().optional(),
  fullName: z.string().optional(),
  name: z.string().optional(),
  phoneNumber: z.string().nullable(),
  phone: z.string().optional(),
  isEmailVerified: z.boolean().optional(),
  isActive: z.boolean().optional(),
  role: roleSchema,
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type ApiUserDTO = z.infer<typeof apiUserSchema>;

// Updated Login Response (based on actual API format)
export const newLoginResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    accessToken: z.string(),
    user: apiUserSchema,
  }),
});

export type NewLoginResponseDTO = z.infer<typeof newLoginResponseSchema>;
