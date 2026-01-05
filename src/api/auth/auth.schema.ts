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

export type PasswordResetRequestDTO = z.infer<typeof passwordResetRequestSchema>;

export const passwordResetResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export type PasswordResetResponseDTO = z.infer<typeof passwordResetResponseSchema>;

// Reset Password (with OTP)
export const resetPasswordRequestSchema = z.object({
  token: z.string().min(1, "OTP is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type ResetPasswordRequestDTO = z.infer<typeof resetPasswordRequestSchema>;

export const resetPasswordResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    email: z.string().email(),
  }),
});

export type ResetPasswordResponseDTO = z.infer<typeof resetPasswordResponseSchema>;

// Partner Profile
export const profileWalletSchema = z.object({
  balance: z.string(),
});

export const profileDataSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string(),
  device_token: z.string().nullable(),
  role: z.string(),
  isActive: z.number(),
  isSuspended: z.number(),
  notification_count: z.number(),
  account_mode: z.preprocess(
    (val) => {
      // Handle null, undefined, or convert to string
      if (val == null) return "sandbox";
      const str = String(val).toLowerCase().trim();
      return str === "sandbox" || str === "live" ? str : "sandbox";
    },
    z.union([z.literal("sandbox"), z.literal("live")])
  ),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable(),
  wallet: profileWalletSchema,
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
export const changePasswordRequestSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export type ChangePasswordRequestDTO = z.infer<typeof changePasswordRequestSchema>;

export const changePasswordResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export type ChangePasswordResponseDTO = z.infer<typeof changePasswordResponseSchema>;

