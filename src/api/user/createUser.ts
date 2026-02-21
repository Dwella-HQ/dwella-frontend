import { apiPost } from "@/lib/apiClient";
import { z } from "zod";

// Create User Request Schema (for /user endpoint)
export const createUserRequestSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  roleName: z.enum(["tenant", "landlord", "admin", "manager", "property_manager"]),
  fullName: z.string().min(1, "Full name is required"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  registrationType: z.enum(["EMAIL", "GOOGLE", "FACEBOOK"]).default("EMAIL"),
  propertyManagerId: z.string().uuid().optional(),
});

export type CreateUserRequestDTO = z.infer<typeof createUserRequestSchema>;

// Create User Response Schema
export const createUserResponseSchema = z.object({
  success: z.boolean().optional(),
  message: z.string().optional(),
  data: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    fullName: z.string(),
    phoneNumber: z.string(),
    role: z.object({
      id: z.string().uuid(),
      name: z.string(),
    }),
    isEmailVerified: z.boolean().optional(),
    isActive: z.boolean().optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
  }).optional(),
});

export type CreateUserResponseDTO = z.infer<typeof createUserResponseSchema>;

type CreateUserResult =
  | { success: true; data: CreateUserResponseDTO }
  | { success: false; error: string };

export const createUser = async (data: CreateUserRequestDTO): Promise<CreateUserResult> => {
  const result = await apiPost<CreateUserResponseDTO>("/user", data, {
    skipAuth: true,
  });

  if (!result.success) {
    return result;
  }

  // Validate response with Zod
  try {
    const parsed = createUserResponseSchema.parse(result.data);
    return { success: true, data: parsed };
  } catch (parseError) {
    console.error("Create user schema validation error:", parseError);
    console.error("Received data:", JSON.stringify(result.data, null, 2));
    return {
      success: false,
      error: "Invalid response data format received",
    };
  }
};


