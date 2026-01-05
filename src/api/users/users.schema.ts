import { z } from "zod";

export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: z.string(),
  status: z.enum(["active", "inactive", "invited"]).default("active"),
  createdAt: z.string().datetime(),
});

export const usersResponseSchema = z.object({
  data: z.array(userSchema),
});

export type UserDTO = z.infer<typeof userSchema>;
export type UsersResponseDTO = z.infer<typeof usersResponseSchema>;


